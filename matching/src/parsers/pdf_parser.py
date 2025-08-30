import PyPDF2
import os

def extract_text_from_pdf(pdf_path: str) -> str:
    
    if not os.path.exists(pdf_path):
        print(f"[ERREUR] Fichier introuvable : {pdf_path}")
        return ""

    text = ""
    try:
        with open(pdf_path, "rb") as file:
            reader = PyPDF2.PdfReader(file)
            for page in reader.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"
    except Exception as e:
        print(f"[ERREUR] Impossible de lire {pdf_path} : {e}")
        return ""

    return text.replace("\n", " ").strip()
