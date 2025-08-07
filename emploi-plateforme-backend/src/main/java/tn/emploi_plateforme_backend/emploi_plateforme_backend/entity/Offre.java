package tn.emploi_plateforme_backend.emploi_plateforme_backend.entity;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.util.List;
import com.fasterxml.jackson.annotation.JsonIgnore;
import tn.emploi_plateforme_backend.emploi_plateforme_backend.entity.Employeur;

@Entity
public class Offre {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idOffre;

    @Column(nullable = false)
    private String titre;

    @Column(length = 2000)
    private String description;

    @Column(nullable = false)
    private LocalDate datePublication;

    @Column(nullable = false)
    private LocalDate dateExpiration;

    @Column(nullable = false)
    private String localisation;

    @Enumerated(EnumType.STRING)
    private StatutOffre etat;

    @ManyToOne
    @JoinColumn(name = "employeur_id", nullable = false)
    private Employeur employeur;

    @OneToMany(mappedBy = "offre", cascade = CascadeType.ALL)
    @JsonIgnore
    private List<Candidature> candidatures;

    @PrePersist
    protected void onCreate() {
        datePublication = LocalDate.now();
        if (etat == null) {
            etat = StatutOffre.ACTIVE;
        }
    }


    public Long getIdOffre() { return idOffre; }
    public void setIdOffre(Long idOffre) { this.idOffre = idOffre; }

    public String getTitre() { return titre; }
    public void setTitre(String titre) { this.titre = titre; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public LocalDate getDatePublication() { return datePublication; }
    public void setDatePublication(LocalDate datePublication) { this.datePublication = datePublication; }

    public LocalDate getDateExpiration() { return dateExpiration; }
    public void setDateExpiration(LocalDate dateExpiration) { this.dateExpiration = dateExpiration; }

    public String getLocalisation() { return localisation; }
    public void setLocalisation(String localisation) { this.localisation = localisation; }

    public StatutOffre getEtat() { return etat; }
    public void setEtat(StatutOffre etat) { this.etat = etat; }

    public Employeur getEmployeur() { return employeur; }
    public void setEmployeur(Employeur employeur) { this.employeur = employeur; }

    public List<Candidature> getCandidatures() { return candidatures; }
    public void setCandidatures(List<Candidature> candidatures) { this.candidatures = candidatures; }


}