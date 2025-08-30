from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import logging
from pathlib import Path
import requests
from src.parsers.pdf_parser import extract_text_from_pdf
from src.parsers.offre_parser import extract_text_from_offer
from src.matching.matching_system import EnhancedMatchingSystem
from config import Config
import tempfile
import json


logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app, origins=["http://localhost:3000", "http://localhost:8081"])


matcher = EnhancedMatchingSystem()

@app.route('/health', methods=['GET'])
def health_check():
    
    return jsonify({
        "status": "healthy",
        "service": "CV-Job Matching Service",
        "version": "1.0.0"
    })

@app.route('/match', methods=['POST'])
def match_cv_job():
   
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({"error": "Aucune donnée fournie"}), 400
        
        
        if 'cv_path' in data and 'offre_text' in data:
            cv_path = data['cv_path']
            offre_text = data['offre_text']
            
            logger.info(f"Traitement du CV: {cv_path}")
            
           
            cv_text = extract_text_from_pdf(cv_path)
            
            if not cv_text:
                return jsonify({"error": f"Impossible d'extraire le texte du CV: {cv_path}"}), 400
            
            if not offre_text:
                return jsonify({"error": "Texte de l'offre vide"}), 400
            
            logger.info(f"Texte du CV: {cv_text[:200]}")
            logger.info(f"Texte de l'offre: {offre_text[:200]}")
            
           
            result = matcher.compute_enhanced_score(cv_text, offre_text)

            logger.info(f"Score calculé = {result['final_score']}%")
            
            
            return jsonify({
                "score": result['final_score'] / 100.0  
            })
        
        
        elif 'cv_text' in data and 'job_text' in data:
            cv_text = data['cv_text']
            job_text = data['job_text']
            
            result = matcher.compute_enhanced_score(cv_text, job_text)
            
            return jsonify({
                "score": result['final_score'] / 100.0,
                "detailed_result": result
            })
        
        else:
            return jsonify({"error": "Format de données invalide. Attendu: cv_path + offre_text"}), 400
        
    except Exception as e:
        logger.error(f"Erreur lors du matching: {str(e)}")
        return jsonify({"error": f"Erreur interne: {str(e)}"}), 500

@app.route('/match/detailed', methods=['POST'])
def match_cv_job_detailed():
   
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({"error": "Aucune donnée fournie"}), 400
        
        cv_text = ""
        job_text = ""
        
     
        if 'cv_path' in data and 'offre_text' in data:
            cv_path = data['cv_path']
            cv_text = extract_text_from_pdf(cv_path)
            job_text = data['offre_text']
        
        
        elif 'cv_text' in data and 'job_text' in data:
            cv_text = data['cv_text']
            job_text = data['job_text']
        
        else:
            return jsonify({"error": "Format de données invalide"}), 400
        
        if not cv_text or not job_text:
            return jsonify({"error": "Impossible d'extraire le texte"}), 400
        
        
        result = matcher.compute_enhanced_score(cv_text, job_text)
        
        return jsonify({
            "success": True,
            "score": result['final_score'] / 100.0,
            "score_percentage": result['final_score'],  
            "detailed_scores": result['detailed_scores'],
            "matching_skills": result['matching_skills'],
            "missing_skills": result['missing_skills'],
            "cv_analysis": result['cv_analysis'],
            "offer_analysis": result['offer_analysis']
        })
        
    except Exception as e:
        logger.error(f"Erreur lors du matching détaillé: {str(e)}")
        return jsonify({"error": f"Erreur interne: {str(e)}"}), 500

@app.route('/match/cv-jobs-batch', methods=['POST'])
def match_cv_jobs_batch():
 
    try:
        data = request.get_json()
        
        if not data or 'cv_text' not in data or 'jobs' not in data:
            return jsonify({"error": "Format de données invalide"}), 400
        
        cv_text = data['cv_text']
        jobs = data['jobs']
        
        results = []
        
        for job in jobs:
            if 'job_id' not in job or 'job_text' not in job:
                continue
                
            match_result = matcher.compute_enhanced_score(cv_text, job['job_text'])
            
            results.append({
                "job_id": job['job_id'],
                "score": match_result['final_score'],
                "detailed_scores": match_result['detailed_scores'],
                "matching_skills": match_result['matching_skills'],
                "missing_skills": match_result['missing_skills']
            })
        
        
        results.sort(key=lambda x: x['score'], reverse=True)
        
        return jsonify({
            "success": True,
            "cv_analysis": matcher.processor.extract_enhanced_entities(cv_text),
            "matches": results
        })
        
    except Exception as e:
        logger.error(f"Erreur lors du matching batch: {str(e)}")
        return jsonify({"error": f"Erreur interne: {str(e)}"}), 500

@app.route('/recommendations/candidate/<int:candidate_id>', methods=['GET'])
def get_candidate_recommendations(candidate_id):
    
    try:
        
        spring_boot_url = Config.SPRING_BOOT_URL
        
    
        cv_response = requests.get(f"{spring_boot_url}/api/candidates/{candidate_id}/cv")
        
        if cv_response.status_code != 200:
            return jsonify({"error": "Impossible de récupérer le CV du candidat"}), 404
        
        cv_data = cv_response.json()
        cv_text = cv_data.get('cv_text', '')
        
        if not cv_text:
            return jsonify({"error": "CV non disponible"}), 404
        
        
        jobs_response = requests.get(f"{spring_boot_url}/api/jobs/active")
        
        if jobs_response.status_code != 200:
            return jsonify({"error": "Impossible de récupérer les offres"}), 500
        
        jobs = jobs_response.json()
        
        
        recommendations = []
        
        for job in jobs:
            job_text = f"{job.get('title', '')} {job.get('description', '')}"
            match_result = matcher.compute_enhanced_score(cv_text, job_text)
            
            
            if match_result['final_score'] >= Config.DEFAULT_SCORE_THRESHOLD * 100:
                recommendations.append({
                    "job_id": job['id'],
                    "job_title": job.get('title', ''),
                    "company": job.get('company', ''),
                    "score": match_result['final_score'],
                    "matching_skills": match_result['matching_skills'],
                    "detailed_scores": match_result['detailed_scores']
                })
        
       
        recommendations.sort(key=lambda x: x['score'], reverse=True)
        
        return jsonify(recommendations)
        
    except Exception as e:
        logger.error(f"Erreur lors de la récupération des recommandations: {str(e)}")
        return jsonify({"error": f"Erreur interne: {str(e)}"}), 500

