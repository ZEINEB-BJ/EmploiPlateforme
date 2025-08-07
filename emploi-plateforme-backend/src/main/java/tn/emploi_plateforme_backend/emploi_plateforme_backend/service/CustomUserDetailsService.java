package tn.emploi_plateforme_backend.emploi_plateforme_backend.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import tn.emploi_plateforme_backend.emploi_plateforme_backend.entity.Utilisateur;
import tn.emploi_plateforme_backend.emploi_plateforme_backend.repository.UtilisateurRepository;

import java.util.ArrayList;

@Service
public class CustomUserDetailsService implements UserDetailsService {

    @Autowired
    private UtilisateurRepository utilisateurRepository;

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        Utilisateur utilisateur = utilisateurRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("Utilisateur non trouvé: " + email));

        return new User(utilisateur.getEmail(), utilisateur.getMotDePasse(), new ArrayList<>());
    }
}
