import os
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np
import json

# liste de stop words en français
FRENCH_STOP_WORDS = [
    'a', 'à', 'ait', 'alors', 'apres', 'après', 'as', 'au', 'aux', 'avec', 'avons', 'avoir', 'c', 'ce', 'cela', 'ces',
    'cet', 'cette', 'chaque', 'ci', 'comme', 'comment', 'dans', 'de', 'des', 'du', 'elle', 'elles', 'en', 'entre',
    'est', 'et', 'etc', 'être', 'eu', 'eut', 'eux', 'faire', 'fait', 'faisait', 'faisons', 'font', 'hors', 'il',
    'ils', 'j', 'je', 'juste', 'la', 'le', 'les', 'leur', 'leurs', 'lui', 'ma', 'maintenant', 'mais', 'me', 'même',
    'mes', 'moi', 'moins', 'mon', 'ne', 'ni', 'nommés', 'nos', 'notre', 'nous', 'on', 'ont', 'ou', 'où', 'par',
    'parce', 'pas', 'peut', 'peuvent', 'peux', 'plus', 'pour', 'pourquoi', 'qu', 'quand', 'que', 'quel', 'quelle',
    'quelles', 'quels', 'qui', 'sa', 'sans', 'se', 'sera', 'serait', 'seront', 'ses', 'seulement', 'si', 'sien',
    'son', 'sont', 'sur', 'ta', 'tandis', 'te', 'tel', 'tels', 'tes', 'ton', 'tous', 'tout', 'toute', 'toutes',
    'tu', 'un', 'une', 'uns', 'vas', 'vers', 'vous', 'vos', 'votre', 'y', 'à', 'ça', 'ça', 'c\'est', 'c’est',
    'd\'un', 'd\'une', 'eût', 'ici', 'j\'ai', 'l\'on', 'l\'un', 'lors', 'm\'a', 'm\'ont', 'même', 'n\'a', 'n\'avait',
    'n\'avaient', 'n\'est', 'ne', 'ni', 'nulle', 'où', 'on', 'ou', 'plus', 'quand', 'que', 'quoi', 's\'est',
    'si', 'son', 'sous', 'tous', 'tout', 'trop', 'très', 'votre', 'vers', 'y', 'ça', 'dès', 'donc', 'malgré',
    'moi', 'tout', 'car', 'ceci', 'cela', 'celui', 'ceux', 'celle', 'celles', 'devant', 'derrière', 'depuis',
    'environ', 'jusque', 'malgré', 'outre', 'parmi', 'pendant', 'quant', 'sauf', 'selon', 'sous', 'vers',
    'via', 'voici', 'voilà', 'depuis', 'durant', 'excepté', 'hormis', 'inclus', 'nonobstant', 'pendant', 'plusieurs',
    'quelques', 'toutefois', 'entre autres'
]


def generate_text_from_profile(profile_data: dict) -> str:
   
    text_parts = []

    # ajouter  profil
    if profile_data.get('profil_resume'):
        text_parts.append(profile_data['profil_resume'])

    # ajouter  competences
    if profile_data.get('competences'):
        text_parts.extend(profile_data['competences'])

    # ajouter  expériences 
    if profile_data.get('experiences_pro'):
        for exp in profile_data['experiences_pro']:
            if exp and isinstance(exp, dict): 
                if exp.get('titre_poste'):
                    text_parts.append(exp['titre_poste'])
                if exp.get('entreprise'):
                    text_parts.append(exp['entreprise'])
                if exp.get('description'):
                    text_parts.append(exp['description'])

    # ajouter diplômes
    if profile_data.get('diplomes'):
        for diplome in profile_data['diplomes']:
            if diplome and isinstance(diplome, dict): 
                if diplome.get('titre_diplome'):
                    text_parts.append(diplome['titre_diplome'])
                if diplome.get('etablissement'):
                    text_parts.append(diplome['etablissement'])
                if diplome.get('ville'):
                    text_parts.append(diplome['ville'])


    # ajouter  mots-clés d'offre 
    if profile_data.get('keywords'):
        text_parts.extend(profile_data['keywords'])

    # ajouter  langues
    if profile_data.get('langues'):
        text_parts.extend(profile_data['langues'].keys())

    # ajouter  projets
    if profile_data.get('projets'):
        for proj in profile_data['projets']:
            if proj and isinstance(proj, dict): 
                if proj.get('titre'):
                    text_parts.append(proj['titre'])
                if proj.get('technologies'):
                    text_parts.append(proj['technologies'])
                if proj.get('description'):
                    text_parts.append(proj['description'])

    return " ".join(text_parts).lower()

def calculate_similarity(cv_profiles: dict, job_offers: dict):

    # calcule  similarité cosinus entre  CVs et  offres d'emploi.
    
    cv_texts = []
    cv_names = []
    for cv_name, cv_data in cv_profiles.items():
        cv_texts.append(generate_text_from_profile(cv_data))
        cv_names.append(cv_name)

    offer_texts = []
    offer_names = []
    for offer_name, offer_data in job_offers.items():
        offer_texts.append(generate_text_from_profile(offer_data))
        offer_names.append(offer_name)

   
    all_texts = cv_texts + offer_texts

    
    vectorizer = TfidfVectorizer(stop_words=FRENCH_STOP_WORDS, ngram_range=(1,2), min_df=1, max_df=0.8)

  
    tfidf_matrix = vectorizer.fit_transform(all_texts)

    # separer  matrices TF-IDF des CVs et des offres
    cv_tfidf_matrix = tfidf_matrix[:len(cv_texts)]
    offer_tfidf_matrix = tfidf_matrix[len(cv_texts):]

    # Calcule  similarité cosinus
    similarity_matrix = cosine_similarity(cv_tfidf_matrix, offer_tfidf_matrix)

    results = []
    for i, cv_name in enumerate(cv_names):
        cv_result = {"cv": cv_name, "matches": []}
        for j, offer_name in enumerate(offer_names):
            score = similarity_matrix[i, j]
            cv_result["matches"].append({"offer": offer_name, "score": float(f"{score:.4f}")})
        
        # Tri  correspondances par score décroissant
        cv_result["matches"].sort(key=lambda x: x["score"], reverse=True)
        results.append(cv_result)
    
    return results

def load_processed_data(directory: str) -> dict:
   
    data = {}
    for filename in os.listdir(directory):
        if filename.endswith('.json'):
            filepath = os.path.join(directory, filename)
            with open(filepath, 'r', encoding='utf-8') as f:
                data[filename] = json.load(f)
    return data