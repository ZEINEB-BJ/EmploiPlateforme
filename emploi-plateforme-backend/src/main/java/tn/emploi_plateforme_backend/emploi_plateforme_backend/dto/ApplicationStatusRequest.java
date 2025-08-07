package tn.emploi_plateforme_backend.emploi_plateforme_backend.dto;

import tn.emploi_plateforme_backend.emploi_plateforme_backend.entity.Decision;

public class ApplicationStatusRequest {
    private Decision status;

    public Decision getStatus() { return status; }
    public void setStatus(Decision status) { this.status = status; }
}