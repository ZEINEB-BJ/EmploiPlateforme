package tn.emploi_plateforme_backend.emploi_plateforme_backend.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import tn.emploi_plateforme_backend.emploi_plateforme_backend.dto.JobRequest;
import tn.emploi_plateforme_backend.emploi_plateforme_backend.dto.OffreRecommandationDTO;
import tn.emploi_plateforme_backend.emploi_plateforme_backend.entity.Candidat;
import tn.emploi_plateforme_backend.emploi_plateforme_backend.entity.Offre;
import tn.emploi_plateforme_backend.emploi_plateforme_backend.entity.StatutOffre;
import tn.emploi_plateforme_backend.emploi_plateforme_backend.repository.CandidatRepository;
import tn.emploi_plateforme_backend.emploi_plateforme_backend.repository.OffreRepository;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class RecommandationService {

    @Autowired
    private OffreRepository offreRepository;

    @Autowired
    private CandidatRepository candidatRepository;

    @Autowired
    private MatchingService matchingService;

    public List<OffreRecommandationDTO> getRecommendedOffersForCandidat(Long candidatId) {
        Optional<Candidat> candidatOpt = candidatRepository.findById(candidatId);
        if (!candidatOpt.isPresent()) {
            throw new RuntimeException("Candidat non trouvé avec l'ID: " + candidatId);
        }

        Candidat candidat = candidatOpt.get();


        if (candidat.getCvPath() == null || candidat.getCvPath().isEmpty()) {
            return Collections.emptyList();
        }


        List<Offre> offresActives = offreRepository.findByEtat(StatutOffre.ACTIVE);
        List<OffreRecommandationDTO> recommandations = new ArrayList<>();

        for (Offre offre : offresActives) {
            try {
                String offreText = offre.getTitre() + " " + offre.getDescription();
                Double score = matchingService.calculateMatchingScore(candidat.getCvPath(), offreText);

                OffreRecommandationDTO dto = new OffreRecommandationDTO();
                dto.setOffre(convertOffreToDTO(offre));
                dto.setScore(score);
                recommandations.add(dto);
            } catch (Exception e) {
                System.err.println("Erreur lors du calcul du score pour l'offre " + offre.getIdOffre() + ": " + e.getMessage());
            }
        }


        return recommandations.stream()
                .sorted((a, b) -> Double.compare(b.getScore(), a.getScore()))
                .limit(10)
                .collect(Collectors.toList());
    }

    private JobRequest convertOffreToDTO(Offre offre) {
        JobRequest dto = new JobRequest();
        dto.setIdOffre(offre.getIdOffre());
        dto.setTitre(offre.getTitre());
        dto.setDescription(offre.getDescription());
        dto.setLocalisation(offre.getLocalisation());
        dto.setDatePublication(offre.getDatePublication());
        dto.setDateExpiration(offre.getDateExpiration());
        dto.setEtat(offre.getEtat());

        if (offre.getEmployeur() != null) {
            dto.setEmployeurNom(offre.getEmployeur().getNomEntreprise());
            dto.setEmployeurId(offre.getEmployeur().getId());
        }

        return dto;
    }
}