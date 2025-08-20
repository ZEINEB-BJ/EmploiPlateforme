import re

def extract_keywords_from_offer(offer_text: str) -> list[str]:
  
    keywords = set()
    text_lower = offer_text.lower()

    # mots-clés   rôles et domaines
    roles = [
        "développeur", "développeuse", "ingénieur", "ingénieure", "data scientist",
        "chef de projet", "lead développeur", "architecte logiciel", "devops",
        "administrateur système", "administrateur réseau", "consultant", "consultante",
        "analyste", "expert", "experte", "alternant", "stagiaire", "manager",
        "product owner", "scrum master", "qa", "testeur", "designer", "ux/ui"
    ]

    # Techn et langages de programmation
    tech_keywords = [
        "python", "java", "c#", "c++", "javascript", "typescript", "php", "ruby", "go", "swift", "kotlin",
        "scala", "rust", "html", "css", "sql", "nosql", "bash", "powershell",
        "react", "angular", "vue.js", "node.js", "django", "flask", "spring boot", "symfony", "laravel",
        "ruby on rails", "asp.net", ".net", "flutter", "react native", "android", "ios", "swiftui", "kotlin multiplatform",
        "docker", "kubernetes", "jenkins", "gitlab ci", "github actions", "aws", "azure", "gcp", "cloud",
        "linux", "windows server", "git", "svn", "jira", "confluence", "trello",
        "postgresql", "mysql", "mongodb", "redis", "oracle", "sql server", "cassandra", "elasticsearch",
        "kafka", "rabbitmq", "rest api", "graphql", "microservices", "agile", "scrum", "kanban",
        "machine learning", "deep learning", "ia", "intelligence artificielle", "data science", "big data",
        "nlp", "computer vision", "tensorflow", "pytorch", "scikit-learn", "pandas", "numpy", "spark", "hadoop",
        "tableau", "power bi", "excel", "blockchain", "cybersecurity", "sécurité informatique"
    ]

    # Outils et méthodologies
    methodology_keywords = [
        "agile", "scrum", "kanban", "devops", "ci/cd", "cloud computing", "saas", "paas", "iaas",
        "gestion de projet", "méthodologie", "intégration continue", "déploiement continu",
        "tdd", "bdd", "poo", "mvc", "mvvm"
    ]

    #soft skills
    soft_skills = [
        "communication", "autonomie", "esprit d'équipe", "résolution de problèmes", "rigueur",
        "curiosité", "adaptabilité", "proactif", "créativité", "leadership", "analyse",
        "esprit critique", "sens de l'organisation"
    ]

    
    all_keywords = roles + tech_keywords + methodology_keywords + soft_skills

    # recherche mots-clés exacts
    for keyword in all_keywords:
        if re.search(r'\b' + re.escape(keyword) + r'\b', text_lower):
            keywords.add(keyword.capitalize() if keyword not in ["c#", "c++"] else keyword) 

    # extraction de termes techniques 

    capitalized_words = re.findall(r'\b[A-Z][a-zA-Z0-9\-\.]+\b', offer_text)
    for word in capitalized_words:
     
        if len(word) > 2 and word.lower() not in ["cdi", "cdd", "e.g.", "i.e.", "sarl", "sas", "sasu", "inc", "ltd", "gmbh", "llc"]:
            keywords.add(word)

    
    return sorted(list(keywords))

def read_offer_content(offer_path: str) -> str:
    
    try:
        with open(offer_path, 'r', encoding='utf-8') as f:
            return f.read()
    except Exception as e:
        print(f"Erreur lors de la lecture de l'offre {offer_path}: {e}")
        return ""