package tn.emploi_plateforme_backend.emploi_plateforme_backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import tn.emploi_plateforme_backend.emploi_plateforme_backend.entity.Candidat;

import java.util.Optional;

@Repository
public interface CandidatRepository extends JpaRepository<Candidat, Long> {
    boolean existsByCin(String cin);

    Optional<Object> findByCin(String cin);
}