from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
import json
import re
import ast
import logging
from dotenv import load_dotenv
from llm import call_llm

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

model = SentenceTransformer("BAAI/bge-small-en-v1.5")


# -------------------------------------------------
# JSON PARSER
# -------------------------------------------------

def parse_llm_json(text: str) -> dict | None:
    if not text:
        return None

    text = re.sub(r"```(?:json)?", "", text)

    start = text.find("{")
    end   = text.rfind("}")

    if start == -1 or end == -1:
        logger.warning("No JSON object found in LLM output.")
        return None

    json_text = text[start:end + 1]
    json_text = re.sub(r"[\x00-\x1f\x7f-\x9f]", "", json_text)

    try:
        return json.loads(json_text)
    except json.JSONDecodeError as e:
        logger.warning("JSON decode error: %s", e)
        return None


# -------------------------------------------------
# SKILL CLEANING
# -------------------------------------------------

def clean_skill_phrase(skill: str) -> list[str]:
    skill = skill.lower().strip()

    # strip parenthesised content before splitting
    # "aws (ec2, s3, bedrock)" → "aws"
    # "opensearch service (aws)" → "opensearch service"
    skill = re.sub(r"\(.*?\)", "", skill)

    # strip qualifier prefixes and suffixes
    skill = re.sub(
        r"\b(proficiency in|proficient in|experience with|experience in|"
        r"knowledge of|familiarity with|working with|hands[- ]on|"
        r"understanding of|capabilities?|basic|advanced|strong)\b",
        "",
        skill,
    )
    skill = re.sub(r"\b(skills?|knowledge|experience)\b", "", skill)
    skill = skill.strip(" .,")

    # split on comma and "and" — NOT slash (slash often means one compound: "ci/cd")
    parts = re.split(r",| and |\|", skill)

    cleaned = []
    for p in parts:
        p = re.sub(r"\s+", " ", p).strip(" .,")
        if len(p) > 1:
            cleaned.append(p)

    return cleaned


# -------------------------------------------------
# SKILL NORMALIZATION
# -------------------------------------------------

def normalize_skills(skill_list: list) -> list[str]:

    clean = []
    extra = []

    for s in skill_list:

        if isinstance(s, dict):
            if not s:
                continue
            s = next(iter(s.values()))

        if isinstance(s, str) and s.startswith("["):
            try:
                parsed = ast.literal_eval(s)
                if isinstance(parsed, list):
                    extra.extend(parsed)
                    continue
            except Exception:
                pass

        for skill in clean_skill_phrase(str(s)):
            clean.append(skill)

    for s in extra:
        for skill in clean_skill_phrase(str(s)):
            clean.append(skill)

    return list(set(clean))


# -------------------------------------------------
# JD SKILL NORMALIZATION
# -------------------------------------------------

def normalize_jd_skill(skill: str) -> str:
    skill = skill.lower()
    skill = skill.replace("(basic)", "")
    skill = skill.replace("/", " ")
    skill = skill.replace(",", " ")
    skill = re.sub(r"\s+", " ", skill)
    return skill.strip()


# -------------------------------------------------
# Split "x or y" compound JD skills
# -------------------------------------------------

def expand_jd_skills(skills: list[str]) -> list[str]:
    expanded = []
    for s in skills:
        parts = re.split(r"\s+or\s+", s)
        for p in parts:
            p = p.strip()
            if p:
                expanded.append(p)
    return list(set(expanded))


# -------------------------------------------------
# SEMANTIC DEDUP — union-find, threshold 0.82
# Clusters near-identical skills, keeps shortest.
# -------------------------------------------------

def _dedup_skill_list(skills: list[str]) -> list[str]:
    if len(skills) <= 1:
        return skills

    DEDUP_THRESHOLD = 0.82

    embeddings = model.encode(skills)
    sim        = cosine_similarity(embeddings, embeddings)

    parent = list(range(len(skills)))

    def find(x):
        while parent[x] != x:
            parent[x] = parent[parent[x]]
            x = parent[x]
        return x

    def union(x, y):
        parent[find(x)] = find(y)

    for i in range(len(skills)):
        for j in range(i + 1, len(skills)):
            if sim[i][j] >= DEDUP_THRESHOLD:
                union(i, j)

    clusters: dict[int, list[int]] = {}
    for i in range(len(skills)):
        root = find(i)
        clusters.setdefault(root, []).append(i)

    kept = []
    for indices in clusters.values():
        best = min(indices, key=lambda i: len(skills[i]))
        kept.append(skills[best])

    logger.info("Dedup: %d → %d skills", len(skills), len(kept))
    return kept


