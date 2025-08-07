package tn.emploi_plateforme_backend.emploi_plateforme_backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import tn.emploi_plateforme_backend.emploi_plateforme_backend.entity.Candidat;
import tn.emploi_plateforme_backend.emploi_plateforme_backend.entity.Candidature;
import tn.emploi_plateforme_backend.emploi_plateforme_backend.entity.Offre;

import java.util.List;
import java.util.Optional;

@Repository
public interface CandidatureRepository extends JpaRepository<Candidature, Long> {
    List<Candidature> findByCandidat(Candidat candidat);
    List<Candidature> findByOffre(Offre offre);
    Optional<Candidature> findByCandidatAndOffre(Candidat candidat, Offre offre);
    boolean existsByCandidatAndOffre(Candidat candidat, Offre offre);
}