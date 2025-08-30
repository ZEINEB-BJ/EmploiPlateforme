package tn.emploi_plateforme_backend.emploi_plateforme_backend.entity;


import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
public class Candidature {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private LocalDateTime datePostulation;

    @Enumerated(EnumType.STRING)
    private StatutCandidature etat;

    @Enumerated(EnumType.STRING)
    private Decision decision;


    @Column(columnDefinition = "TEXT")
    private String lettreMotivation;

    @Column(precision = 5, scale = 4)
    private BigDecimal score = BigDecimal.ZERO;


    @ManyToOne
    @JoinColumn(name = "candidat_id", nullable = false)
    private Candidat candidat;

    @ManyToOne
    @JoinColumn(name = "offre_id", nullable = false)
    private Offre offre;



    @PrePersist
    protected void onCreate() {
        datePostulation = LocalDateTime.now();
        if (etat == null) {
            etat = StatutCandidature.EN_ATTENTE;
        }
    }




    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public LocalDateTime getDatePostulation() { return datePostulation; }
    public void setDatePostulation(LocalDateTime datePostulation) { this.datePostulation = datePostulation; }

    public StatutCandidature getEtat() { return etat; }
    public void setEtat(StatutCandidature etat) { this.etat = etat; }

    public Decision getDecision() { return decision; }
    public void setDecision(Decision decision) { this.decision = decision; }

    public Candidat getCandidat() { return candidat; }
    public void setCandidat(Candidat candidat) { this.candidat = candidat; }

    public Offre getOffre() { return offre; }
    public void setOffre(Offre offre) { this.offre = offre; }

    public String getLettreMotivation() {
        return lettreMotivation;
    }

    public void setLettreMotivation(String lettreMotivation) {
        this.lettreMotivation = lettreMotivation;
    }

    public BigDecimal getScore() {
        return score;
    }

    public void setScore(BigDecimal score) {
        this.score = score;
    }
}