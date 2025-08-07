package tn.emploi_plateforme_backend.emploi_plateforme_backend.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import tn.emploi_plateforme_backend.emploi_plateforme_backend.entity.*;
import tn.emploi_plateforme_backend.emploi_plateforme_backend.repository.UtilisateurRepository;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;

@Service
public class ProfileService {

    @Autowired
    private UtilisateurRepository utilisateurRepository;

    private final String uploadDir = "uploads/cv/";

    public ProfileService() {

        try {
            Files.createDirectories(Paths.get(uploadDir));
        } catch (IOException e) {
            throw new RuntimeException("Could not create upload directory!", e);
        }
    }

    public Utilisateur getCurrentProfile(String email) {
        return utilisateurRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));
    }

    public Utilisateur updateCandidatProfile(String email, Candidat updatedProfile) {
        Utilisateur utilisateur = utilisateurRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

        if (!(utilisateur instanceof Candidat)) {
            throw new RuntimeException("Seuls les candidats peuvent mettre à jour ce profil");
        }

        Candidat candidat = (Candidat) utilisateur;
        candidat.setPrenom(updatedProfile.getPrenom());
        candidat.setNom(updatedProfile.getNom());
        candidat.setCin(updatedProfile.getCin());
        candidat.setFonctionActuelle(updatedProfile.getFonctionActuelle());

        return utilisateurRepository.save(candidat);
    }

    public Utilisateur updateEmployeurProfile(String email, Employeur updatedProfile) {
        Utilisateur utilisateur = utilisateurRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

        if (!(utilisateur instanceof Employeur)) {
            throw new RuntimeException("Seuls les employeurs peuvent mettre à jour ce profil");
        }

        Employeur employeur = (Employeur) utilisateur;
        employeur.setPrenom(updatedProfile.getPrenom());
        employeur.setNom(updatedProfile.getNom());
        employeur.setNomEntreprise(updatedProfile.getNomEntreprise());
        employeur.setMatriculeFiscale(updatedProfile.getMatriculeFiscale());
        employeur.setSecteurActivite(updatedProfile.getSecteurActivite());

        return utilisateurRepository.save(employeur);
    }

    public String uploadCV(String email, MultipartFile file) throws IOException {
        Utilisateur utilisateur = utilisateurRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

        if (!(utilisateur instanceof Candidat)) {
            throw new RuntimeException("Seuls les candidats peuvent uploader un CV");
        }


        String contentType = file.getContentType();
        if (contentType == null || (!contentType.equals("application/pdf") &&
                !contentType.equals("application/msword") &&
                !contentType.equals("application/vnd.openxmlformats-officedocument.wordprocessingml.document"))) {
            throw new RuntimeException("Seuls les fichiers PDF, DOC et DOCX sont acceptés");
        }


        String fileName = utilisateur.getId() + "_" + System.currentTimeMillis() + "_" + file.getOriginalFilename();
        Path targetLocation = Paths.get(uploadDir + fileName);


        Candidat candidat = (Candidat) utilisateur;
        if (candidat.getCvPath() != null) {
            try {
                Files.deleteIfExists(Paths.get(candidat.getCvPath()));
            } catch (IOException e) {

                System.err.println("Erreur lors de la suppression de l'ancien CV: " + e.getMessage());
            }
        }


        Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);


        candidat.setCvPath(targetLocation.toString());
        utilisateurRepository.save(candidat);

        return "CV uploadé avec succès";
    }

    public void deleteCV(String email) throws IOException {
        Utilisateur utilisateur = utilisateurRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

        if (!(utilisateur instanceof Candidat)) {
            throw new RuntimeException("Seuls les candidats peuvent supprimer un CV");
        }

        Candidat candidat = (Candidat) utilisateur;
        if (candidat.getCvPath() != null) {
            Files.deleteIfExists(Paths.get(candidat.getCvPath()));
            candidat.setCvPath(null);
            utilisateurRepository.save(candidat);
        }
    }

    public Resource downloadCV(String email) throws MalformedURLException {
        Utilisateur utilisateur = utilisateurRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

        if (!(utilisateur instanceof Candidat)) {
            throw new RuntimeException("Seuls les candidats ont un CV");
        }

        Candidat candidat = (Candidat) utilisateur;
        if (candidat.getCvPath() == null) {
            throw new RuntimeException("Aucun CV trouvé");
        }

        Path filePath = Paths.get(candidat.getCvPath());
        Resource resource = new UrlResource(filePath.toUri());

        if (resource.exists() && resource.isReadable()) {
            return resource;
        } else {
            throw new RuntimeException("CV non trouvé ou non lisible");
        }
    }


    public Resource downloadCandidateCV(Long candidatId, String employeurEmail) throws MalformedURLException {

        Utilisateur employeurUser = utilisateurRepository.findByEmail(employeurEmail)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

        if (!(employeurUser instanceof Employeur)) {
            throw new RuntimeException("Seuls les employeurs peuvent accéder aux CV des candidats");
        }


        Utilisateur candidatUser = utilisateurRepository.findById(candidatId)
                .orElseThrow(() -> new RuntimeException("Candidat non trouvé"));

        if (!(candidatUser instanceof Candidat)) {
            throw new RuntimeException("L'utilisateur spécifié n'est pas un candidat");
        }

        Candidat candidat = (Candidat) candidatUser;
        if (candidat.getCvPath() == null) {
            throw new RuntimeException("Ce candidat n'a pas de CV");
        }

        Path filePath = Paths.get(candidat.getCvPath());
        Resource resource = new UrlResource(filePath.toUri());

        if (resource.exists() && resource.isReadable()) {
            return resource;
        } else {
            throw new RuntimeException("CV non trouvé ou non lisible");
        }
    }

    public String getCVFileName(String cvPath) {
        if (cvPath == null) return null;
        Path path = Paths.get(cvPath);
        return path.getFileName().toString();
    }
}