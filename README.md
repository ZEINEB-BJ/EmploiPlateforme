# EmploiPlateforme

## 📌 Présentation

**EmploiPlateforme** est une application web de gestion des offres d’emploi permettant de faciliter le processus de recrutement entre **employeurs** et **candidats**.

La plateforme propose une gestion complète du cycle de recrutement : publication des offres, consultation, candidature, gestion des statuts, et analyse intelligente de CVs avec système de matching automatique.

---

## 🚀 Fonctionnalités principales

### 🔐 Authentification
- Authentification sécurisée avec JWT
- Rôles : `CANDIDAT` et `EMPLOYEUR`

### 👤 Côté Candidat
- Inscription et connexion
- Ajout/modification de profil avec téléversement de CV
- Consultation des offres d’emploi
- Recommandations d'offres personnalisées basées sur l'analyse du CV
- Postulation avec lettre de motivation
- Suivi de l’état des candidatures (en attente, acceptée, refusée)

### 🏢 Côté Employeur
- Création, modification et suppression d’offres
- Consultation des candidatures reçues
- Candidatures classées automatiquement par score de pertinence
- Score de matching pour chaque candidature reçue
- Téléchargement des CV et lecture des lettres de motivation
- Prise de décision sur chaque candidature (accepter / refuser)

### 🤖 Système de Matching Intelligent
- Extraction automatique des données des CVs PDF :
    -  Compétences techniques et soft skills
    -  Expériences professionnelles (postes, descriptions, durées)
    -  Formations et diplômes
    -  Informations de contact
- Analyse des offres d'emploi pour identifier les compétences recherchées
- Calcul de scores de compatibilité basé sur :
    - Analyse sémantique TF-IDF
    - Correspondance des compétences
    - Adéquation expérience/poste 
---

## 🧱 Technologies utilisées

### 🔧 Backend
- **Java 17**
- **Spring Boot**
- **Spring Security**
- **JPA/Hibernate**
- **MySQL**
- **JWT** (JSON Web Token)

### 🎨 Frontend
- **React JS**
- **Bootstrap**
- **Axios**

### 🧠 Module de Matching (Python)
- **Python 3.x**
- **spaCy (traitement du langage naturel)**
- **scikit-learn (TF-IDF, cosine similarity)**
- **PyPDF2 (extraction de texte PDF)**
- **pandas (manipulation de données)**
- **REST API d'intégration avec Spring Boot**

---

## 🔄 Flux de fonctionnement du matching
1- **Dépôt de CV :** Le candidat téléverse son CV PDF
2- **Extraction automatique :** Le système extrait les données pertinentes
3- **Analyse des offres :** Identification des compétences requises
4- **Calcul de compatibilité :** Score entre 0 et 1 pour chaque paire CV-offre
4- **Classement intelligent :** Affichage des résultats triés par pertinence

## ✅ Statut
Le projet est en phase finale de développement. Le système de matching est fonctionnel et testé, l'intégration avec la plateforme est en cours.

## 🙋‍♀️ Auteure
Zeineb Ben Jeddou – Étudiante en Génie Logiciel

Contact : zeinebbenjeddou01@gmail.com
