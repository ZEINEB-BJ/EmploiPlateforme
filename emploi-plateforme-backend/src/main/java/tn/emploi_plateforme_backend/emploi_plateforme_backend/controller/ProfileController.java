package tn.emploi_plateforme_backend.emploi_plateforme_backend.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import tn.emploi_plateforme_backend.emploi_plateforme_backend.entity.Candidat;
import tn.emploi_plateforme_backend.emploi_plateforme_backend.entity.Employeur;
import tn.emploi_plateforme_backend.emploi_plateforme_backend.entity.Utilisateur;
import tn.emploi_plateforme_backend.emploi_plateforme_backend.service.ProfileService;

import java.io.IOException;
import java.net.MalformedURLException;

@RestController
@RequestMapping("/api/profile")
@CrossOrigin(origins = "http://localhost:3000")
public class ProfileController {

    @Autowired
    private ProfileService profileService;

    @GetMapping
    public ResponseEntity<Utilisateur> getCurrentProfile(Authentication auth) {
        try {
            String email = auth.getName();
            Utilisateur profile = profileService.getCurrentProfile(email);
            return ResponseEntity.ok(profile);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PutMapping("/candidat")
    public ResponseEntity<Utilisateur> updateCandidatProfile(@RequestBody Candidat profileData, Authentication auth) {
        try {
            String email = auth.getName();
            Utilisateur updatedProfile = profileService.updateCandidatProfile(email, profileData);
            return ResponseEntity.ok(updatedProfile);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PutMapping("/employeur")
    public ResponseEntity<Utilisateur> updateEmployeurProfile(@RequestBody Employeur profileData, Authentication auth) {
        try {
            String email = auth.getName();
            Utilisateur updatedProfile = profileService.updateEmployeurProfile(email, profileData);
            return ResponseEntity.ok(updatedProfile);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping("/cv/upload")
    public ResponseEntity<String> uploadCV(@RequestParam("cv") MultipartFile file, Authentication auth) {
        try {
            String email = auth.getName();
            String message = profileService.uploadCV(email, file);
            return ResponseEntity.ok(message);
        } catch (IOException e) {
            return ResponseEntity.badRequest().body("Erreur lors de l'upload: " + e.getMessage());
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @DeleteMapping("/cv")
    public ResponseEntity<String> deleteCV(Authentication auth) {
        try {
            String email = auth.getName();
            profileService.deleteCV(email);
            return ResponseEntity.ok("CV supprimé avec succès");
        } catch (IOException e) {
            return ResponseEntity.badRequest().body("Erreur lors de la suppression: " + e.getMessage());
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/cv/download")
    public ResponseEntity<Resource> downloadCV(Authentication auth) {
        try {
            String email = auth.getName();
            Resource resource = profileService.downloadCV(email);

            String filename = profileService.getCVFileName(
                    profileService.getCurrentProfile(email) instanceof Candidat ?
                            ((Candidat) profileService.getCurrentProfile(email)).getCvPath() : null
            );

            return ResponseEntity.ok()
                    .contentType(MediaType.APPLICATION_OCTET_STREAM)
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                    .body(resource);
        } catch (MalformedURLException e) {
            return ResponseEntity.badRequest().build();
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }


    @GetMapping("/cv/download/{candidatId}")
    public ResponseEntity<Resource> downloadCandidateCV(@PathVariable Long candidatId, Authentication auth) {
        try {
            String employeurEmail = auth.getName();
            Resource resource = profileService.downloadCandidateCV(candidatId, employeurEmail);


            String filename = "CV_candidat_" + candidatId + ".pdf";

            return ResponseEntity.ok()
                    .contentType(MediaType.APPLICATION_OCTET_STREAM)
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                    .body(resource);
        } catch (MalformedURLException e) {
            return ResponseEntity.notFound().build();
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }
}