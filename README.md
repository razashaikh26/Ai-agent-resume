# AI Resume Agent

An AI-powered multi-agent pipeline that tailors a candidate's resume to a target job description, generates a cover letter, evaluates alignment, and returns actionable feedback — all through a single FastAPI endpoint.

---

## How it works

Upload a resume (PDF, DOCX, TXT, or CSV) together with a job description. The pipeline runs five agents in sequence:

```
JD Analyzer → Research Agent → Resume Analyzer → Writer Agent → Evaluator Agent
```

| Agent | Responsibility |
|---|---|
| **JD Analyzer** | Extracts role title, tech stack, requirements, and responsibilities from the JD |
| **Research Agent** | Searches the web (Tavily) for company context, tech stack, and role expectations |
| **Resume Analyzer** | Extracts resume skills, matches them against JD skills, computes a skill-based fit score |
| **Writer Agent** | Rewrites the resume and generates a personalized cover letter using AWS Bedrock (Llama 3) |
| **Evaluator Agent** | Produces an alignment summary and actionable feedback |

---

## Tech stack

- **FastAPI** — REST API
- **AWS Bedrock** — LLM inference (`meta.llama3-8b-instruct-v1:0`)
- **Tavily** — real-time web search
- **LangChain** — document loaders (PDF, DOCX, TXT, CSV)
- **Sentence Transformers** — skill embedding and cosine similarity scoring
- **scikit-learn** — similarity matrix computation

---

## Project structure

```
.
├── main.py                  # FastAPI app and /inject endpoint
├── state.py                 # Shared pipeline state schema
├── llm.py                   # Bedrock LLM client
├── injectfile.py            # File-type routing to loaders
├── Agents/
│   ├── JDanalyzer.py
│   ├── ResearchAgent.py
│   ├── ResumeAnalyzer.py
│   ├── WriterAgent.py
│   └── EvaluatorAgent.py
├── loader/
│   ├── pdf.py
│   ├── docx.py
│   ├── txt.py
│   ├── csv.py
│   └── web.py
├── utils/
│   └── json_utils.py
├── temp/                    # Temporary upload storage (gitignored)
├── .env                     # Local secrets (gitignored)
└── .env.example             # Template — copy to .env and fill in values
```

---

## Setup

### 1. Clone and install dependencies

```bash
git clone https://github.com/razashaikh26/Ai-agent-resume.git
cd Ai-agent-resume
pip install -r requirements.txt
```

### 2. Configure environment variables

```bash
cp .env.example .env
```

Edit `.env` with your own credentials (see `.env.example` for required keys).

### 3. Run the server

```bash
uvicorn main:app --reload
```

The API is available at `http://127.0.0.1:8000`.

---

## API

### `POST /inject`

Analyzes a resume against a job description and returns the full pipeline output.

**Form fields:**

| Field | Type | Description |
|---|---|---|
| `file` | file | Resume file (`.pdf`, `.docx`, `.txt`, `.csv`) |
| `jd` | string | Full job description text |

**Example response:**

```json
{
  "role_title": "Backend Engineer",
  "company_name": "Acme Corp",
  "fit_score": 93.75,
  "matching_skills": ["python", "fastapi", "docker"],
  "missing_skills": ["kubernetes"],
  "tailored_resume": "...",
  "cover_letter": "...",
  "alignment_summary": "...",
  "feedback": "..."
}
```

---

## Environment variables

| Variable | Description |
|---|---|
| `AWS_ACCESS_KEY_ID` | AWS IAM access key with Bedrock permissions |
| `AWS_SECRET_ACCESS_KEY` | AWS IAM secret key |
| `TAVILY_API_KEY` | Tavily search API key |

> The app uses AWS Bedrock in `ap-south-1`. Ensure your IAM user has `bedrock:InvokeModel` permission for `meta.llama3-8b-instruct-v1:0`.