@app.route('/recommendations/candidate/<int:candidate_id>/top/<int:limit>', methods=['GET'])
def get_top_candidate_recommendations(candidate_id, limit):
    
    try:
        
        recommendations_response = get_candidate_recommendations(candidate_id)
        
        if recommendations_response.status_code != 200:
            return recommendations_response
        
        recommendations = recommendations_response.get_json()
        limited_recommendations = recommendations[:limit]
        
        return jsonify(limited_recommendations)
        
    except Exception as e:
        logger.error(f"Erreur lors de la récupération du top des recommandations: {str(e)}")
        return jsonify({"error": f"Erreur interne: {str(e)}"}), 500

@app.route('/applications/recalculate-scores', methods=['POST'])
def recalculate_application_scores():
   
    try:
        spring_boot_url = Config.SPRING_BOOT_URL
        
        
        applications_response = requests.get(f"{spring_boot_url}/api/applications/all")
        
        if applications_response.status_code != 200:
            return jsonify({"error": "Impossible de récupérer les candidatures"}), 500
        
        applications = applications_response.json()
        updated_count = 0
        
        for application in applications:
            try:
               
                cv_response = requests.get(f"{spring_boot_url}/api/candidates/{application['candidate_id']}/cv")
                if cv_response.status_code != 200:
                    continue
                
                cv_data = cv_response.json()
                cv_text = cv_data.get('cv_text', '')
                
               
                job_response = requests.get(f"{spring_boot_url}/api/jobs/{application['job_id']}")
                if job_response.status_code != 200:
                    continue
                
                job_data = job_response.json()
                job_text = f"{job_data.get('title', '')} {job_data.get('description', '')}"
                
                
                match_result = matcher.compute_enhanced_score(cv_text, job_text)
                
               
                update_data = {
                    "score": match_result['final_score'],
                    "detailed_scores": match_result['detailed_scores'],
                    "matching_skills": match_result['matching_skills']
                }
                
                update_response = requests.put(
                    f"{spring_boot_url}/api/applications/{application['id']}/score",
                    json=update_data
                )
                
                if update_response.status_code == 200:
                    updated_count += 1
                    
            except Exception as e:
                logger.warning(f"Erreur lors du recalcul pour l'application {application['id']}: {str(e)}")
                continue
        
        return jsonify({
            "success": True,
            "message": f"{updated_count} candidatures mises à jour"
        })
        
    except Exception as e:
        logger.error(f"Erreur lors du recalcul des scores: {str(e)}")
        return jsonify({"error": f"Erreur interne: {str(e)}"}), 500

@app.route('/analyze/cv', methods=['POST'])
def analyze_cv():
   
    try:
        if request.content_type.startswith('multipart/form-data'):
        
            if 'cv_file' not in request.files:
                return jsonify({"error": "Aucun fichier fourni"}), 400
            
            file = request.files['cv_file']
            
            if file.filename == '':
                return jsonify({"error": "Aucun fichier sélectionné"}), 400
            
            
            with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as temp_file:
                file.save(temp_file.name)
                cv_text = extract_text_from_pdf(temp_file.name)
                os.unlink(temp_file.name) 
        
        else:
            
            data = request.get_json()
            if not data or 'cv_text' not in data:
                return jsonify({"error": "Texte du CV manquant"}), 400
            cv_text = data['cv_text']
        
        if not cv_text:
            return jsonify({"error": "Impossible d'extraire le texte du CV"}), 400
        
        
        cv_analysis = matcher.processor.extract_enhanced_entities(cv_text)
        
        return jsonify({
            "success": True,
            "cv_analysis": cv_analysis
        })
        
    except Exception as e:
        logger.error(f"Erreur lors de l'analyse du CV: {str(e)}")
        return jsonify({"error": f"Erreur interne: {str(e)}"}), 500

@app.route('/analyze/job', methods=['POST'])
def analyze_job():
    
    try:
        data = request.get_json()
        
        if not data or 'job_text' not in data:
            return jsonify({"error": "Texte de l'offre manquant"}), 400
        
        job_text = data['job_text']
        
       
        job_analysis = matcher.processor.extract_enhanced_entities(job_text)
        
        return jsonify({
            "success": True,
            "job_analysis": job_analysis
        })
        
    except Exception as e:
        logger.error(f"Erreur lors de l'analyse de l'offre: {str(e)}")
        return jsonify({"error": f"Erreur interne: {str(e)}"}), 500

if __name__ == '__main__':
   
    Config.create_directories()
    
    logger.info("🚀 Démarrage du service de matching CV-Offres")
    logger.info(f"📍 URL Spring Boot: {Config.SPRING_BOOT_URL}")
    logger.info(f"🎯 Seuil de score par défaut: {Config.DEFAULT_SCORE_THRESHOLD}")
    
    app.run(
        host=Config.API_HOST,
        port=Config.API_PORT,
        debug=Config.DEBUG
    )