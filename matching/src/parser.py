import fitz

def extract_text_from_pdf(path):
    text=""
    doc = fitz.open(path)
    for page in doc : 
        text = text + page.get_text()
    

    doc.close()
    return text


def extract_section(text, start_keywords, end_keywords):
    lines = text.splitlines()  
    section = ""
    start_found = False

    for line in lines:
        lower_line = line.lower().strip()

       
        if not start_found:
            for start_kw in start_keywords:
                if start_kw in lower_line:
                    start_found = True
                    section += line.strip() + "\n"
                    break
            continue  

        
        for end_kw in end_keywords:
            if end_kw in lower_line:
                return section.strip()

        
        section += line.strip() + "\n"

    return section.strip()  







    
        









