package tn.emploi_plateforme_backend.emploi_plateforme_backend.dto;
public class ApplicationRequest {
    private Long jobId;
    private String lettreMotivation;

    public Long getJobId() { return jobId; }
    public void setJobId(Long jobId) { this.jobId = jobId; }

    public String getLettreMotivation() {
        return lettreMotivation;
    }

    public void setLettreMotivation(String lettreMotivation) {
        this.lettreMotivation = lettreMotivation;
    }
}