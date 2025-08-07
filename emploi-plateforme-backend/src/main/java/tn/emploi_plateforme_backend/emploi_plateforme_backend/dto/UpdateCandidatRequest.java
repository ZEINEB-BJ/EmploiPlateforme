package tn.emploi_plateforme_backend.emploi_plateforme_backend.dto;


import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.hibernate.annotations.processing.Pattern;

public class UpdateCandidatRequest {
    @NotBlank(message = "Le nom est requis")
    @Size(min = 3, max = 50, message = "Le nom doit contenir entre 3 et 50 caractères")
    private String nom;

    @NotBlank(message = "Le prénom est requis")
    @Size(min = 3, max = 50, message = "Le prénom doit contenir entre 3 et 50 caractères")
    private String prenom;

    @NotBlank(message = "L'email est requis")
    @Email(message = "Format d'email invalide")
    private String email;

    @NotBlank(message = "Le CIN est requis")
    //@Pattern(regexp = "^\\d{8}$", message = "Le CIN doit contenir exactement 8 chiffres")
    private String cin;

    @Size(min = 3, max = 100, message = "La fonction doit contenir entre 3 et 100 caractères")
    private String fonctionActuelle;


    @Size(min = 6, message = "Le mot de passe doit contenir au moins 6 caractères")
    private String nouveauMotDePasse;


    public String getNom() { return nom; }
    public void setNom(String nom) { this.nom = nom; }

    public String getPrenom() { return prenom; }
    public void setPrenom(String prenom) { this.prenom = prenom; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getCin() { return cin; }
    public void setCin(String cin) { this.cin = cin; }

    public String getFonctionActuelle() { return fonctionActuelle; }
    public void setFonctionActuelle(String fonctionActuelle) { this.fonctionActuelle = fonctionActuelle; }

    public String getNouveauMotDePasse() { return nouveauMotDePasse; }
    public void setNouveauMotDePasse(String nouveauMotDePasse) { this.nouveauMotDePasse = nouveauMotDePasse; }
}
