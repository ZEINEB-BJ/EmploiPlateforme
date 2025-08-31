package tn.emploi_plateforme_backend.emploi_plateforme_backend.service;

import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.*;
import java.nio.file.Paths;
import java.io.File;
import java.io.IOException;

import com.fasterxml.jackson.annotation.JsonProperty;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;

@Service
public class MatchingService {

    private final RestTemplate restTemplate = new RestTemplate();
    private final String matchingUrl = "http://localhost:5000/match";

    public Double calculateMatchingScore(String cvPathRelative, String offreText) {
        try {

            String cvPath = Paths.get(cvPathRelative).toAbsolutePath().toString();
            System.out.println("Chemin absolu du CV: " + cvPath);


            String cvText = extractTextFromPdf(cvPath);


            MatchRequest request = new MatchRequest(cvText, offreText);
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<MatchRequest> entity = new HttpEntity<>(request, headers);


            ResponseEntity<MatchResponse> response = restTemplate.postForEntity(
                    matchingUrl,
                    entity,
                    MatchResponse.class
            );

            return response.getBody() != null ? response.getBody().getScore() : 0.0;

        } catch (Exception e) {
            System.err.println("Erreur lors du calcul du matching: " + e.getMessage());
            return 0.0;
        }
    }


    private String extractTextFromPdf(String filePath) throws IOException {
        try (PDDocument document = PDDocument.load(new File(filePath))) {
            PDFTextStripper stripper = new PDFTextStripper();
            return stripper.getText(document);
        }
    }


    public static class MatchRequest {
        @JsonProperty("cv_text")
        private String cvText;

        @JsonProperty("offre_text")
        private String offreText;

        public MatchRequest(String cvText, String offreText) {
            this.cvText = cvText;
            this.offreText = offreText;
        }

        public String getCvText() { return cvText; }
        public String getOffreText() { return offreText; }
    }


    public static class MatchResponse {
        private Double score;

        public Double getScore() { return score; }
        public void setScore(Double score) { this.score = score; }
    }
}
