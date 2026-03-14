import json
import boto3
import os
import re
from dotenv import load_dotenv
from utils.json_utils import safe_parse_json
from llm import call_llm 
load_dotenv()
def clean_output(text):

    if not text:
        return ""

    # remove markdown
    text = text.replace("```json", "").replace("```", "")

    # remove table junk
    text = re.sub(r'\|\s*\|.*', '', text)

    return text.strip()


# -------------------------
# Writer Agent
# -------------------------

def writer_agent(state):

    resume = state.get("resume_text", "")

    if isinstance(resume, list):
        resume = " ".join(resume)

    missing_skills = state.get("missing_skills", [])
    company_info = state.get("company_info", "")
    role_expectations = state.get("role_expectations", "")

    prompt = f"""
You are a professional resume writer.

Rewrite the candidate resume to match the job role and generate a targeted cover letter.

Input Resume:
{resume}

Company Context:
{company_info}

Role Expectations:
{role_expectations}

Missing Skills to address:
{missing_skills}

Return ONLY valid JSON.

Output format:
{{
    "tailored_resume": "",
    "cover_letter": ""
}}

Hard rules:
1. Both keys are mandatory and must be non-empty strings.
2. tailored_resume should be concise but substantial (120 to 220 words).,
Do NOT add new skills that are not present in the original resume.
Only rephrase or reorganize existing content.

3. cover_letter should be professional and personalized (140 to 220 words).
4. Mention role fit, relevant strengths, and value to the company.
5. Do not output markdown, bullets, or extra keys.
6. Start with {{ and end with }}.
"""

    # -------------------------
    # First attempt
    # -------------------------

    output = call_llm(prompt)

    output = clean_output(output)

    data = safe_parse_json(output)

    # -------------------------
    # Retry if failed
    # -------------------------

    if data is None:

        print("WriterAgent retrying JSON generation")

        retry_prompt = (
            prompt
            + "\nIMPORTANT: RETURN STRICTLY VALID JSON WITH BOTH NON-EMPTY FIELDS."
        )

        output = call_llm(retry_prompt, temperature=0.1)

        output = clean_output(output)

        data = safe_parse_json(output)

    # -------------------------
    # Final fallback
    # -------------------------

    if data is None:

        print("WriterAgent failed to produce JSON")

        data = {}

    # -------------------------
    # Update State
    # -------------------------

    tailored_resume = (data.get("tailored_resume") or "").strip()
    cover_letter = (data.get("cover_letter") or "").strip()


    state["tailored_resume"] = tailored_resume
    state["cover_letter"] = cover_letter

    return state