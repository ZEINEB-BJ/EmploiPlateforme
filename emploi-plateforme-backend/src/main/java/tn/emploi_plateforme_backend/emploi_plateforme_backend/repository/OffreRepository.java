package tn.emploi_plateforme_backend.emploi_plateforme_backend.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import tn.emploi_plateforme_backend.emploi_plateforme_backend.entity.Employeur;
import tn.emploi_plateforme_backend.emploi_plateforme_backend.entity.Offre;
import tn.emploi_plateforme_backend.emploi_plateforme_backend.entity.StatutOffre;

import org.springframework.data.domain.Pageable;

import java.util.List;

@Repository
public interface OffreRepository extends JpaRepository<Offre, Long> {
    List<Offre> findByEtat(StatutOffre etat);
    List<Offre> findByEmployeur(Employeur employeur);

    @Query("SELECT o FROM Offre o WHERE o.etat = 'ACTIVE' AND " +
            "(LOWER(o.titre) LIKE LOWER(CONCAT('%', :titre, '%')) OR :titre IS NULL) AND " +
            "(LOWER(o.localisation) LIKE LOWER(CONCAT('%', :localisation, '%')) OR :localisation IS NULL)")
    List<Offre> searchActiveJobs(@Param("titre") String titre, @Param("localisation") String localisation);

    Page<Offre> findByTitreContainingIgnoreCase(String titre, Pageable pageable);
    Page<Offre> findByLocalisationContainingIgnoreCase(String localisation, Pageable pageable);
    Page<Offre> findByTitreContainingIgnoreCaseAndLocalisationContainingIgnoreCase(String titre, String localisation, Pageable pageable);
    @Query("SELECT o FROM Offre o WHERE o.etat = 'ACTIVE' " +
            "AND (:titre IS NULL OR LOWER(o.titre) LIKE LOWER(CONCAT('%', :titre, '%'))) " +
            "AND (:localisation IS NULL OR LOWER(o.localisation) LIKE LOWER(CONCAT('%', :localisation, '%')))")
    Page<Offre> searchByTitreAndLocalisation(
            @Param("titre") String titre,
            @Param("localisation") String localisation,
            Pageable pageable);

    List<Offre> findByEtatOrderByDatePublicationDesc(StatutOffre etat);


}
