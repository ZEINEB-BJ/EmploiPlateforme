package tn.emploi_plateforme_backend.emploi_plateforme_backend.entity;

import com.fasterxml.jackson.annotation.*;
import jakarta.persistence.*;
import tn.emploi_plateforme_backend.emploi_plateforme_backend.entity.Candidature;

import java.time.LocalDateTime;
import java.util.List;


@Entity
public class Candidat extends Utilisateur {
    @Column(nullable = false, unique = true)
    private String cin;

    private String fonctionActuelle;

    @Column(length = 500)
    private String cvPath;

    @Column
    private LocalDateTime cvUploadDate;

    @OneToMany(mappedBy = "candidat", cascade = CascadeType.ALL)
    @JsonIgnore
    private List<Candidature> candidatures;


    public String getCin() { return cin; }
    public void setCin(String cin) { this.cin = cin; }

    public String getFonctionActuelle() { return fonctionActuelle; }
    public void setFonctionActuelle(String fonctionActuelle) { this.fonctionActuelle = fonctionActuelle; }

    public List<Candidature> getCandidatures() { return candidatures; }
    public void setCandidatures(List<Candidature> candidatures) { this.candidatures = candidatures; }

    public String getCvPath() {
        return cvPath;
    }

    public void setCvPath(String cvPath) {
        this.cvPath = cvPath;
    }

    public LocalDateTime getCvUploadDate() {
        return cvUploadDate;
    }

    public void setCvUploadDate(LocalDateTime cvUploadDate) {
        this.cvUploadDate = cvUploadDate;
    }
}