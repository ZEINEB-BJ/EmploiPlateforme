package tn.emploi_plateforme_backend.emploi_plateforme_backend.dto;

import tn.emploi_plateforme_backend.emploi_plateforme_backend.entity.Role;

public class AuthResponse {
    private String token;
    private UserInfo user;

    public AuthResponse(String token, UserInfo user) {
        this.token = token;
        this.user = user;
    }


    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }

    public UserInfo getUser() { return user; }
    public void setUser(UserInfo user) { this.user = user; }

    public static class UserInfo {
        private Long id;
        private String nom;
        private String prenom;
        private String email;
        private Role role;

        public UserInfo(Long id, String nom, String prenom, String email, Role role) {
            this.id = id;
            this.nom = nom;
            this.prenom = prenom;
            this.email = email;
            this.role = role;
        }


        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }

        public String getNom() { return nom; }
        public void setNom(String nom) { this.nom = nom; }

        public String getPrenom() { return prenom; }
        public void setPrenom(String prenom) { this.prenom = prenom; }

        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }

        public Role getRole() { return role; }
        public void setRole(Role role) { this.role = role; }
    }
}