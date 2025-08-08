class ProfileCandidat:
    def __init__(self,nom="",competences=None,experiences=None,diplomes=None,langues=None):
        self.nom=nom or []
        self.competences=competences or []
        self.experiences=experiences or []
        self.diplomes=diplomes or []
        self.langues=langues or []

    def to_dict(self):
        return{
            "nom":self.nom,
            "competences":self.competences,
            "experiences":self.experiences,
            "diplomes":self.diplomes,
            "langues":self.langues
        }