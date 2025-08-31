import re
import spacy
from typing import Dict, List, Set

try:
    nlp = spacy.load("fr_core_news_md")  
except OSError:
    nlp = spacy.load("fr_core_news_sm")

class EnhancedDataProcessor:
    def __init__(self):
       
        self.technical_skills = {
            'programmation': ['python', 'java', 'javascript', 'react', 'spring boot', 'mysql', 'html', 'css', 'node.js', 'angular', 'vue.js', 'php', 'c++', 'c#', '.net'],
            'data': ['pandas', 'numpy', 'scikit-learn', 'tensorflow', 'pytorch', 'sql', 'mongodb', 'postgresql', 'spark', 'hadoop'],
            'devops': ['docker', 'kubernetes', 'jenkins', 'git', 'gitlab', 'aws', 'azure', 'linux', 'nginx', 'apache'],
            'design': ['photoshop', 'illustrator', 'figma', 'sketch', 'indesign', 'canva'],
            'marketing': ['google analytics', 'facebook ads', 'seo', 'sem', 'content marketing', 'social media'],
            'finance': ['excel', 'sap', 'sage', 'quickbooks', 'powerbi', 'tableau'],
            'langages': ['français', 'anglais', 'espagnol', 'allemand', 'italien', 'arabe', 'chinois']
        }

       
        self.experience_patterns = [
            r'(\d+)\s*(?:ans?|années?)\s*(?:d[\'\’])?expériences?',
            r'(\d+)\s*(?:ans?|années?)\s*dans',
            r'expériences?\s*de\s*(\d+)\s*(?:ans?|années?)',
            r'depuis\s*(\d+)\s*(?:ans?|années?)',
            r'(\d+)ans'  
        ]

       
        self.education_patterns = [
            r'\b(master|mastère|m[12])\b',
            r'\b(licence|l[123])\b',
            r'\b(doctorat|phd|docteur)\b',
            r'\b(ingénieur|école d[\'’]ingénieur)\b',
            r'\b(bts|dut|deust)\b',
            r'\b(baccalauréat|bac\s*\+?\s*\d*)\b'
        ]

    def clean_text_advanced(self, text: str) -> str:
       
        text = re.sub(r'\s+', ' ', text)
        text = re.sub(r'(\w+)\s*v?(\d+(?:\.\d+)*)', r'\1\2', text)

        words = text.split()
        processed_words = []

        for word in words:
            if word.isupper() and len(word) > 1:
                processed_words.append(word)
            else:
                processed_words.append(word.lower())

        return ' '.join(processed_words)

    def extract_technical_skills(self, text: str) -> Set[str]:
       
        text_lower = text.lower()
        found_skills = set()

        for _, skills in self.technical_skills.items():
            for skill in skills:
                if skill in text_lower:
                    found_skills.add(skill)

               
                skill_variations = [
                    skill.replace(' ', ''),
                    skill.replace(' ', '-'),
                    skill.replace('.', '')
                ]
                for variation in skill_variations:
                    if variation in text_lower:
                        found_skills.add(skill)

        return found_skills

    def extract_experience_years(self, text: str) -> List[int]:
        
        years = []
        text_lower = text.lower()

        for pattern in self.experience_patterns:
            matches = re.findall(pattern, text_lower)
            for match in matches:
                try:
                    years.append(int(match))
                except ValueError:
                    continue

        return years

    def extract_education_level(self, text: str) -> List[str]:
      
        education = []
        text_lower = text.lower()

        for pattern in self.education_patterns:
            matches = re.findall(pattern, text_lower)
            education.extend(matches)

        return list(set(education))

    def extract_languages(self, text: str) -> Set[str]:
       
        found_languages = set()
        text_lower = text.lower()

        for language in self.technical_skills['langages']:
            if language in text_lower:
                found_languages.add(language)

        return found_languages

    def extract_enhanced_entities(self, text: str) -> Dict:
        
        clean_text = self.clean_text_advanced(text)

        technical_skills = self.extract_technical_skills(text)
        experience_years = self.extract_experience_years(text)
        education = self.extract_education_level(text)
        languages = self.extract_languages(text)

        doc = nlp(text)
        organizations = []
        locations = []

        for ent in doc.ents:
            if ent.label_ in ["ORG"]:
                organizations.append(ent.text.strip())
            elif ent.label_ in ["LOC", "GPE"]:
                locations.append(ent.text.strip())

        return {
            "technical_skills": list(technical_skills),
            "experience_years": experience_years,
            "education": education,
            "languages": list(languages),
            "organizations": list(set(organizations)),
            "locations": list(set(locations)),
            "total_skills_count": len(technical_skills)
        }


def clean_text(text: str) -> str:
    processor = EnhancedDataProcessor()
    return processor.clean_text_advanced(text)

def extract_entities(text: str) -> dict:
    
    processor = EnhancedDataProcessor()
    enhanced_entities = processor.extract_enhanced_entities(text)

    return {
        "technical_skills": enhanced_entities["technical_skills"],
        "experience_years": enhanced_entities["experience_years"],
        "education": enhanced_entities["education"], 
        "languages": enhanced_entities["languages"],
        "locations": enhanced_entities["locations"]
    }
