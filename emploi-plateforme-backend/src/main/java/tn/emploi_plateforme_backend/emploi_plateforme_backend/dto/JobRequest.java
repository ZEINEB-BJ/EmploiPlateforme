package tn.emploi_plateforme_backend.emploi_plateforme_backend.dto;


import java.time.LocalDate;

public class JobRequest {
    private String titre;
    private String description;
    private String localisation;
    private LocalDate dateExpiration;


    public String getTitre() { return titre; }
    public void setTitre(String titre) { this.titre = titre; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getLocalisation() { return localisation; }
    public void setLocalisation(String localisation) { this.localisation = localisation; }

    public LocalDate getDateExpiration() { return dateExpiration; }
    public void setDateExpiration(LocalDate dateExpiration) { this.dateExpiration = dateExpiration; }
}