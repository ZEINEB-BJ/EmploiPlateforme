package tn.emploi_plateforme_backend.emploi_plateforme_backend.controller;


import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import tn.emploi_plateforme_backend.emploi_plateforme_backend.dto.OffreRecommandationDTO;
import tn.emploi_plateforme_backend.emploi_plateforme_backend.service.RecommandationService;

import java.util.List;

@RestController
@RequestMapping("/api/recommandations")
@CrossOrigin(origins = "*")
public class RecommandationController {

    @Autowired
    private RecommandationService recommandationService;

    @GetMapping("/candidat/{candidatId}")
    public ResponseEntity<List<OffreRecommandationDTO>> getRecommendedOffers(@PathVariable Long candidatId) {
        try {
            List<OffreRecommandationDTO> recommandations = recommandationService.getRecommendedOffersForCandidat(candidatId);
            return ResponseEntity.ok(recommandations);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            System.err.println("Erreur lors de la récupération des recommandations: " + e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/candidat/{candidatId}/top/{limit}")
    public ResponseEntity<List<OffreRecommandationDTO>> getTopRecommendedOffers(
            @PathVariable Long candidatId,
            @PathVariable int limit) {
        try {
            List<OffreRecommandationDTO> recommandations = recommandationService.getRecommendedOffersForCandidat(candidatId);


            List<OffreRecommandationDTO> limitedRecommandations = recommandations.stream()
                    .limit(Math.max(1, Math.min(limit, 20)))
                    .collect(java.util.stream.Collectors.toList());

            return ResponseEntity.ok(limitedRecommandations);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            System.err.println("Erreur lors de la récupération des recommandations: " + e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }
}