# -------------------------------------------------
# CANONICAL SKILL EXPANSION VIA LLM
# Domain-agnostic — no hardcoded aliases.
# -------------------------------------------------

def expand_skills_canonically(skills: list[str]) -> list[str]:

    prompt = f"""You are a skill normalization assistant. For each skill below, return its full canonical name.

RULES:
- Expand abbreviations and acronyms to their full form, then append the short form in parentheses.
- Keep already-descriptive skills as-is (do not add extra words).
- Lowercase everything.
- Return ONLY a JSON object mapping each input skill to its expanded form. No explanation.

Example input:  ["rag", "sql", "cpa", "docker", "gaap"]
Example output: {{"rag": "retrieval augmented generation (rag)", "sql": "structured query language (sql)", "cpa": "certified public accountant (cpa)", "docker": "docker", "gaap": "generally accepted accounting principles (gaap)"}}

Skills:
{json.dumps(skills)}
"""

    try:
        output = call_llm(prompt)
        data = parse_llm_json(output)
        if isinstance(data, dict):
            return [data.get(s, s) for s in skills]
    except Exception as e:
        logger.warning("Canonical expansion failed: %s", e)

    return skills


# -------------------------------------------------
# SKILL EXTRACTION
# -------------------------------------------------

def extract_skills(text: str) -> list[str]:

    prompt = f"""You are a precise skill extractor. Extract every skill from the resume below.

A skill is any specific capability, tool, method, technology, language, framework, technique, certification, or domain knowledge the candidate has demonstrated.

EXTRACTION RULES:
1. Strip qualifier phrases — extract only the core skill noun/name.
2. Split combined skills into separate entries.
3. Lowercase everything.
4. Do NOT include: job titles, company names, years of experience, soft traits (teamwork, communication, leadership).

STRIPPING EXAMPLES:
"strong experience with financial modelling"  → "financial modelling"
"familiarity with GAAP and IFRS"              → ["gaap", "ifrs"]
"proficient in Adobe Photoshop/Illustrator"   → ["adobe photoshop", "adobe illustrator"]
"understanding of evidence-based practice"    → "evidence-based practice"
"hands-on experience with Python and Docker"  → ["python", "docker"]
"knowledge of Agile/Scrum methodologies"      → ["agile", "scrum"]

OUTPUT FORMAT — return ONLY this JSON, no explanation, no markdown fences:
{{
  "skills": ["skill one", "skill two", "skill three"]
}}

Resume:
{text}
"""

    retry_suffixes = [
        "",
        "\nCRITICAL: Output must be valid JSON only. No explanation. No markdown.",
        "\nFINAL ATTEMPT: Your entire response must start with {{ and end with }}. Nothing else.",
    ]

    for attempt, suffix in enumerate(retry_suffixes):
        output = call_llm(prompt + suffix)
        data = parse_llm_json(output)

        if data and isinstance(data.get("skills"), list):
            skills = normalize_skills(data["skills"])
            logger.info("Extracted %d skills on attempt %d.", len(skills), attempt + 1)
            return skills

        logger.warning("Skill extraction attempt %d failed.", attempt + 1)

    return []


# -------------------------------------------------
# MAIN ANALYZER AGENT
# -------------------------------------------------

