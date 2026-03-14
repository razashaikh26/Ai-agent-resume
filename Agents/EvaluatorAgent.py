import json
import re
from dotenv import load_dotenv
from llm import call_llm

load_dotenv()


def extract_json(text):
    if not text:
        return {}
    text = text.replace("```json", "").replace("```", "")
    match = re.search(r"\{[\s\S]*\}", text)
    if not match:
        return {}
    try:
        return json.loads(match.group(0))
    except Exception:
        return {}


def evaluator_agent(state):

    prompt = f"""
You are an AI hiring evaluator.
Analyze how well the candidate resume matches the job description.
Return ONLY JSON.

JSON format:
{{
  "alignment_summary": "",
  "feedback": ""
}}

Rules:
- alignment_summary must be 40–90 words
- feedback must be 4–6 sentences
- do not include scores

Job Role:
{state.get("role_title")}

Experience Level:
{state.get("experience_level")}

Job Requirements:
{state.get("jd_requirements")}

Tech Stack:
{state.get("tech_stack")}

Candidate Resume Skills:
{state.get("resume_skills")}

Matching Skills:
{state.get("matching_skills")}

Missing Skills:
{state.get("missing_skills")}
"""

    output = call_llm(prompt)
    print("\n==== LLM OUTPUT ====")
    print(output)
    print("====================\n")

    data = extract_json(output)

    # fit_score is already computed correctly by resume_analyzer_agent — do NOT overwrite it
    state["alignment_summary"] = data.get("alignment_summary", "")
    state["feedback"]          = data.get("feedback", "")

    return state