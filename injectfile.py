from loader.pdf import load_pdf
from loader.csv import load_csv
from loader.web import load_web
from loader.docx import loaddocx
from loader.txt import loadtxt
def inject(source_type: str, source: str):
    if source_type == "pdf":
        docs = load_pdf(source)
    elif source_type == "csv":
        docs = load_csv(source)
    elif source_type == "web":
        docs = load_web(source)
    elif source_type == "docx":
        docs = loaddocx(source)
    elif source_type == "txt":
        docs = loadtxt(source)
    else:
        raise ValueError("unsupported type")
    
    return docs