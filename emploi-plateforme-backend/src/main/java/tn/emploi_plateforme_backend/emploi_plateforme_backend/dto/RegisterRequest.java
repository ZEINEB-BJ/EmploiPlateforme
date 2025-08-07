package tn.emploi_plateforme_backend.emploi_plateforme_backend.dto;


import tn.emploi_plateforme_backend.emploi_plateforme_backend.entity.Role;

public class RegisterRequest {
    private String nom;
    private String prenom;
    private String email;
    private String motDePasse;
    private Role role;


    private String cin;
    private String fonctionActuelle;


    private String nomEntreprise;
    private String secteurActivite;
    private String matriculeFiscale;


    public String getNom() { return nom; }
    public void setNom(String nom) { this.nom = nom; }

    public String getPrenom() { return prenom; }
    public void setPrenom(String prenom) { this.prenom = prenom; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getMotDePasse() { return motDePasse; }
    public void setMotDePasse(String motDePasse) { this.motDePasse = motDePasse; }

    public Role getRole() { return role; }
    public void setRole(Role role) { this.role = role; }

    public String getCin() { return cin; }
    public void setCin(String cin) { this.cin = cin; }

    public String getFonctionActuelle() { return fonctionActuelle; }
    public void setFonctionActuelle(String fonctionActuelle) { this.fonctionActuelle = fonctionActuelle; }

    public String getNomEntreprise() { return nomEntreprise; }
    public void setNomEntreprise(String nomEntreprise) { this.nomEntreprise = nomEntreprise; }

    public String getSecteurActivite() { return secteurActivite; }
    public void setSecteurActivite(String secteurActivite) { this.secteurActivite = secteurActivite; }

    public String getMatriculeFiscale() { return matriculeFiscale; }
    public void setMatriculeFiscale(String matriculeFiscale) { this.matriculeFiscale = matriculeFiscale; }
}
