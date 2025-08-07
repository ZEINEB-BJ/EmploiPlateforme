package tn.emploi_plateforme_backend.emploi_plateforme_backend.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import tn.emploi_plateforme_backend.emploi_plateforme_backend.dto.AuthResponse;
import tn.emploi_plateforme_backend.emploi_plateforme_backend.dto.LoginRequest;
import tn.emploi_plateforme_backend.emploi_plateforme_backend.dto.RegisterRequest;
import tn.emploi_plateforme_backend.emploi_plateforme_backend.entity.Candidat;
import tn.emploi_plateforme_backend.emploi_plateforme_backend.entity.Employeur;

import tn.emploi_plateforme_backend.emploi_plateforme_backend.entity.Role;
import tn.emploi_plateforme_backend.emploi_plateforme_backend.entity.Utilisateur;
import tn.emploi_plateforme_backend.emploi_plateforme_backend.repository.CandidatRepository;
import tn.emploi_plateforme_backend.emploi_plateforme_backend.repository.EmployeurRepository;
import tn.emploi_plateforme_backend.emploi_plateforme_backend.repository.UtilisateurRepository;

@Service
public class AuthService {

    @Autowired
    private UtilisateurRepository utilisateurRepository;

    @Autowired
    private EmployeurRepository employeurRepository;

    @Autowired
    private CandidatRepository candidatRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtService jwtService;

    public void register(RegisterRequest request) {

        if (utilisateurRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Un compte avec cet email existe déjà");
        }

        if (request.getRole() == Role.CANDIDAT) {
            if (candidatRepository.existsByCin(request.getCin())) {
                throw new RuntimeException("Un compte avec ce CIN existe déjà");
            }

            Candidat candidat = new Candidat();
            candidat.setNom(request.getNom());
            candidat.setPrenom(request.getPrenom());
            candidat.setEmail(request.getEmail());
            candidat.setMotDePasse(passwordEncoder.encode(request.getMotDePasse()));
            candidat.setRole(Role.CANDIDAT);
            candidat.setCin(request.getCin());
            candidat.setFonctionActuelle(request.getFonctionActuelle());

            candidatRepository.save(candidat);

        } else if (request.getRole() == Role.EMPLOYEUR) {
            if (employeurRepository.existsByMatriculeFiscale(request.getMatriculeFiscale())) {
                throw new RuntimeException("Un compte avec ce matricule fiscal existe déjà");
            }

            Employeur employeur = new Employeur();
            employeur.setNom(request.getNom());
            employeur.setPrenom(request.getPrenom());
            employeur.setEmail(request.getEmail());
            employeur.setMotDePasse(passwordEncoder.encode(request.getMotDePasse()));
            employeur.setRole(Role.EMPLOYEUR);
            employeur.setNomEntreprise(request.getNomEntreprise());
            employeur.setSecteurActivite(request.getSecteurActivite());
            employeur.setMatriculeFiscale(request.getMatriculeFiscale());

            employeurRepository.save(employeur);
        }
    }

    public AuthResponse login(LoginRequest request) {
        Utilisateur utilisateur = utilisateurRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

        if (!passwordEncoder.matches(request.getPassword(), utilisateur.getMotDePasse())) {
            throw new RuntimeException("Mot de passe incorrect");
        }

        String token = jwtService.generateToken(utilisateur);

        AuthResponse.UserInfo userInfo = new AuthResponse.UserInfo(
                utilisateur.getId(),
                utilisateur.getNom(),
                utilisateur.getPrenom(),
                utilisateur.getEmail(),
                utilisateur.getRole()
        );

        return new AuthResponse(token, userInfo);
    }
}