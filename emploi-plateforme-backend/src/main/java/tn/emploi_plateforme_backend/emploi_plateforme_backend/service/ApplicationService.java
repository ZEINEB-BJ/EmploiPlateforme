package tn.emploi_plateforme_backend.emploi_plateforme_backend.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import tn.emploi_plateforme_backend.emploi_plateforme_backend.entity.*;
import tn.emploi_plateforme_backend.emploi_plateforme_backend.repository.CandidatureRepository;
import tn.emploi_plateforme_backend.emploi_plateforme_backend.repository.OffreRepository;
import tn.emploi_plateforme_backend.emploi_plateforme_backend.repository.UtilisateurRepository;

import java.math.BigDecimal;
import java.util.List;

@Service
public class ApplicationService {

    @Autowired
    private CandidatureRepository candidatureRepository;

    @Autowired
    private UtilisateurRepository utilisateurRepository;

    @Autowired
    private OffreRepository offreRepository;

    @Autowired
    private MatchingService matchingService;


    public void applyToJob(Long jobId, String candidatEmail, String lettreMotivation) {
        Utilisateur utilisateur = utilisateurRepository.findByEmail(candidatEmail)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

        if (!(utilisateur instanceof Candidat)) {
            throw new RuntimeException("Seuls les candidats peuvent postuler");
        }

        Candidat candidat = (Candidat) utilisateur;

        Offre offre = offreRepository.findById(jobId)
                .orElseThrow(() -> new RuntimeException("Offre non trouvée"));

        if (offre.getEtat() != StatutOffre.ACTIVE) {
            throw new RuntimeException("Cette offre n'est plus active");
        }

        if (candidatureRepository.existsByCandidatAndOffre(candidat, offre)) {
            throw new RuntimeException("Vous avez déjà postulé à cette offre");
        }

        if (lettreMotivation == null || lettreMotivation.trim().isEmpty()) {
            throw new RuntimeException("La lettre de motivation est requise");
        }

        if (lettreMotivation.trim().length() < 50) {
            throw new RuntimeException("La lettre de motivation doit contenir au moins 50 caractères");
        }

        if (lettreMotivation.trim().length() > 2000) {
            throw new RuntimeException("La lettre de motivation ne peut pas dépasser 2000 caractères");
        }

        Candidature candidature = new Candidature();
        candidature.setCandidat(candidat);
        candidature.setOffre(offre);
        candidature.setEtat(StatutCandidature.EN_ATTENTE);
        candidature.setLettreMotivation(lettreMotivation.trim());

        // calcul score matching si le CV existe
        if (candidat.getCvPath() != null && !candidat.getCvPath().isEmpty()) {
            String offreText = offre.getTitre() + " " + offre.getDescription();
            Double score = matchingService.calculateMatchingScore(candidat.getCvPath(), offreText);
            candidature.setScore(BigDecimal.valueOf(score));

        }

        candidatureRepository.save(candidature);
    }


    public void applyToJob(Long jobId, String candidatEmail) {
        throw new RuntimeException("La lettre de motivation est désormais requise pour postuler");
    }


    public List<Candidature> getCandidateApplications(String candidatEmail) {
        Utilisateur utilisateur = utilisateurRepository.findByEmail(candidatEmail)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

        if (!(utilisateur instanceof Candidat)) {
            throw new RuntimeException("Seuls les candidats peuvent accéder à cette ressource");
        }

        Candidat candidat = (Candidat) utilisateur;
        return candidatureRepository.findByCandidat(candidat);
    }

    public List<Candidature> getJobApplications(Long jobId, String employeurEmail) {
        Utilisateur utilisateur = utilisateurRepository.findByEmail(employeurEmail)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

        if (!(utilisateur instanceof Employeur)) {
            throw new RuntimeException("Seuls les employeurs peuvent accéder à cette ressource");
        }

        Offre offre = offreRepository.findById(jobId)
                .orElseThrow(() -> new RuntimeException("Offre non trouvée"));

        Employeur employeur = (Employeur) utilisateur;

        if (!offre.getEmployeur().getId().equals(employeur.getId())) {
            throw new RuntimeException("Vous ne pouvez voir que les candidatures de vos propres offres");
        }

        return candidatureRepository.findByOffre(offre);
    }

    // récupérer candidatures triées par score
    public List<Candidature> getCandidaturesByOffreOrderByScore(Long offreId) {
        return candidatureRepository.findByOffreIdOffreOrderByScoreDesc(offreId);
    }


