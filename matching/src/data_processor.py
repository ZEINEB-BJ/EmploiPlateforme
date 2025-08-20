import json

class ExperienceProfessionnelle:
    def __init__(self, titre_poste: str = None, entreprise: str = None, ville: str = None,
                 date_debut: str = None, date_fin: str = None, description: str = None):
        self.titre_poste = titre_poste
        self.entreprise = entreprise
        self.ville = ville
        self.date_debut = date_debut
        self.date_fin = date_fin
        self.description = description

    def to_dict(self):
        return self.__dict__

class Diplome:
    def __init__(self, titre_diplome: str = None, etablissement: str = None, ville: str = None,
                 date_obtention: str = None):
        self.titre_diplome = titre_diplome
        self.etablissement = etablissement
        self.ville = ville
        self.date_obtention = date_obtention

    def to_dict(self):
        return self.__dict__

class ProfilCandidat:
    def __init__(self, nom: str = None, email: str = None, telephone: str = None,
                 liens: list = None,
                 profil_resume: str = None,
                 competences: list = None,
                 experiences_pro: list[ExperienceProfessionnelle] = None,
                 diplomes: list[Diplome] = None,
                 langues: dict = None, 
                 projets: list = None,
                 raw_text: str = None):

        self.nom = nom
        self.email = email
        self.telephone = telephone
        self.liens = liens if liens is not None else []
        self.profil_resume = profil_resume
        self.competences = competences if competences is not None else []
        self.experiences_pro = experiences_pro if experiences_pro is not None else []
        self.diplomes = diplomes if diplomes is not None else []
        self.langues = langues if langues is not None else {}
        self.projets = projets if projets is not None else []
        self.raw_text = raw_text

    def to_dict(self):
       
        experiences_pro_dicts = [exp.to_dict() for exp in self.experiences_pro]
        diplomes_dicts = [diploma.to_dict() for diploma in self.diplomes]

        return {
            "nom": self.nom,
            "email": self.email,
            "telephone": self.telephone,
            "liens": self.liens,
            "profil_resume": self.profil_resume,
            "competences": self.competences,
            "experiences_pro": experiences_pro_dicts,
            "diplomes": diplomes_dicts,
            "langues": self.langues,
            "projets": self.projets,
            "raw_text": self.raw_text
        }

    def to_json(self, indent=2):
        return json.dumps(self.to_dict(), indent=indent, ensure_ascii=False)

    @classmethod
    def from_dict(cls, data: dict):
        experiences_pro = [ExperienceProfessionnelle(**exp_data) for exp_data in data.get("experiences_pro", [])]
        diplomes = [Diplome(**diploma_data) for diploma_data in data.get("diplomes", [])]

        return cls(
            nom=data.get("nom"),
            email=data.get("email"),
            telephone=data.get("telephone"),
            liens=data.get("liens"),
            profil_resume=data.get("profil_resume"),
            competences=data.get("competences"),
            experiences_pro=experiences_pro,
            diplomes=diplomes,
            langues=data.get("langues"),
            projets=data.get("projets"),
            raw_text=data.get("raw_text")
        )