def resume_analyzer_agent(state: dict) -> dict:

    resume_text = state.get("resume_text") or ""

    if isinstance(resume_text, list):
        resume_text = " ".join(str(chunk) for chunk in resume_text)

    resume_text = re.sub(r"\s+", " ", str(resume_text)).strip()

    tech_stack      = state.get("tech_stack") or []
    jd_requirements = state.get("jd_requirements") or []

    raw_jd_skills = list(set(tech_stack + jd_requirements))

    normalized = [normalize_jd_skill(s) for s in raw_jd_skills]
    jd_skills  = normalize_skills(normalized)
    jd_skills  = expand_jd_skills(jd_skills)
    jd_skills  = _dedup_skill_list(jd_skills)

    logger.info("JD skills after dedup (%d): %s", len(jd_skills), jd_skills)

    resume_skills = extract_skills(resume_text) if len(resume_text) > 10 else []

    if not resume_skills or not jd_skills:
        logger.warning(
            "Skill comparison skipped. resume_skills=%d, jd_skills=%d",
            len(resume_skills), len(jd_skills),
        )
        state.update({
            "resume_skills":   resume_skills,
            "matching_skills": [],
            "missing_skills":  jd_skills,
            "gap_analysis":    "Skill comparison could not be performed due to missing skill extraction.",
            "fit_score":       0.0,
        })
        return state

    # canonically expand both lists before encoding
    resume_expanded = expand_skills_canonically(resume_skills)
    jd_expanded     = expand_skills_canonically(jd_skills)

    if len(resume_expanded) != len(resume_skills):
        logger.warning("Resume expansion length mismatch — falling back.")
        resume_expanded = resume_skills

    if len(jd_expanded) != len(jd_skills):
        logger.warning("JD expansion length mismatch — falling back.")
        jd_expanded = jd_skills

    resume_embeddings = model.encode(resume_expanded)
    jd_embeddings     = model.encode(jd_expanded)

    similarity_matrix = cosine_similarity(resume_embeddings, jd_embeddings)

    # -------------------------------------------------
    # TWO-TIER MATCHING
    #
    # HARD >= 0.75 : clear match
    # SOFT >= 0.60 : only if canonical strings share a
    #                meaningful non-stopword token
    #
    # ONE-RESUME-SKILL-PER-JD-SKILL RULE:
    # Once a resume skill is "claimed" as the best match
    # for a JD skill, it cannot be the primary match for
    # another JD skill. This prevents 3 JD variants all
    # matching the same resume skill and inflating count.
    # -------------------------------------------------

    HARD_THRESHOLD = 0.75
    SOFT_THRESHOLD = 0.60

    STOPWORDS = {
        "a", "an", "the", "and", "or", "of", "for", "in",
        "with", "to", "is", "on", "at", "by", "as", "be",
        "it", "its", "basic", "using",
    }

    def meaningful_words(text: str) -> set:
        words = re.findall(r"[a-z0-9]+", text.lower())
        return {w for w in words if w not in STOPWORDS and len(w) > 1}

    # sort JD skills so highest-confidence matches claim resume skills first
    # (use the best raw cosine score as priority)
    jd_order = sorted(
        range(len(jd_skills)),
        key=lambda i: float(similarity_matrix[:, i].max()),
        reverse=True,
    )

    claimed_resume_skills: set[int] = set()
    results: dict[int, bool] = {}

    for i in jd_order:
        col   = similarity_matrix[:, i]
        # find best UNCLAIMED resume skill
        order = col.argsort()[::-1]

        matched   = False
        for best_idx in order:
            best_score = float(col[best_idx])

            if best_score < SOFT_THRESHOLD:
                break  # no point checking further

            if best_score >= HARD_THRESHOLD:
                matched = True
                claimed_resume_skills.add(best_idx)
                break

            # soft tier — require word overlap
            jd_words     = meaningful_words(jd_expanded[i])
            resume_words = meaningful_words(resume_expanded[best_idx])
            if jd_words & resume_words:
                matched = True
                claimed_resume_skills.add(best_idx)
                break

            # this resume skill didn't qualify at soft tier —
            # try next best (don't claim it)

        logger.info("JD: %-40s  score=%.4f  matched=%s  resume_match=%s",
                     jd_skills[i], float(similarity_matrix[:, i].max()),
                     matched, resume_skills[int(similarity_matrix[:, i].argmax())] if matched else '-')
        results[i] = matched

    matching = [jd_skills[i] for i in range(len(jd_skills)) if results[i]]
    missing  = [jd_skills[i] for i in range(len(jd_skills)) if not results[i]]

    total     = len(jd_skills)
    fit_score = round((len(matching) / total) * 100, 2) if total > 0 else 0.0

    gap_analysis = (
        f"The candidate currently matches the following skills from the job description:\n{matching}\n\n"
        f"The following required or expected skills are not present in the resume:\n{missing}\n\n"
        f"The candidate should strengthen their profile by developing experience in these missing technologies."
    )

    logger.info(
        "JD total: %d | Matching: %d | Missing: %d | Fit Score: %.2f%%",
        total, len(matching), len(missing), fit_score,
    )

    state.update({
        "resume_skills":   resume_skills,
        "matching_skills": matching,
        "missing_skills":  missing,
        "gap_analysis":    gap_analysis,
        "fit_score":       fit_score,
    })

    return state