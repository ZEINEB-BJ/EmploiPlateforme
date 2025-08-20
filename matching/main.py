import os
import json
from src.pdf_parser import parse_cv
from src.data_processor import ProfilCandidat, ExperienceProfessionnelle, Diplome
from src.offre_parser import read_offer_content, extract_keywords_from_offer
from src.matching_system import calculate_similarity, load_processed_data 

def main():
    # paths
    base_dir = os.path.dirname(os.path.abspath(__file__)) 
    data_dir = os.path.join(base_dir, 'data')
    cv_directory = os.path.join(data_dir, 'cvs') 
    offres_directory = os.path.join(data_dir, 'offres')
    
    processed_dir = os.path.join(data_dir, 'processed')
    processed_cvs_dir = os.path.join(processed_dir, 'cvs')
    processed_offres_dir = os.path.join(processed_dir, 'offres')

    
    os.makedirs(cv_directory, exist_ok=True)
    os.makedirs(offres_directory, exist_ok=True)
    os.makedirs(processed_dir, exist_ok=True)
    os.makedirs(processed_cvs_dir, exist_ok=True)
    os.makedirs(processed_offres_dir, exist_ok=True)

    # analyse CV
    print("--- Démarrage de l'analyse des CVs ---")
    cv_files = [f for f in os.listdir(cv_directory) if f.endswith('.pdf')]
    all_cv_profiles = {} # stocker profils de CV analysés

    if not cv_files:
        print(f"Le répertoire '{cv_directory}' est vide ou ne contient pas de fichiers PDF. Veuillez y placer vos fichiers PDF.")
        

    for cv_file in cv_files:
        cv_path = os.path.join(cv_directory, cv_file)
        print(f"\n--- Analyse de {cv_file} ---")
        try:
            cv_profile = parse_cv(cv_path)
            
            # affichage infos extraites
            print(f"Nom: {cv_profile.nom}")
            print(f"Email: {cv_profile.email}")
            print(f"Téléphone: {cv_profile.telephone}")
            print(f"Liens: {', '.join(cv_profile.liens)}")
            print(f"Profil/Résumé: {cv_profile.profil_resume[:100]}..." if cv_profile.profil_resume else "N/A")
            print(f"Compétences ({len(cv_profile.competences)}): {', '.join(cv_profile.competences)}")
            
            print(f"Expériences ({len(cv_profile.experiences_pro)}):")
            for exp in cv_profile.experiences_pro:
                print(f"  - {exp.titre_poste or 'N/A'} chez {exp.entreprise or 'N/A'} à {exp.ville or 'N/A'} ({exp.date_debut or 'N/A'}-{exp.date_fin or 'N/A'})")
            
            print(f"Diplômes ({len(cv_profile.diplomes)}):")
            for diplome in cv_profile.diplomes:
                print(f"  - {diplome.titre_diplome or 'N/A'} de {diplome.etablissement or 'N/A'} à {diplome.ville or 'N/A'} ({diplome.date_obtention or 'N/A'})")
            
            print(f"Langues: {cv_profile.langues}")
            print(f"Projets ({len(cv_profile.projets)}):")
            for proj in cv_profile.projets:
                print(f"  - {proj.get('titre', 'N/A')} (Tech: {proj.get('technologies', 'N/A')})")

            # save dans fichier JSON
            output_json_path = os.path.join(processed_cvs_dir, f"{os.path.splitext(cv_file)[0]}.json")
            # Convert ProfilCandidat en dictionnaire 
            cv_profile_dict = {
                "raw_text": cv_profile.raw_text,
                "nom": cv_profile.nom,
                "email": cv_profile.email,
                "telephone": cv_profile.telephone,
                "liens": cv_profile.liens,
                "profil_resume": cv_profile.profil_resume,
                "competences": cv_profile.competences,
                "experiences_pro": [exp.__dict__ for exp in cv_profile.experiences_pro],
                "diplomes": [diplome.__dict__ for diplome in cv_profile.diplomes],
                "langues": cv_profile.langues,
                "projets": cv_profile.projets
            }
            with open(output_json_path, 'w', encoding='utf-8') as f:
                json.dump(cv_profile_dict, f, ensure_ascii=False, indent=4)
            print(f"Profil sauvegardé en: {output_json_path}")
            all_cv_profiles[os.path.basename(output_json_path)] = cv_profile_dict 

        except Exception as e:
            print(f"Une erreur inattendue est survenue lors de l'analyse de {cv_file}: {e}")

    print("\nAnalyse des CVs terminée.")
    print("-----------------------------------")

    # analyse  offres d'emploi ---
    print("\n--- Démarrage de l'analyse des offres d'emploi ---")
    offer_files = [f for f in os.listdir(offres_directory) if f.endswith('.txt')]
    all_job_offers = {} # stocker  offres analysées

    if not offer_files:
        print(f"Le répertoire '{offres_directory}' est vide ou ne contient pas de fichiers texte. Veuillez y placer vos fichiers d'offres.")
        

    for offer_file in offer_files:
        offer_path = os.path.join(offres_directory, offer_file)
        print(f"\n--- Analyse de {offer_file} ---")
        try:
            offer_content = read_offer_content(offer_path)
            if offer_content:
                extracted_keywords = extract_keywords_from_offer(offer_content)
                offer_data = {
                    "raw_content": offer_content,
                    "keywords": extracted_keywords
                }
                all_job_offers[f"{os.path.splitext(offer_file)[0]}.json"] = offer_data 

                print(f"Mots-clés extraits ({len(extracted_keywords)}): {', '.join(extracted_keywords)}")

                
                output_json_path = os.path.join(processed_offres_dir, f"{os.path.splitext(offer_file)[0]}.json")
                with open(output_json_path, 'w', encoding='utf-8') as f:
                    json.dump(offer_data, f, ensure_ascii=False, indent=4)
                print(f"Mots-clés sauvegardés en: {output_json_path}")
            else:
                print(f"Contenu vide pour l'offre {offer_file}")
        except Exception as e:
            print(f"Une erreur inattendue est survenue lors de l'analyse de {offer_file}: {e}")

    print("\nAnalyse des offres terminée.")
    print("-----------------------------------")

    # calcul similarité 
    if all_cv_profiles and all_job_offers:
        print("\n--- Calcul de la similarité CV / Offres ---")
        matching_results = calculate_similarity(all_cv_profiles, all_job_offers)

        for cv_match in matching_results:
            cv_name = cv_match["cv"].replace('.json', '')
            print(f"\nCorrespondances pour {cv_name}:")
            for match in cv_match["matches"]:
                offer_name = match["offer"].replace('.json', '')
                print(f"  - Offre '{offer_name}': Score = {match['score']:.4f}")
        
        
        matching_output_path = os.path.join(processed_dir, 'matching_results.json')
        with open(matching_output_path, 'w', encoding='utf-8') as f:
            json.dump(matching_results, f, ensure_ascii=False, indent=4)
        print(f"\nRésultats de matching sauvegardés en: {matching_output_path}")

    else:
        print("\nImpossible de calculer la similarité : pas de CVs ou pas d'offres analysés.")

    print("\nTraitement terminé.")


if __name__ == "__main__":
    main()