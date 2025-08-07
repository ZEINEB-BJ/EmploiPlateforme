package tn.emploi_plateforme_backend.emploi_plateforme_backend.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import tn.emploi_plateforme_backend.emploi_plateforme_backend.dto.AuthResponse;
import tn.emploi_plateforme_backend.emploi_plateforme_backend.dto.LoginRequest;
import tn.emploi_plateforme_backend.emploi_plateforme_backend.dto.RegisterRequest;
import tn.emploi_plateforme_backend.emploi_plateforme_backend.entity.PasswordResetToken;
import tn.emploi_plateforme_backend.emploi_plateforme_backend.entity.Utilisateur;
import tn.emploi_plateforme_backend.emploi_plateforme_backend.repository.PasswordResetTokenRepository;
import tn.emploi_plateforme_backend.emploi_plateforme_backend.repository.UtilisateurRepository;
import tn.emploi_plateforme_backend.emploi_plateforme_backend.service.AuthService;
import tn.emploi_plateforme_backend.emploi_plateforme_backend.service.EmailService;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "http://localhost:3000")
public class AuthController {

    private final AuthService authService;
    private final UtilisateurRepository utilisateurRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final EmailService emailService;
    private final PasswordEncoder passwordEncoder;

    public AuthController(AuthService authService,
                          UtilisateurRepository utilisateurRepository,
                          PasswordResetTokenRepository passwordResetTokenRepository,
                          EmailService emailService,
                          PasswordEncoder passwordEncoder) {
        this.authService = authService;
        this.utilisateurRepository = utilisateurRepository;
        this.passwordResetTokenRepository = passwordResetTokenRepository;
        this.emailService = emailService;
        this.passwordEncoder = passwordEncoder;
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest request) {
        try {
            authService.register(request);
            return ResponseEntity.ok(Collections.singletonMap("message", "Inscription réussie"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Collections.singletonMap("message", e.getMessage()));
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        try {
            AuthResponse response = authService.login(request);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Collections.singletonMap("message", e.getMessage()));
        }
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody Map<String, String> request) {
        String email = request.get("email");

        Utilisateur user = utilisateurRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Email non trouvé"));

        String token = UUID.randomUUID().toString();
        PasswordResetToken resetToken = new PasswordResetToken();
        resetToken.setEmail(email);
        resetToken.setToken(token);
        resetToken.setExpirationDate(LocalDateTime.now().plusMinutes(30));
        resetToken.setUsed(false);

        passwordResetTokenRepository.save(resetToken);

        String resetLink = "http://localhost:3000/reset-password?token=" + token;
        emailService.send(email, "Réinitialisation de mot de passe",
                "Bonjour " + user.getNom() + ",\n\n" +
                        "Veuillez cliquer sur le lien suivant pour réinitialiser votre mot de passe :\n" +
                        resetLink + "\n\n" +
                        "Ce lien expirera dans 30 minutes.");

        return ResponseEntity.ok("Email envoyé !");
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody Map<String, String> request) {
        String token = request.get("token");
        String newPassword = request.get("newPassword");

        PasswordResetToken resetToken = passwordResetTokenRepository.findByToken(token)
                .orElseThrow(() -> new RuntimeException("Token invalide"));

        if (resetToken.isUsed() || resetToken.getExpirationDate().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("Token expiré ou déjà utilisé");
        }

        Utilisateur user = utilisateurRepository.findByEmail(resetToken.getEmail())
                .orElseThrow(() -> new RuntimeException("Utilisateur introuvable"));

        user.setMotDePasse(passwordEncoder.encode(newPassword));
        utilisateurRepository.save(user);

        resetToken.setUsed(true);
        passwordResetTokenRepository.save(resetToken);

        return ResponseEntity.ok("Mot de passe réinitialisé !");
    }
}