    public void updateApplicationStatus(Long applicationId, Decision decision, String employeurEmail) {
        Candidature candidature = candidatureRepository.findById(applicationId)
                .orElseThrow(() -> new RuntimeException("Candidature non trouvée"));

        Utilisateur utilisateur = utilisateurRepository.findByEmail(employeurEmail)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

        if (!(utilisateur instanceof Employeur)) {
            throw new RuntimeException("Seuls les employeurs peuvent modifier le statut des candidatures");
        }

        Employeur employeur = (Employeur) utilisateur;

        if (!candidature.getOffre().getEmployeur().getId().equals(employeur.getId())) {
            throw new RuntimeException("Vous ne pouvez modifier que les candidatures de vos propres offres");
        }

        if (candidature.getEtat() != StatutCandidature.EN_ATTENTE) {
            throw new RuntimeException("Cette candidature a déjà été traitée");
        }

        candidature.setDecision(decision);

        switch (decision) {
            case ACCEPTEE:
                candidature.setEtat(StatutCandidature.ACCEPTEE);
                break;
            case REFUSEE:
                candidature.setEtat(StatutCandidature.REFUSEE);
                break;
            default:
                candidature.setEtat(StatutCandidature.EN_ATTENTE);
                break;
        }

        candidatureRepository.save(candidature);
    }

    public Candidature getApplicationById(Long applicationId, String userEmail) {
        Candidature candidature = candidatureRepository.findById(applicationId)
                .orElseThrow(() -> new RuntimeException("Candidature non trouvée"));

        Utilisateur utilisateur = utilisateurRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

        if (utilisateur instanceof Candidat) {
            Candidat candidat = (Candidat) utilisateur;
            if (!candidature.getCandidat().getId().equals(candidat.getId())) {
                throw new RuntimeException("Vous ne pouvez voir que vos propres candidatures");
            }
        } else if (utilisateur instanceof Employeur) {
            Employeur employeur = (Employeur) utilisateur;
            if (!candidature.getOffre().getEmployeur().getId().equals(employeur.getId())) {
                throw new RuntimeException("Vous ne pouvez voir que les candidatures de vos offres");
            }
        } else {
            throw new RuntimeException("Accès non autorisé");
        }

        return candidature;
    }

    public Candidature getApplicationDetailsForEmployer(Long applicationId, String employeurEmail) {
        Candidature candidature = candidatureRepository.findById(applicationId)
                .orElseThrow(() -> new RuntimeException("Candidature non trouvée"));

        Utilisateur utilisateur = utilisateurRepository.findByEmail(employeurEmail)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

        if (!(utilisateur instanceof Employeur)) {
            throw new RuntimeException("Seuls les employeurs peuvent accéder à cette ressource");
        }

        Employeur employeur = (Employeur) utilisateur;

        if (!candidature.getOffre().getEmployeur().getId().equals(employeur.getId())) {
            throw new RuntimeException("Vous ne pouvez voir que les candidatures de vos offres");
        }

        return candidature;
    }


    public void withdrawApplication(Long applicationId, String candidatEmail) {
        Candidature candidature = candidatureRepository.findById(applicationId)
                .orElseThrow(() -> new RuntimeException("Candidature non trouvée"));

        Utilisateur utilisateur = utilisateurRepository.findByEmail(candidatEmail)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

        if (!(utilisateur instanceof Candidat)) {
            throw new RuntimeException("Seuls les candidats peuvent retirer leurs candidatures");
        }

        Candidat candidat = (Candidat) utilisateur;

        if (!candidature.getCandidat().getId().equals(candidat.getId())) {
            throw new RuntimeException("Vous ne pouvez retirer que vos propres candidatures");
        }

        if (candidature.getEtat() != StatutCandidature.EN_ATTENTE) {
            throw new RuntimeException("Vous ne pouvez retirer que les candidatures en attente");
        }

        candidatureRepository.delete(candidature);
    }

    //recalcul score
    public void recalculateAllScores() {
        List<Candidature> candidatures = candidatureRepository.findAll();

        for (Candidature candidature : candidatures) {
            if (candidature.getCandidat().getCvPath() != null) {
                String offreText = candidature.getOffre().getTitre() + " " + candidature.getOffre().getDescription();
                Double score = matchingService.calculateMatchingScore(
                        candidature.getCandidat().getCvPath(),
                        offreText
                );
                candidature.setScore(BigDecimal.valueOf(score));

                candidatureRepository.save(candidature);
            }
        }
    }
}
