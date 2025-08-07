package tn.emploi_plateforme_backend.emploi_plateforme_backend.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;

import java.util.List;

@Entity
public class Employeur extends Utilisateur {
    @Column(nullable = false)
    private String nomEntreprise;

    @Column(nullable = false)
    private String secteurActivite;

    @Column(nullable = false, unique = true)
    private String matriculeFiscale;

    @OneToMany(mappedBy = "employeur", cascade = CascadeType.ALL)
    @JsonIgnore
    private List<Offre> offres;


    public String getNomEntreprise() { return nomEntreprise; }
    public void setNomEntreprise(String nomEntreprise) { this.nomEntreprise = nomEntreprise; }

    public String getSecteurActivite() { return secteurActivite; }
    public void setSecteurActivite(String secteurActivite) { this.secteurActivite = secteurActivite; }

    public String getMatriculeFiscale() { return matriculeFiscale; }
    public void setMatriculeFiscale(String matriculeFiscale) { this.matriculeFiscale = matriculeFiscale; }

    public List<Offre> getOffres() { return offres; }
    public void setOffres(List<Offre> offres) { this.offres = offres; }
}
