from pathlib import Path
from fastapi import FastAPI, UploadFile,Form
from injectfile import inject
from Agents.JDanalyzer import jd_analyzer_agent
from Agents.ResearchAgent import research_agent
from Agents.ResumeAnalyzer import resume_analyzer_agent
from Agents.WriterAgent import writer_agent
from Agents.EvaluatorAgent import evaluator_agent
from state import state
app =FastAPI()

BASE_DIR = Path(__file__).resolve().parent
MODEL_DIR = BASE_DIR / "models"
TEMP_DIR = BASE_DIR / "temp"


@app.post("/inject")
async def inject_file(
    file: UploadFile,
    jd: str = Form(...)
):
    global state
    filename = file.filename.lower()
    if filename.endswith('.pdf'):
        source_type = 'pdf'
    elif filename.endswith('.csv'):
        source_type = 'csv'
    elif filename.endswith('.docx'):
        source_type = 'docx'
    elif filename.endswith('.txt'):
        source_type = 'txt'
    else:
        return {"error": f"Unsupported file type. Supported:  .pdf, .csv, .docx, .txt"}
    TEMP_DIR.mkdir(parents=True, exist_ok=True)
    safe_filename = Path(file.filename).name
    path = TEMP_DIR / safe_filename
    try:
        with open(path, "wb") as f:
            f.write(await file.read())

        docs = inject(source_type, str(path))
        page_content = [doc.page_content for doc in docs]

    except Exception as e:
        return {"error": f"Failed to process file: {str(e)}"}

    state["resume_text"] = page_content
    state["jd_text"] = jd

    state = jd_analyzer_agent(state)
    state = research_agent(state)
    state = resume_analyzer_agent(state)
    state = writer_agent(state)
    state = evaluator_agent(state)

    return state

        