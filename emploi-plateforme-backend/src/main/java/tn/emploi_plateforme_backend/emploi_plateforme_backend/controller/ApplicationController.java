package tn.emploi_plateforme_backend.emploi_plateforme_backend.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import tn.emploi_plateforme_backend.emploi_plateforme_backend.dto.ApplicationRequest;
import tn.emploi_plateforme_backend.emploi_plateforme_backend.dto.ApplicationStatusRequest;
import tn.emploi_plateforme_backend.emploi_plateforme_backend.entity.Candidature;
import tn.emploi_plateforme_backend.emploi_plateforme_backend.service.ApplicationService;

import java.util.List;
import java.util.HashMap;
import java.util.Map;
import java.util.stream.Collectors;


@RestController
@RequestMapping("/api/applications")
@CrossOrigin(origins = "http://localhost:3000")
public class ApplicationController {

    @Autowired
    private ApplicationService applicationService;

    @PostMapping
    public ResponseEntity<String> applyToJob(@RequestBody ApplicationRequest request, Authentication auth) {
        try {
            String email = auth.getName();
            applicationService.applyToJob(request.getJobId(), email, request.getLettreMotivation());
            return ResponseEntity.ok("Candidature envoyée avec succès");
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/candidate")
    public ResponseEntity<List<Candidature>> getCandidateApplications(Authentication auth) {
        try {
            String email = auth.getName();
            List<Candidature> applications = applicationService.getCandidateApplications(email);
            return ResponseEntity.ok(applications);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/job/{jobId}")
    public ResponseEntity<List<Candidature>> getJobApplications(@PathVariable Long jobId, Authentication auth) {
        try {
            String email = auth.getName();
            List<Candidature> applications = applicationService.getJobApplications(jobId, email);
            return ResponseEntity.ok(applications);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    // mise a jour statut candidature
    @PutMapping("/{id}/status")
    public ResponseEntity<Map<String, Object>> updateApplicationStatus(
            @PathVariable Long id,
            @RequestBody ApplicationStatusRequest request,
            Authentication auth) {
        try {
            String email = auth.getName();
            applicationService.updateApplicationStatus(id, request.getStatus(), email);


            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Statut de candidature mis à jour avec succès");
            response.put("applicationId", id);
            response.put("newStatus", request.getStatus().toString());

            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", e.getMessage());
            errorResponse.put("applicationId", id);

            return ResponseEntity.badRequest().body(errorResponse);
        }
    }


    @PutMapping("/{id}")
    public ResponseEntity<String> updateApplicationStatusLegacy(@PathVariable Long id,
                                                                @RequestBody ApplicationStatusRequest request,
                                                                Authentication auth) {
        try {
            String email = auth.getName();
            applicationService.updateApplicationStatus(id, request.getStatus(), email);
            return ResponseEntity.ok("Statut de candidature mis à jour");
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<Candidature> getApplicationById(@PathVariable Long id, Authentication auth) {
        try {
            String email = auth.getName();
            Candidature application = applicationService.getApplicationById(id, email);
            return ResponseEntity.ok(application);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/{id}/details")
    public ResponseEntity<Map<String, Object>> getApplicationDetails(@PathVariable Long id, Authentication auth) {
        try {
            String email = auth.getName();
            Candidature application = applicationService.getApplicationDetailsForEmployer(id, email);

            Map<String, Object> response = new HashMap<>();
            response.put("id", application.getId());
            response.put("datePostulation", application.getDatePostulation());
            response.put("etat", application.getEtat());
            response.put("decision", application.getDecision());
            response.put("lettreMotivation", application.getLettreMotivation());


            Map<String, Object> candidatInfo = new HashMap<>();
            candidatInfo.put("id", application.getCandidat().getId());
            candidatInfo.put("nom", application.getCandidat().getNom());
            candidatInfo.put("prenom", application.getCandidat().getPrenom());
            candidatInfo.put("email", application.getCandidat().getEmail());
            candidatInfo.put("cin", application.getCandidat().getCin());
            candidatInfo.put("fonctionActuelle", application.getCandidat().getFonctionActuelle());
            candidatInfo.put("hasCv", application.getCandidat().getCvPath() != null);
            response.put("candidat", candidatInfo);


            Map<String, Object> offreInfo = new HashMap<>();
            offreInfo.put("id", application.getOffre().getIdOffre());
            offreInfo.put("titre", application.getOffre().getTitre());
            offreInfo.put("localisation", application.getOffre().getLocalisation());
            response.put("offre", offreInfo);

            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/candidate/check/{jobId}")
    public ResponseEntity<Map<String, Boolean>> checkIfApplied(@PathVariable Long jobId, Authentication auth) {
        try {
            String email = auth.getName();
            List<Candidature> applications = applicationService.getCandidateApplications(email);
            boolean hasApplied = applications.stream()
                    .anyMatch(app -> app.getOffre().getIdOffre().equals(jobId));

            Map<String, Boolean> response = new HashMap<>();
            response.put("hasApplied", hasApplied);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<String> withdrawApplication(@PathVariable Long id, Authentication auth) {
        try {
            String email = auth.getName();
            applicationService.withdrawApplication(id, email);
            return ResponseEntity.ok("Candidature retirée avec succès");
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // endpoint : candidatures triées par score (employeur)
    @GetMapping("/job/{jobId}/sorted")
    public ResponseEntity<List<Map<String, Object>>> getCandidaturesSortedByScore(@PathVariable Long jobId) {
        List<Candidature> candidatures = applicationService.getCandidaturesByOffreOrderByScore(jobId);
        List<Map<String, Object>> result = candidatures.stream().map(c -> {
            Map<String, Object> dto = new HashMap<>();
            dto.put("id", c.getId());
            dto.put("datePostulation", c.getDatePostulation());
            dto.put("etat", c.getEtat());
            dto.put("matchingScore", c.getScore());
            dto.put("candidatNom", c.getCandidat().getNom());
            dto.put("candidatPrenom", c.getCandidat().getPrenom());
            dto.put("candidatEmail", c.getCandidat().getEmail());
            dto.put("lettreMotivation", c.getLettreMotivation());

            Map<String, Object> candidatInfo = new HashMap<>();
            candidatInfo.put("id", c.getCandidat().getId());
            candidatInfo.put("nom", c.getCandidat().getNom());
            candidatInfo.put("prenom", c.getCandidat().getPrenom());
            candidatInfo.put("email", c.getCandidat().getEmail());
            candidatInfo.put("cin", c.getCandidat().getCin());
            candidatInfo.put("fonctionActuelle", c.getCandidat().getFonctionActuelle());
            candidatInfo.put("cvPath", c.getCandidat().getCvPath());
            dto.put("candidat", candidatInfo);

            Map<String, Object> offreInfo = new HashMap<>();
            offreInfo.put("idOffre", c.getOffre().getIdOffre());
            offreInfo.put("titre", c.getOffre().getTitre());
            offreInfo.put("localisation", c.getOffre().getLocalisation());
            dto.put("offre", offreInfo);

            return dto;
        }).collect(Collectors.toList());
        return ResponseEntity.ok(result);
    }

    // endpoint : recalcul de tous les scores
    @PostMapping("/recalculate-scores")
    public ResponseEntity<String> recalculateScores() {
        applicationService.recalculateAllScores();
        return ResponseEntity.ok("Scores recalculés avec succès");
    }


}