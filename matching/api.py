from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import logging
import requests
from src.parsers.pdf_parser import extract_text_from_pdf
from src.matching.matching_system import EnhancedMatchingSystem
from config import Config
import tempfile

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


# ================= MATCH SIMPLE =================
@app.route('/match', methods=['POST'])
def match_cv_job():
    try:
        data = request.get_json()

        if not data:
            return jsonify({"error": "Aucune donnée fournie"}), 400

        # ✅ Utilisation uniforme : cv_text + offre_text
        if 'cv_text' in data and 'offre_text' in data:
            cv_text = data['cv_text']
            offre_text = data['offre_text']

            if not cv_text or not offre_text:
                return jsonify({"error": "Texte CV ou offre vide"}), 400

            result = matcher.compute_enhanced_score(cv_text, offre_text)

            logger.info(f"Score calculé = {result['final_score']}%")

            return jsonify({
                "score": result['final_score'] / 100.0,
                "detailed_result": result
            })

        return jsonify({"error": "Format invalide. Attendu: cv_text + offre_text"}), 400

    except Exception as e:
        logger.error(f"Erreur lors du matching: {str(e)}")
        return jsonify({"error": f"Erreur interne: {str(e)}"}), 500


# ================= MATCH DÉTAILLÉ =================
@app.route('/match/detailed', methods=['POST'])
def match_cv_job_detailed():
    try:
        data = request.get_json()

        if not data or 'cv_text' not in data or 'offre_text' not in data:
            return jsonify({"error": "Format invalide. Attendu: cv_text + offre_text"}), 400

        cv_text = data['cv_text']
        offre_text = data['offre_text']

        if not cv_text or not offre_text:
            return jsonify({"error": "Impossible d'extraire le texte"}), 400

        result = matcher.compute_enhanced_score(cv_text, offre_text)

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


# ================= MATCH BATCH =================
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
            if 'job_id' not in job or 'offre_text' not in job:
                continue

            match_result = matcher.compute_enhanced_score(cv_text, job['offre_text'])

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


# ================= ANALYSE CV =================
@app.route('/analyze/cv', methods=['POST'])
def analyze_cv():
    try:
        cv_text = ""

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


# ================= ANALYSE OFFRE =================
@app.route('/analyze/job', methods=['POST'])
def analyze_job():
    try:
        data = request.get_json()

        if not data or 'offre_text' not in data:
            return jsonify({"error": "Texte de l'offre manquant"}), 400

        job_text = data['offre_text']
        job_analysis = matcher.processor.extract_enhanced_entities(job_text)

        return jsonify({
            "success": True,
            "job_analysis": job_analysis
        })

    except Exception as e:
        logger.error(f"Erreur lors de l'analyse de l'offre: {str(e)}")
        return jsonify({"error": f"Erreur interne: {str(e)}"}), 500


# ================= MAIN =================
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
