package tn.emploi_plateforme_backend.emploi_plateforme_backend.dto;

public class OffreRecommandationDTO {
    private JobRequest offre;
    private Double score;
    private String compatibiliteLevel;

    public OffreRecommandationDTO() {}

    public OffreRecommandationDTO(JobRequest offre, Double score) {
        this.offre = offre;
        this.score = score;
        this.compatibiliteLevel = determineCompatibilityLevel(score);
    }

    private String determineCompatibilityLevel(Double score) {
        if (score == null) return "UNKNOWN";
        if (score >= 0.7) return "HIGH";
        if (score >= 0.4) return "MEDIUM";
        return "LOW";
    }


    public JobRequest getOffre() {
        return offre;
    }

    public void setOffre(JobRequest offre) {
        this.offre = offre;

        if (this.score != null) {
            this.compatibiliteLevel = determineCompatibilityLevel(this.score);
        }
    }

    public Double getScore() {
        return score;
    }

    public void setScore(Double score) {
        this.score = score;
        this.compatibiliteLevel = determineCompatibilityLevel(score);
    }

    public String getCompatibiliteLevel() {
        return compatibiliteLevel;
    }

    public void setCompatibiliteLevel(String compatibiliteLevel) {
        this.compatibiliteLevel = compatibiliteLevel;
    }


    public Integer getScorePercentage() {
        if (score == null) return 0;
        return (int) Math.round(score * 100);
    }

    @Override
    public String toString() {
        return "OffreRecommandationDTO{" +
                "offre=" + (offre != null ? offre.getTitre() : "null") +
                ", score=" + score +
                ", compatibiliteLevel='" + compatibiliteLevel + '\'' +
                '}';
    }
}