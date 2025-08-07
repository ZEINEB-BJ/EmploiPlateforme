package tn.emploi_plateforme_backend.emploi_plateforme_backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class UpdateEmployeurRequest {
    @NotBlank(message = "Le nom est requis")
    @Size(min = 3, max = 50, message = "Le nom doit contenir entre 3 et 50 caractères")
    private String nom;

    @NotBlank(message = "Le prénom est requis")
    @Size(min = 3, max = 50, message = "Le prénom doit contenir entre 3 et 50 caractères")
    private String prenom;

    @NotBlank(message = "L'email est requis")
    @Email(message = "Format d'email invalide")
    private String email;

    @NotBlank(message = "Le matricule fiscale est requis")
    private String matriculeFiscale;

    @NotBlank(message = "Le nom de l'entreprise est requis")
    @Size(min = 3, max = 100, message = "Le nom de l'entreprise doit contenir entre 3 et 100 caractères")
    private String nomEntreprise;

    @NotBlank(message = "Le secteur d'activité est requis")
    @Size(min = 3, max = 100, message = "Le secteur d'activité doit contenir entre 3 et 100 caractères")
    private String secteurActivite;


    @Size(min = 6, message = "Le mot de passe doit contenir au moins 6 caractères")
    private String nouveauMotDePasse;


    public String getNom() { return nom; }
    public void setNom(String nom) { this.nom = nom; }

    public String getPrenom() { return prenom; }
    public void setPrenom(String prenom) { this.prenom = prenom; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getMatriculeFiscale() { return matriculeFiscale; }
    public void setMatriculeFiscale(String matriculeFiscale) { this.matriculeFiscale = matriculeFiscale; }

    public String getNomEntreprise() { return nomEntreprise; }
    public void setNomEntreprise(String nomEntreprise) { this.nomEntreprise = nomEntreprise; }

    public String getSecteurActivite() { return secteurActivite; }
    public void setSecteurActivite(String secteurActivite) { this.secteurActivite = secteurActivite; }

    public String getNouveauMotDePasse() { return nouveauMotDePasse; }
    public void setNouveauMotDePasse(String nouveauMotDePasse) { this.nouveauMotDePasse = nouveauMotDePasse; }
}