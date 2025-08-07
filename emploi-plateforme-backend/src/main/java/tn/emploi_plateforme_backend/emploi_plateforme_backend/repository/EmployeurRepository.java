package tn.emploi_plateforme_backend.emploi_plateforme_backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import tn.emploi_plateforme_backend.emploi_plateforme_backend.entity.Employeur;

import java.util.Optional;

@Repository
public interface EmployeurRepository extends JpaRepository<Employeur, Long> {
    boolean existsByMatriculeFiscale(String matriculeFiscale);

    Optional<Object> findByMatriculeFiscale(String matriculeFiscale);
}