package tn.emploi_plateforme_backend.emploi_plateforme_backend.dto;


import tn.emploi_plateforme_backend.emploi_plateforme_backend.entity.StatutOffre;

import java.time.LocalDate;

public class JobRequest {
    private Long idOffre;
    private String titre;
    private String description;
    private LocalDate datePublication;
    private LocalDate dateExpiration;
    private String localisation;
    private StatutOffre etat;
    private Long employeurId;
    private String employeurNom;
    private String employeurSecteur;


    public String getTitre() { return titre; }
    public void setTitre(String titre) { this.titre = titre; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getLocalisation() { return localisation; }
    public void setLocalisation(String localisation) { this.localisation = localisation; }

    public LocalDate getDateExpiration() { return dateExpiration; }
    public void setDateExpiration(LocalDate dateExpiration) { this.dateExpiration = dateExpiration; }

    public Long getIdOffre() {
        return idOffre;
    }

    public void setIdOffre(Long idOffre) {
        this.idOffre = idOffre;
    }

    public LocalDate getDatePublication() {
        return datePublication;
    }

    public void setDatePublication(LocalDate datePublication) {
        this.datePublication = datePublication;
    }

    public StatutOffre getEtat() {
        return etat;
    }

    public void setEtat(StatutOffre etat) {
        this.etat = etat;
    }

    public Long getEmployeurId() {
        return employeurId;
    }

    public void setEmployeurId(Long employeurId) {
        this.employeurId = employeurId;
    }

    public String getEmployeurNom() {
        return employeurNom;
    }

    public void setEmployeurNom(String employeurNom) {
        this.employeurNom = employeurNom;
    }

    public String getEmployeurSecteur() {
        return employeurSecteur;
    }

    public void setEmployeurSecteur(String employeurSecteur) {
        this.employeurSecteur = employeurSecteur;
    }
}