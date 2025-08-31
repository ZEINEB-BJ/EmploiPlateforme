from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from src.preprocessing.data_processor import clean_text, extract_entities, EnhancedDataProcessor
import numpy as np
from typing import Dict, List

class EnhancedMatchingSystem:
    def __init__(self):
        self.vectorizer = TfidfVectorizer(
            stop_words='english',
            ngram_range=(1, 3),   
            max_features=5000,
            min_df=1,
            max_df=0.95
        )
        self.processor = EnhancedDataProcessor()
        
      
        self.weights = {
            'technical_skills': 0.35,  
            'text_similarity': 0.20,
            'education_match': 0.10,
            'experience_match': 0.25,
            'language_match': 0.05,
            'location_match': 0.05
        }
    
    def compute_enhanced_score(self, cv_text: str, offer_text: str) -> Dict:
        cv_entities = self.processor.extract_enhanced_entities(cv_text)
        offer_entities = self.processor.extract_enhanced_entities(offer_text)
        
        scores = {}

        
        scores['technical_skills'] = self.compute_technical_skills_score(
            cv_entities['technical_skills'], 
            offer_entities['technical_skills']
        )

      
        scores['text_similarity'] = self.compute_text_similarity_score(cv_text, offer_text)

      
        scores['education_match'] = self.compute_education_score(
            cv_entities['education'], 
            offer_entities['education']
        )

        
        scores['experience_match'] = self.compute_experience_score(
            cv_entities['experience_years'], 
            offer_entities['experience_years']
        )

    
        scores['language_match'] = self.compute_language_score(
            cv_entities['languages'], 
            offer_entities['languages']
        )

    
        scores['location_match'] = self.compute_location_score(
            cv_entities['locations'], 
            offer_entities['locations']
        )
        
       
        final_score = sum(scores[key] * self.weights[key] for key in self.weights.keys())
        final_score = min(100, max(0, final_score * 100)) 
        
        return {
            'final_score': round(final_score, 2),
            'detailed_scores': {k: round(v * 100, 2) for k, v in scores.items()},
            'cv_analysis': cv_entities,
            'offer_analysis': offer_entities,
            'matching_skills': list(set(cv_entities['technical_skills']) & 
                                   set(offer_entities['technical_skills'])),
            'missing_skills': list(set(offer_entities['technical_skills']) - 
                                 set(cv_entities['technical_skills']))
        }
    
    def compute_technical_skills_score(self, cv_skills: List[str], offer_skills: List[str]) -> float:
        if not offer_skills:
            return 0.8 
        
        cv_skills_set = set(skill.lower() for skill in cv_skills)
        offer_skills_set = set(skill.lower() for skill in offer_skills)
        
        matching_skills = cv_skills_set.intersection(offer_skills_set)
        
        if not offer_skills_set:
            return 0.0
        
        base_score = len(matching_skills) / len(offer_skills_set)
        
        bonus = min(0.2, (len(cv_skills_set) - len(offer_skills_set)) / len(offer_skills_set)) if len(offer_skills_set) > 0 else 0
        bonus = max(0, bonus) 
        
        return min(1.0, base_score + bonus)
    
    def compute_text_similarity_score(self, cv_text: str, offer_text: str) -> float:
        try:
            cv_clean = clean_text(cv_text)
            offer_clean = clean_text(offer_text)
            
            if not cv_clean or not offer_clean:
                return 0.0
            
            tfidf_matrix = self.vectorizer.fit_transform([cv_clean, offer_clean])
            similarity = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])[0][0]
            
            return float(similarity)
        except Exception:
            return 0.0
    
    def compute_education_score(self, cv_education: List[str], offer_education: List[str]) -> float:
        if not offer_education:
            return 0.7  
        
        education_levels = {
            'doctorat': 5, 'phd': 5, 'docteur': 5,
            'master': 4, 'mastère': 4, 'm2': 4, 'm1': 3.5,
            'ingénieur': 4, 'école d\'ingénieur': 4,
            'licence': 3, 'l3': 3, 'l2': 2.5, 'l1': 2,
            'bts': 2, 'dut': 2, 'deust': 2,
            'baccalauréat': 1, 'bac': 1
        }
        
        cv_max_level = 0
        offer_max_level = 0
        
        for edu in cv_education:
            for level, value in education_levels.items():
                if level in edu.lower():
                    cv_max_level = max(cv_max_level, value)
        
        for edu in offer_education:
            for level, value in education_levels.items():
                if level in edu.lower():
                    offer_max_level = max(offer_max_level, value)
        
        if offer_max_level == 0:
            return 0.7
        
        if cv_max_level >= offer_max_level:
            return 1.0
        elif cv_max_level >= offer_max_level - 1:
            return 0.8
        else:
            return 0.4
    
    def compute_experience_score(self, cv_years: List[int], offer_years: List[int]) -> float:
        if not offer_years:
            return 0.7  
        
        cv_max_exp = max(cv_years) if cv_years else 0
        offer_required_exp = max(offer_years) if offer_years else 0
        
        if cv_max_exp >= offer_required_exp:
            return 1.0
        elif cv_max_exp >= offer_required_exp * 0.8:
            return 0.8
        elif cv_max_exp >= offer_required_exp * 0.5:
            return 0.6
        else:
            return 0.3
    
    def compute_language_score(self, cv_languages: List[str], offer_languages: List[str]) -> float:
        if not offer_languages:
            return 1.0
        
        cv_lang_set = set(lang.lower() for lang in cv_languages)
        offer_lang_set = set(lang.lower() for lang in offer_languages)
        
        matching_languages = cv_lang_set.intersection(offer_lang_set)
        
        if not offer_lang_set:
            return 1.0
        
        return len(matching_languages) / len(offer_lang_set)
    
    def compute_location_score(self, cv_locations: List[str], offer_locations: List[str]) -> float:
        if not offer_locations:
            return 1.0
        
        cv_loc_set = set(loc.lower() for loc in cv_locations)
        offer_loc_set = set(loc.lower() for loc in offer_locations)
        
        if cv_loc_set.intersection(offer_loc_set):
            return 1.0
        else:
            return 0.5  
    
    def compute_score(self, cv_text: str, offer_text: str) -> float:
        result = self.compute_enhanced_score(cv_text, offer_text)
        return result['final_score']
