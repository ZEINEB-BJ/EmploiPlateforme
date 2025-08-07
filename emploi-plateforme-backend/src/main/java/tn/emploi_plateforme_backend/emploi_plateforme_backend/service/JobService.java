package tn.emploi_plateforme_backend.emploi_plateforme_backend.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import tn.emploi_plateforme_backend.emploi_plateforme_backend.dto.JobRequest;
import tn.emploi_plateforme_backend.emploi_plateforme_backend.entity.Employeur;
import tn.emploi_plateforme_backend.emploi_plateforme_backend.entity.Offre;
import tn.emploi_plateforme_backend.emploi_plateforme_backend.entity.StatutOffre;
import tn.emploi_plateforme_backend.emploi_plateforme_backend.entity.Utilisateur;
import tn.emploi_plateforme_backend.emploi_plateforme_backend.repository.OffreRepository;
import tn.emploi_plateforme_backend.emploi_plateforme_backend.repository.UtilisateurRepository;

import java.time.LocalDate;
import java.util.List;

@Service
public class JobService {

    @Autowired
    private OffreRepository offreRepository;

    @Autowired
    private UtilisateurRepository utilisateurRepository;


    public List<Offre> getAllActiveJobs() {
        return offreRepository.findByEtatOrderByDatePublicationDesc(StatutOffre.ACTIVE);
    }

    public Page<Offre> getJobs(int page, int size, String titre, String localisation) {
        Pageable pageable = PageRequest.of(page, size);

        if (titre != null && titre.trim().isEmpty()) titre = null;
        if (localisation != null && localisation.trim().isEmpty()) localisation = null;

        return offreRepository.searchByTitreAndLocalisation(titre, localisation, pageable);
    }

    public Page<Offre> searchJobs(int page, int size, String titre, String localisation) {
        Pageable pageable = PageRequest.of(page, size);
        return offreRepository.searchByTitreAndLocalisation(titre, localisation, pageable);
    }

    public Offre getJobById(Long id) {
        return offreRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Offre non trouvée"));
    }

    public Offre createJob(JobRequest request, String employeurEmail) {
        Utilisateur utilisateur = utilisateurRepository.findByEmail(employeurEmail)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

        if (!(utilisateur instanceof Employeur)) {
            throw new RuntimeException("Seuls les employeurs peuvent créer des offres");
        }


        if (request.getDateExpiration() == null || !request.getDateExpiration().isAfter(LocalDate.now())) {
            throw new RuntimeException("La date d'expiration doit être postérieure à la date de publication (aujourd'hui)");
        }

        Employeur employeur = (Employeur) utilisateur;

        Offre offre = new Offre();
        offre.setTitre(request.getTitre());
        offre.setDescription(request.getDescription());
        offre.setLocalisation(request.getLocalisation());
        offre.setDateExpiration(request.getDateExpiration());
        offre.setEmployeur(employeur);
        offre.setEtat(StatutOffre.ACTIVE);

        return offreRepository.save(offre);
    }

    public Offre updateJob(Long id, JobRequest request, String employeurEmail) {
        Offre offre = getJobById(id);

        Utilisateur utilisateur = utilisateurRepository.findByEmail(employeurEmail)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

        if (!offre.getEmployeur().getId().equals(utilisateur.getId())) {
            throw new RuntimeException("Vous ne pouvez modifier que vos propres offres");
        }


        if (request.getDateExpiration() == null || !request.getDateExpiration().isAfter(LocalDate.now())) {
            throw new RuntimeException("La nouvelle date d'expiration doit être postérieure à aujourd'hui");
        }

        offre.setTitre(request.getTitre());
        offre.setDescription(request.getDescription());
        offre.setLocalisation(request.getLocalisation());
        offre.setDateExpiration(request.getDateExpiration());

        return offreRepository.save(offre);
    }

    public void deleteJob(Long id, String employeurEmail) {
        Offre offre = getJobById(id);

        Utilisateur utilisateur = utilisateurRepository.findByEmail(employeurEmail)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

        if (!offre.getEmployeur().getId().equals(utilisateur.getId())) {
            throw new RuntimeException("Vous ne pouvez supprimer que vos propres offres");
        }

        offreRepository.delete(offre);
    }

    public List<Offre> getEmployerJobs(String employeurEmail) {
        Utilisateur utilisateur = utilisateurRepository.findByEmail(employeurEmail)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

        if (!(utilisateur instanceof Employeur)) {
            throw new RuntimeException("Seuls les employeurs peuvent accéder à cette ressource");
        }

        Employeur employeur = (Employeur) utilisateur;
        return offreRepository.findByEmployeur(employeur);
    }
}
