import json
import boto3
import os
import re
from dotenv import load_dotenv
from llm import call_llm
load_dotenv()


def extract_json(text):

    if not text:
        return {}

    text = text.replace("```json", "").replace("```", "")

    start = text.find("{")
    end = text.rfind("}")

    if start == -1 or end == -1:
        print("JSON not found in LLM output")
        return {}

    json_text = text[start:end + 1]

    try:
        return json.loads(json_text)
    except Exception as e:
        print("JSON parse error:", e)
        print("RAW JSON:", json_text)
        return {}


# ------------------------
# JD Analyzer Agent
# ------------------------

def jd_analyzer_agent(state):

    jd_text = state.get("jd_text", "")

    prompt = f"""
You are an expert technical recruiter.

Extract structured information from the job description.

Return ONLY JSON.

JSON format:

{{
"company_name": "",
"role_title": "",
"experience_level": "",
"tech_stack": [],
"jd_requirements": [],
"job_responsibilities": []
}}

Rules:
- tech_stack = technologies used
- jd_requirements = required skills
- job_responsibilities = responsibilities
- each list must contain at least 5 items

Job Description:
{jd_text}
"""

    output = call_llm(prompt)

    print("\n=== LLM OUTPUT ===")
    print(output)
    print("==================\n")

    data = extract_json(output)

    state["company_name"] = data.get("company_name") or "Not specified"
    state["role_title"] = data.get("role_title") or "Not specified"
    state["experience_level"] = data.get("experience_level") or "Not specified"

    tech_stack = data.get("tech_stack")
    jd_requirements = data.get("jd_requirements")
    job_responsibilities = data.get("job_responsibilities")

    state["tech_stack"] = tech_stack if isinstance(tech_stack, list) else []
    state["jd_requirements"] = jd_requirements if isinstance(jd_requirements, list) else []
    state["job_responsibilities"] = job_responsibilities if isinstance(job_responsibilities, list) else []

    return state