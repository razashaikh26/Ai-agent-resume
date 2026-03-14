import json
import boto3
import os
import re
from dotenv import load_dotenv
from tavily import TavilyClient
from llm import call_llm
load_dotenv()

tavily = TavilyClient(api_key=os.getenv("TAVILY_API_KEY"))

def tavily_search(query):

    try:

        result = tavily.search(
            query=query,
            search_depth="advanced",
            max_results=5
        )

        texts = [r.get("content", "") for r in result.get("results", [])]

        combined = "\n".join(texts)

        return combined[:1500]

    except Exception as e:

        print("Tavily search error:", e)
        return ""


# ----------------------------
# Safe JSON Parser
# ----------------------------

def parse_llm_json(text):

    if not text:
        return {}

    text = text.replace("```json", "").replace("```", "")

    start = text.find("{")
    end = text.rfind("}") + 1

    if start == -1 or end == -1:
        return {}

    json_text = text[start:end]

    json_text = re.sub(r'[\x00-\x1f\x7f]', '', json_text)

    try:
        return json.loads(json_text)
    except:
        return {}


def research_agent(state):

    company = str(state.get("company_name", "")).strip()
    role = str(state.get("role_title", "")).strip()

    if not company or company.lower() in ["not specified", "ai startup", "startup", "unknown"]:
        company = "technology startup"

    if not role or role.lower() == "not specified":
        role = "machine learning engineer"

    # ------------------------
    # Tavily searches
    # ------------------------

    company_info_data = tavily_search(
        f"{company} company overview mission products what does {company} do"
    )

    tech_stack_data = tavily_search(
        f"{company} engineering tech stack programming languages frameworks"
    )

    role_data = tavily_search(
        f"{role} responsibilities skills requirements machine learning engineer duties"
    )

    # ------------------------
    # Prompt
    # ------------------------

    prompt = f"""
You are an AI research assistant.

Summarize the company and role based on the reference data.

Company: {company}
Role: {role}

REFERENCE DATA START

Company Information:
{company_info_data}

Technology Information:
{tech_stack_data}

Role Information:
{role_data}

REFERENCE DATA END

Return ONLY valid JSON.

JSON format:

{{
"company_info": "",
"company_tech_stack": [],
"role_expectations": "",
"company_focus": ""
}}
"""

    # ------------------------
    # LLM Call
    # ------------------------

    output = call_llm(prompt)

    print("\n== RESEARCH AGENT RAW OUTPUT ==")
    print(output)

    data = parse_llm_json(output)

    # ------------------------
    # Safe extraction
    # ------------------------

    company_info = data.get("company_info", "")
    company_stack = data.get("company_tech_stack", [])
    role_expect = data.get("role_expectations", "")
    company_focus = data.get("company_focus", "")

    if not isinstance(company_stack, list):
        company_stack = [str(company_stack)]

    state["company_info"] = str(company_info).strip()
    state["company_tech_stack"] = company_stack
    state["role_expectations"] = str(role_expect).strip()
    state["company_focus"] = str(company_focus).strip()

    return state