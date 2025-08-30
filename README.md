# EmploiPlateforme

## 📌 Présentation

**EmploiPlateforme** est une application web de gestion des offres d’emploi avec **analyse intelligente de CVs**.  
Elle facilite le processus de recrutement entre **employeurs** et **candidats**, en digitalisant tout le cycle de recrutement et en intégrant un **module de matching automatique** basé sur l’IA.

---

## 🚀 Fonctionnalités principales

### 🔐 Authentification

- Inscription et connexion sécurisée avec JWT
- Gestion des rôles : `CANDIDAT` et `EMPLOYEUR`

### 👤 Candidat

- Création de profil avec téléversement de CV (PDF)
- Consultation des offres disponibles
- Postulation avec lettre de motivation
- Suivi des candidatures (en attente / acceptée / refusée)
- Recommandations personnalisées basées sur son CV

### 🏢 Employeur

- Création, modification et suppression d’offres
- Consultation et tri automatique des candidatures reçues
- Téléchargement des CVs et lecture des lettres de motivation
- Décision sur chaque candidature (accepter / refuser)
- Classement automatique par **score de pertinence** (matching Python)

### 🤖 Matching CV-Offre (IA)

- Extraction des compétences, expériences, formations et langues depuis les CVs PDF
- Analyse des offres d’emploi pour identifier les exigences
- Calcul d’un score de pertinence (TF-IDF / BERT / NLP)
- Tri automatique des candidatures

---

## 🧱 Technologies utilisées

### 🔧 Backend

- Java 17
- Spring Boot
- Spring Security (JWT)
- JPA / Hibernate
- MySQL

### 🎨 Frontend

- React.js
- Bootstrap
- Axios

### 🤖 Matching

- Python (Pandas, spaCy, Scikit-learn, TF-IDF/BERT)
- API REST intégrée à Spring Boot

---

## 📊 Cahier de charges

### Objectifs

- Digitaliser le processus de recrutement
- Automatiser l’analyse des CVs
- Faciliter la gestion des offres
- Offrir aux candidats des recommandations ciblées

### Utilisateurs

- **Employeurs** : publication et gestion des offres
- **Candidats** : postulation et suivi des candidatures

### Contraintes

- Respect de la confidentialité des données
- Compatibilité multi-plateformes (PC, tablette, mobile)

---

## 🗂️ Planification Agile (Sprints)

- **Sprint 1** : Authentification (1 semaine)
- **Sprint 2** : Gestion et consultation des offres (1 semaine)
- **Sprint 3** : Gestion des candidatures (1 semaine)
- **Sprint 4** : Développement du module de matching (2 semaines)
- **Sprint 5** : Intégration du matching à la plateforme (1 semaine)

---

## ⚙️ Installation & Lancement

### Backend (Spring Boot)

```bash
cd emploi-plateforme-backend
mvn spring-boot:run
```

### Frontend (React)

```bash
cd emploi-plateforme-frontend
npm install
npm start
```

### Matching (Python)

```bash
cd emploi-plateforme-matching
pip install -r requirements.txt
python app.py
```

## 👩‍💻 Auteure

Zeineb Ben Jeddou – Étudiante en Génie Logiciel
📧 Contact : zeinebbenjeddou01@gmail.com

```

```
