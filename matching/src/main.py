from parser import extract_text_from_pdf, extract_section
from profil import ProfileCandidat
import json


text = extract_text_from_pdf("../data/cvs/cv_01.pdf")


keywords_comp = ["compétences", "skills", "compétences techniques"]
keywords_exp = ["expérience", "expériences", "parcours"]
keywords_dipl = ["diplômes", "formation", "éducation"]
keywords_lang = ["langues", "langue"]


all_starts = [keywords_exp, keywords_dipl, keywords_lang, keywords_comp]  


competences_text = extract_section(text, keywords_comp, keywords_exp + keywords_dipl + keywords_lang)
experiences_text = extract_section(text, keywords_exp, keywords_dipl + keywords_lang)
diplomes_text = extract_section(text, keywords_dipl, keywords_lang)
langues_text = extract_section(text, keywords_lang, [])


competences = [c.strip() for c in competences_text.replace("Compétences :", "").split(",") if c.strip()]
experiences = [experiences_text] if experiences_text else []
diplomes = [diplomes_text] if diplomes_text else []
langues = [langues_text] if langues_text else []

profil = ProfileCandidat(
    nom="Ali Ben Salah",
    competences=competences,
    experiences=experiences,
    diplomes=diplomes,
    langues=langues
)


print("Profil extrait :")
print(json.dumps(profil.to_dict(), indent=4, ensure_ascii=False))


with open("profil_candidat.json", "w", encoding="utf-8") as f:
    json.dump(profil.to_dict(), f, indent=4, ensure_ascii=False)
