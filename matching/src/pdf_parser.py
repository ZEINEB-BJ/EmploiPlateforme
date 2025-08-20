import fitz 
import re
import spacy

# load spaCy model
try:
    nlp = spacy.load("fr_core_news_sm")
except OSError:
    print("Modèle spaCy 'fr_core_news_sm' non trouvé. Veuillez l'installer avec: python -m spacy download fr_core_news_sm")
    nlp = None

from src.data_processor import ProfilCandidat, ExperienceProfessionnelle, Diplome


def safe_strip(value):
   
    if isinstance(value, str):
        return value.strip()
    return ""

def extract_text_from_pdf(pdf_path: str) -> str:
    #Extrait  texte d'un fichier PDF
    text = ""
    try:
        doc = fitz.open(pdf_path)
        for page in doc:
            text += page.get_text()
        doc.close()
    except Exception as e:
        print(f"Erreur lors de l'extraction du texte du PDF {pdf_path}: {e}")
    return text

def parse_cv(pdf_path: str) -> ProfilCandidat:
    raw_text = extract_text_from_pdf(pdf_path)
    if not raw_text:
        return ProfilCandidat(raw_text=raw_text)

    cv_profile = ProfilCandidat(raw_text=raw_text)

    
    text_lower = raw_text.lower()

    # extraction  nom
    name_candidates = [safe_strip(line) for line in raw_text.split('\n') if safe_strip(line) and len(safe_strip(line)) < 100]
    for line in name_candidates[:5]: 
        if re.match(r'^[A-ZÀ-Ÿ][a-zà-ÿ\s\'-]+(?: [A-ZÀ-Ÿ][a-zà-ÿ\s\'-]+){1,4}$', line) and \
           not re.search(r'(email|tel|github|linkedin|http|compétences|expériences|formation|projet|poste|adresse|résumé|profil)', line, re.IGNORECASE):
            cv_profile.nom = line
            break
    
    if not cv_profile.nom:
        name_match = re.search(r"(?:NOM|Nom|Name)[:\s]*([A-ZÀ-Ÿ][a-zA-ZÀ-ÿ\s'-]+(?: [A-ZÀ-Ÿ][a-zA-ZÀ-ÿ\s'-]+)*)", raw_text)
        if name_match:
            cv_profile.nom = safe_strip(name_match.group(1))
    
    if cv_profile.nom and len(cv_profile.nom.split()) > 5:
        cv_profile.nom = None 

    # email
    email_match = re.search(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b', text_lower)
    if email_match:
        cv_profile.email = email_match.group(0)

    #tel
    phone_match = re.search(
        r'(?:(?:\+|00)\d{1,3}[-. ]?)?(?:\(?\d{2,4}\)?[-. ]?)?\d{2,4}[-. ]?\d{2,4}[-. ]?\d{2,4}(?:[-. ]?\d{2,4})?',
        raw_text
    )
    if phone_match:
        cv_profile.telephone = safe_strip(phone_match.group(0))

    # liens
    links = re.findall(r'(https?://[^\s]+(?:\.com|\.org|\.net|\.io)[^\s]*)', raw_text)
    cv_profile.liens = [
        link for link in links
        if any(x in link for x in ["linkedin.com", "github.com", "gitlab.com", "bitbucket.org", "portfolio"])
    ]

    # sections
    section_markers = {
        "profil_resume": r"profil|à propos|résumé|summary|about|introduction",
        "experiences_pro": r"expériences? (professionnelles?)?|professional experience|parcours professionnel|expérience",
        "projets": r"projet(s)?|portfolio|réalisations",
        "diplomes": r"formation(s)?|éducation|education|diplômes?|parcours académique",
        "competences": r"compétences|skills|technologies|compétences techniques|savoir-faire",
        "langues": r"langues|languages",
        "certifications": r"certification(s)?|certificats?",
        "interets": r"intérêts|hobbies|activités"
    }

    sections_content = {}
    current_section = None
    
    combined_pattern_str = '|'.join(f'(?:{pattern})' for pattern in section_markers.values())
    split_pattern = re.compile(f'({combined_pattern_str})', re.IGNORECASE | re.MULTILINE)
    
    parts = split_pattern.split(raw_text)

    if parts:
        first_segment = safe_strip(parts[0])
        is_first_segment_marker = False
        for pattern in section_markers.values():
            if re.search(pattern, first_segment, re.IGNORECASE):
                is_first_segment_marker = True
                break
        
        if first_segment and not is_first_segment_marker:
            sections_content["profil_resume"] = first_segment
            start_index = 1
        else:
            start_index = 0

    for i in range(start_index, len(parts)):
        segment = safe_strip(parts[i])
        if not segment:
            continue
        
        matched_key = None
        for key, pattern in section_markers.items():
            if re.fullmatch(pattern, segment, re.IGNORECASE):
                matched_key = key
                break
        
        if matched_key:
            current_section = matched_key
            sections_content[current_section] = ""
        elif current_section:
            sections_content[current_section] += segment + "\n"
    
    for key in sections_content:
        sections_content[key] = safe_strip(sections_content[key])

    # profil
    if "profil_resume" in sections_content:
        profile_clean = re.sub(r'^(?:Nom|Email|Tel|Téléphone|Liens|Poste recherché|Adresse).*|Compétences:|Expériences professionnelles:|Formations:|Langues:', '', sections_content["profil_resume"], flags=re.IGNORECASE | re.MULTILINE | re.DOTALL)
        cv_profile.profil_resume = safe_strip(profile_clean)


    # competences
    if "competences" in sections_content:
        skills_text = sections_content["competences"]
        skills_text = re.sub(r'^(?:langages de programmation|frameworks|base de données|outils|méthodologies|os|cloud|devops|design|gestion de projet|data science|intelligence artificielle|apprentissage automatique|réseaux|sécurité)[:\s\n\-\*\•]*', '', skills_text, flags=re.IGNORECASE | re.MULTILINE)
        skills_text = re.sub(r'[-•*()]', '', skills_text)
        skills_text = re.sub(r'\s{2,}', ' ', skills_text)
        skills_text = re.sub(r',\s*,', ',', skills_text) 
        skills_text = re.sub(r'^\s*,\s*|\s*,\s*$', '', skills_text) 

        if nlp:
            doc = nlp(skills_text)
            extracted_skills = []
            
            for chunk in doc.noun_chunks:
                text = safe_strip(chunk.text)
                if len(text.split()) > 1 and len(text.split()) <= 5 and not re.match(r'^(et|ou|de|des|le|la|les)\s*$', text, re.IGNORECASE):
                    text = re.sub(r'[,.;:]$', '', text).strip()
                    if text:
                        extracted_skills.append(text)
            
            for token in doc:
                text = safe_strip(token.text)
                if token.is_alpha and not token.is_punct and len(text) > 2 and len(text.split()) < 6 and \
                   token.pos_ in ["NOUN", "PROPN", "ADJ"] and not re.match(r'^(maîtrise|connaissances|expérience|notions|bonne|excellente|capacité|gestion|développement|analyse|mise|pratique|technologies|compétences|skills|machine|learning|deep|data|web|management|solution|architecture|application|système|ingénierie|projet|expertise)$', text.lower()):
                    
                    if text and not token.is_stop: 
                        extracted_skills.append(text)
            
            cleaned_skills = set()
            for skill in extracted_skills:
                skill = safe_strip(skill)
                if skill and skill.lower() not in ["machine", "learning", "deep", "data", "web", "management", "développement", "solution", "architecture", "application", "système", "ingénierie", "projet", "expertise", "méthodologie"]:
                    cleaned_skills.add(skill)
            
            cv_profile.competences = list(sorted(cleaned_skills))
        else:
            skill_list = [safe_strip(s) for s in re.split(r'[,;\n]', skills_text) if safe_strip(s)]
            cleaned_skills = set()
            for skill in skill_list:
                skill = re.sub(r'^\W+|\W+$', '', skill)
                skill = re.sub(r'\s{2,}', ' ', skill)
                skill = safe_strip(skill)
                if skill and len(skill) > 2 and len(skill.split()) < 6 and skill.lower() not in ["machine", "learning", "deep", "data", "web", "management", "développement", "solution", "architecture", "application", "système", "ingénierie", "projet", "expertise", "méthodologie"]:
                    cleaned_skills.add(skill)
            cv_profile.competences = list(sorted(cleaned_skills))

    
    date_pattern_full = r"(?:janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre|jan|fév|mar|avr|mai|juin|juil|août|sep|oct|nov|déc|[a-zA-Z]{3,})\.?\s+\d{4}\s*-\s*(?:janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre|jan|fév|mar|avr|mai|juin|juil|août|sep|oct|nov|déc|[a-zA-Z]{3,})\.?\s+\d{4}|\d{4}\s*-\s*(?:\d{4}|present|jusqu'à présent|aujourd'hui)|\d{4}"
    
    # experiences
    if "experiences_pro" in sections_content:
        exp_text = sections_content["experiences_pro"]
        
        exp_entry_split_pattern = re.compile(
            r'^\s*(?P<header_line>'
            r'(?:' + date_pattern_full + r')\s*(?:[^\n]*?)?'
            r'|'
            r'(?:[A-ZÀ-Ÿ][a-zà-ÿ\s\'-]+(?: [A-ZÀ-Ÿ][a-zà-ÿ\s\'-]+){0,5})'
            r'(?:\s*(?:chez|at|à|en|as|for)\s*(?:[A-ZÀ-Ÿ][a-zà-ÿ\s,\'-]+(?:S\.A\.S|S\.A\.R\.L|Inc|Ltd|GmbH|LLC)?\s*)?)?'
            r'(?:,\s*[A-ZÀ-Ÿ][a-zà-ÿ\s-]+)?'
            r')\s*$',
            flags=re.IGNORECASE | re.MULTILINE
        )
        
        blocks = exp_entry_split_pattern.split(exp_text)
        
        temp_experiences = []
        current_exp_info = {"description": ""} 

        for i, block_part in enumerate(blocks):
            block_part = safe_strip(block_part)
            if not block_part:
                continue

            is_header = bool(exp_entry_split_pattern.fullmatch(block_part))

            if is_header:
                if current_exp_info and (current_exp_info.get('titre_poste') or current_exp_info.get('entreprise') or (current_exp_info.get('date_debut') and current_exp_info.get('date_fin'))):
                    if current_exp_info.get('description'):
                        current_exp_info['description'] = safe_strip(current_exp_info['description'])
                        current_exp_info['description'] = "\n".join([
                            line for line in current_exp_info['description'].split('\n')
                            if safe_strip(line) and len(safe_strip(line)) > 5 and not re.search(date_pattern_full, line, re.IGNORECASE)
                        ])
                    temp_experiences.append(ExperienceProfessionnelle(**current_exp_info))
                
                current_exp_info = {"description": ""} 
                header_line = block_part 
                
                dates_str_match = re.search(r'(' + date_pattern_full + r')', header_line, re.IGNORECASE)
                if dates_str_match:
                    dates_str = dates_str_match.group(1)
                    if '-' in dates_str:
                        d_parts = dates_str.split('-')
                        current_exp_info['date_debut'] = safe_strip(d_parts[0])
                        current_exp_info['date_fin'] = safe_strip(d_parts[1]).replace('present', 'Présent').replace('aujourd\'hui', 'Présent')
                    else:
                        current_exp_info['date_debut'] = dates_str
                        current_exp_info['date_fin'] = dates_str
                    
                    header_line = safe_strip(header_line.replace(dates_str, '')) 

                city_match = re.search(r'(?:en|à|at|in)\s+([A-ZÀ-Ÿ][a-zA-ZÀ-ÿ\s-]+)$', header_line, re.IGNORECASE)
                if city_match:
                    current_exp_info['ville'] = safe_strip(city_match.group(1))
                    header_line = safe_strip(header_line.replace(city_match.group(0), ''))

                company_match = re.search(r'(?:chez|at|à|en|as|for)\s+([A-ZÀ-Ÿ][a-zA-ZÀ-ÿ\s,\'-]+(?:S\.A\.S|S\.A\.R\.L|Inc|Ltd|GmbH|LLC)?)$', header_line, re.IGNORECASE)
                if company_match:
                    current_exp_info['entreprise'] = safe_strip(company_match.group(1))
                    title_candidate = safe_strip(re.sub(r'(?:chez|at|à|en|as|for)\s+.*', '', header_line, flags=re.IGNORECASE))
                    if title_candidate and not re.match(r'^\d{4}$', title_candidate) and title_candidate.lower() not in ["professionnelles", "expérience", "stage", "developpeur", "data scientist", "ingénieur logiciel", "chef de projet"]:
                        current_exp_info['titre_poste'] = title_candidate
                    else:
                        current_exp_info['titre_poste'] = None
                else:
                    parts_header = [safe_strip(p) for p in re.split(r' - |,\s*|\s*\|', header_line) if safe_strip(p)]
                    if len(parts_header) >= 2:
                        if re.search(r'(corp|solutions|tech|analytics|factory|soft|inc|ltd)', parts_header[1], re.IGNORECASE):
                            current_exp_info['titre_poste'] = parts_header[0]
                            current_exp_info['entreprise'] = parts_header[1]
                        else:
                            current_exp_info['entreprise'] = parts_header[0]
                            current_exp_info['titre_poste'] = parts_header[1]
                    elif parts_header:
                        title_candidate = parts_header[0]
                        if not re.match(r'^\d{4}$', title_candidate) and title_candidate.lower() not in ["professionnelles", "expérience", "stage", "developpeur", "data scientist", "ingénieur logiciel", "chef de projet"]:
                            current_exp_info['titre_poste'] = title_candidate
            else:
                current_exp_info['description'] += block_part + "\n"
        
        if current_exp_info and (current_exp_info.get('titre_poste') or current_exp_info.get('entreprise') or (current_exp_info.get('date_debut') and current_exp_info.get('date_fin'))):
            if current_exp_info.get('description'):
                current_exp_info['description'] = safe_strip(current_exp_info['description'])
                current_exp_info['description'] = "\n".join([
                    line for line in current_exp_info['description'].split('\n')
                    if safe_strip(line) and len(safe_strip(line)) > 5 and not re.search(date_pattern_full, line, re.IGNORECASE)
                ])
            temp_experiences.append(ExperienceProfessionnelle(**current_exp_info))
        
        cv_profile.experiences_pro = temp_experiences

    # diplomes
    if "diplomes" in sections_content:
        edu_text = sections_content["diplomes"]
        edu_entry_pattern = re.compile(
            r'^\s*(?P<header_line>'
            r'(?:' + date_pattern_full + r')\s*(?:[^\n]*?)?'
            r'|'
            r'(?:Baccalauréat|Licence|Master|Diplôme|Doctorat|PhD|Ingénieur|DUT|BTS|CQP|CAP|Certificat)\b.*?(?: - | de | en | at | à )?[A-ZÀ-Ÿ][a-zA-ZÀ-ÿ\s,\'-]+(?:, [A-Za-zÀ-ÿ\s-]+)?|'
            r'[A-ZÀ-Ÿ][a-zA-ZÀ-ÿ\s,\'-]+(?:Université|École|Institut|Academy|Collège|Lycée|ENSAI|ENICarthage|ESPRIT|FST|ISG|Polytech|Centrale)\b.*?(?: - | de | en )?.*?)\s*$', 
            flags=re.IGNORECASE | re.MULTILINE
        )
        blocks = edu_entry_pattern.split(edu_text)

        temp_diplomas = []
        current_diploma_info = {}
        for i, block_part in enumerate(blocks):
            block_part = safe_strip(block_part)
            if not block_part:
                continue
            
            is_header = bool(edu_entry_pattern.fullmatch(block_part))

            if is_header:
                if current_diploma_info and (current_diploma_info.get('titre_diplome') or current_diploma_info.get('etablissement') or current_diploma_info.get('date_obtention')):
                    temp_diplomas.append(Diplome(**current_diploma_info))
                
                current_diploma_info = {}
                header_line = block_part
                
                year_match = re.search(r'(\d{4})', header_line)
                if year_match:
                    current_diploma_info['date_obtention'] = safe_strip(year_match.group(1))
                    header_line = safe_strip(header_line.replace(year_match.group(0), ''))

                city_match = re.search(r',\s*([A-Za-zÀ-ÿ\s-]+)$', header_line)
                if city_match:
                    current_diploma_info['ville'] = safe_strip(city_match.group(1))
                    header_line = safe_strip(header_line.replace(city_match.group(0), ''))

                match = re.match(
                    r'^(.*?)(?:(?: - | de | en | at | à )([A-ZÀ-Ÿ][a-zA-ZÀ-ÿ\s,\'-]+(?:Université|École|Institut|Academy|Collège|Lycée|ENSAI|ENICarthage|ESPRIT|FST|ISG|Polytech|Centrale)\b.*?)?)?$', 
                    header_line, re.IGNORECASE
                )
                if match:
                    title_candidate = safe_strip(match.group(1))
                    establishment_candidate = safe_strip(match.group(2))

                    if establishment_candidate:
                        current_diploma_info['etablissement'] = establishment_candidate
                        current_diploma_info['titre_diplome'] = title_candidate if title_candidate else None
                    else:
                        current_diploma_info['titre_diplome'] = title_candidate

                else:
                    current_diploma_info['titre_diplome'] = header_line
                
        if current_diploma_info and (current_diploma_info.get('titre_diplome') or current_diploma_info.get('etablissement') or current_diploma_info.get('date_obtention')):
            temp_diplomas.append(Diplome(**current_diploma_info))
        cv_profile.diplomes = temp_diplomas

    #langues
    if "langues" in sections_content:
        lang_text = sections_content["langues"]
        lang_matches = re.findall(
            r'([A-Za-zÀ-ÿ]+)\s*[:\s(]*(natif|avancé|courant|intermédiaire|débutant|fluent|native|proficient|bilingue|notions|b2|c1|c2|a1|a2|b1)\b[)]?',
            lang_text, re.IGNORECASE)
        for lang, level in lang_matches:
            if lang and level:
                cv_profile.langues[safe_strip(lang).capitalize()] = safe_strip(level).capitalize()
        
        if not cv_profile.langues and lang_text:
            simple_lang_list = [safe_strip(l) for l in re.split(r'[,;\n]', lang_text) if safe_strip(l)]
            for lang in simple_lang_list:
                if len(lang.split()) < 3 and re.match(r'^[A-Za-zÀ-ÿ\s-]+$', lang):
                    cv_profile.langues[lang.capitalize()] = "Non spécifié"

    # projets
    if "projets" in sections_content:
        projets_text = sections_content["projets"]
        project_title_pattern = re.compile(
            r'^\s*(?P<header_line>(?:projet|réalisation|hackathon|application|système|développement)\b.*|'
            r'[A-ZÀ-Ÿ][a-zA-ZÀ-ÿ\s\'-]+(?: \(\d{4}(?:-\d{4})?\))?(?: - )?[A-ZÀ-Ÿ][a-zA-ZÀ-ÿ\s\'-]*(?: \([^)]*\))?)\s*$',
            flags=re.IGNORECASE | re.MULTILINE
        )
        blocks = project_title_pattern.split(projets_text)
        
        temp_projets = []
        current_project_info = {"description": ""}

        for i, block_part in enumerate(blocks):
            block_part = safe_strip(block_part)
            if not block_part:
                continue

            is_header = bool(project_title_pattern.fullmatch(block_part))

            if is_header:
                if current_project_info and current_project_info.get('titre'):
                    if 'description' in current_project_info:
                        current_project_info['description'] = safe_strip(current_project_info['description'])
                        current_project_info['description'] = "\n".join([
                            line for line in current_project_info['description'].split('\n')
                            if safe_strip(line) and len(safe_strip(line)) > 5 and not re.match(r'(?:technologies|stack|envir|outils|langages)[:\s]*', line, re.IGNORECASE)
                        ])
                    temp_projets.append(current_project_info)
                
                current_project_info = {"titre": safe_strip(block_part), "technologies": "", "description": ""}
            else:
                if not current_project_info.get('titre') and temp_projets:
                    temp_projets[-1]["description"] += block_part + "\n"
                    continue
                
                tech_match = re.search(r'(?:technologies|stack|envir|outils|langages)[:\s]*(.*)', block_part, re.IGNORECASE)
                if tech_match:
                    tech_list = [safe_strip(t) for t in re.split(r'[,;]', tech_match.group(1))]
                    current_project_info['technologies'] = ', '.join([t for t in tech_list if t])
                    block_part = safe_strip(re.sub(r'(?:technologies|stack|envir|outils|langages)[:\s]*(.*)', '', block_part, flags=re.IGNORECASE))

                current_project_info['description'] += block_part + "\n"
        
        if current_project_info and current_project_info.get('titre'):
            if 'description' in current_project_info:
                current_project_info['description'] = safe_strip(current_project_info['description'])
                current_project_info['description'] = "\n".join([
                    line for line in current_project_info['description'].split('\n')
                    if safe_strip(line) and len(safe_strip(line)) > 5 and not re.match(r'(?:technologies|stack|envir|outils|langages)[:\s]*', line, re.IGNORECASE)
                ])
            temp_projets.append(current_project_info)
        cv_profile.projets = temp_projets

    return cv_profile