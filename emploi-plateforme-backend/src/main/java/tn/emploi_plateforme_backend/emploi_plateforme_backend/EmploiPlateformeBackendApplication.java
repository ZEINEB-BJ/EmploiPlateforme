package tn.emploi_plateforme_backend.emploi_plateforme_backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.http.client.HttpClientAutoConfiguration;

@SpringBootApplication(exclude = {HttpClientAutoConfiguration.class})
public class EmploiPlateformeBackendApplication {

	public static void main(String[] args) {
		SpringApplication.run(EmploiPlateformeBackendApplication.class, args);
	}
}