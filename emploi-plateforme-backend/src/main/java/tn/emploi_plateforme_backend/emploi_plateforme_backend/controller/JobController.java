package tn.emploi_plateforme_backend.emploi_plateforme_backend.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import tn.emploi_plateforme_backend.emploi_plateforme_backend.dto.JobRequest;
import tn.emploi_plateforme_backend.emploi_plateforme_backend.entity.Offre;
import tn.emploi_plateforme_backend.emploi_plateforme_backend.service.JobService;

import java.util.List;

@RestController
@RequestMapping("/api/jobs")
@CrossOrigin(origins = "http://localhost:3000")
public class JobController {

    @Autowired
    private JobService jobService;


    @GetMapping
    public ResponseEntity<?> getJobs(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String title,
            @RequestParam(required = false) String location
    ) {
        Page<Offre> jobs = jobService.getJobs(page, size, title, location);
        return ResponseEntity.ok(jobs);
    }

    @GetMapping("/active")
    public ResponseEntity<List<Offre>> getAllActiveJobs() {
        List<Offre> offres = jobService.getAllActiveJobs();
        return ResponseEntity.ok(offres);
    }



    @GetMapping("/{id}")
    public ResponseEntity<Offre> getJobById(@PathVariable Long id) {
        try {
            Offre job = jobService.getJobById(id);
            return ResponseEntity.ok(job);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping
    public ResponseEntity<Offre> createJob(@RequestBody JobRequest request, Authentication auth) {
        try {
            String email = auth.getName();
            Offre job = jobService.createJob(request, email);
            return ResponseEntity.ok(job);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<Offre> updateJob(@PathVariable Long id, @RequestBody JobRequest request, Authentication auth) {
        try {
            String email = auth.getName();
            Offre job = jobService.updateJob(id, request, email);
            return ResponseEntity.ok(job);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteJob(@PathVariable Long id, Authentication auth) {
        try {
            String email = auth.getName();
            jobService.deleteJob(id, email);
            return ResponseEntity.ok().build();
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/employer")
    public ResponseEntity<List<Offre>> getEmployerJobs(Authentication auth) {
        try {
            String email = auth.getName();
            List<Offre> jobs = jobService.getEmployerJobs(email);
            return ResponseEntity.ok(jobs);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }
}
