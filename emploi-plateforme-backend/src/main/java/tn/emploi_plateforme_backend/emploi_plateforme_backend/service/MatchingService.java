package tn.emploi_plateforme_backend.emploi_plateforme_backend.service;

import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.*;
import java.nio.file.Paths;
import com.fasterxml.jackson.annotation.JsonProperty;

@Service
public class MatchingService {

    private final RestTemplate restTemplate = new RestTemplate();
    private final String matchingUrl = "http://localhost:5000/match";

    public Double calculateMatchingScore(String cvPathRelative, String offreText) {
        try {
            //chemin absolu du CV
            String cvPath = Paths.get(cvPathRelative).toAbsolutePath().toString();
            System.out.println("Chemin absolu du CV: " + cvPath);

            //requête vers service Python
            MatchRequest request = new MatchRequest(cvPath, offreText);
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<MatchRequest> entity = new HttpEntity<>(request, headers);

            ResponseEntity<MatchResponse> response = restTemplate.postForEntity(matchingUrl, entity, MatchResponse.class);

            return response.getBody() != null ? response.getBody().getScore() : 0.0;
        } catch (Exception e) {
            System.err.println("Erreur lors du calcul du matching: " + e.getMessage());
            return 0.0;
        }
    }


    public static class MatchRequest {
        @JsonProperty("cv_path")
        private String cvPath;

        @JsonProperty("offre_text")
        private String offreText;

        public MatchRequest(String cvPath, String offreText) {
            this.cvPath = cvPath;
            this.offreText = offreText;
        }

        public String getCvPath() { return cvPath; }
        public String getOffreText() { return offreText; }

        public void setCvPath(String cvPath) { this.cvPath = cvPath; }
        public void setOffreText(String offreText) { this.offreText = offreText; }
    }


    public static class MatchResponse {
        private Double score;

        public Double getScore() { return score; }
        public void setScore(Double score) { this.score = score; }
    }
}
