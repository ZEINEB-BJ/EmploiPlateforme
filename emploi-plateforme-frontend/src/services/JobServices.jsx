import axios from "axios";

const API_URL = "http://localhost:8081/api";

// intercepteur pour ajouter le token aux requêtes
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// intercepteur pour gérer les erreurs
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("Erreur API:", error.response?.data || error.message);
    return Promise.reject(error);
  }
);

const jobService = {
  getJobs: async (page = 0, size = 10, title = "", location = "") => {
    try {
      const response = await axios.get(`${API_URL}/jobs`, {
        params: {
          page,
          size,
          title,
          location,
        },
      });
      return response.data;
    } catch (error) {
      console.error("Erreur getJobs:", error);
      throw error;
    }
  },

  // récupérer  offre par ID
  getJobById: async (id) => {
    try {
      const response = await axios.get(`${API_URL}/jobs/${id}`);
      return response.data;
    } catch (error) {
      console.error("Erreur getJobById:", error);
      throw error;
    }
  },

  // créer une offre
  createJob: async (jobData) => {
    try {
      const response = await axios.post(`${API_URL}/jobs`, jobData);
      return response.data;
    } catch (error) {
      console.error("Erreur createJob:", error);
      throw error;
    }
  },

  // modifier une offre
  updateJob: async (id, jobData) => {
    try {
      const response = await axios.put(`${API_URL}/jobs/${id}`, jobData);
      return response.data;
    } catch (error) {
      console.error("Erreur updateJob:", error);
      throw error;
    }
  },

  // supprimer une offre
  deleteJob: async (id) => {
    try {
      const response = await axios.delete(`${API_URL}/jobs/${id}`);
      return response.data;
    } catch (error) {
      console.error("Erreur deleteJob:", error);
      throw error;
    }
  },

  // Offres d'un employeur
  getEmployerJobs: async () => {
    try {
      const response = await axios.get(`${API_URL}/jobs/employer`);
      return response.data;
    } catch (error) {
      console.error("Erreur getEmployerJobs:", error);
      throw error;
    }
  },

  // récupérer toutes les offres actives
  getAllActiveJobs: async () => {
    try {
      const response = await axios.get(`${API_URL}/jobs/active`);

      const sortedJobs = response.data.sort((a, b) => {
        return new Date(b.datePublication) - new Date(a.datePublication);
      });
      return sortedJobs;
    } catch (error) {
      try {
        const allJobs = await jobService.getJobs(0, 1000);
        const activeJobs =
          allJobs.content?.filter((job) => job.etat === "ACTIVE") || [];

        const sortedJobs = activeJobs.sort((a, b) => {
          return new Date(b.datePublication) - new Date(a.datePublication);
        });
        return sortedJobs;
      } catch (fallbackError) {
        console.error("Erreur getAllActiveJobs fallback:", fallbackError);
        throw fallbackError;
      }
    }
  },

  // postuler + lettre de motivation
  applyToJobWithMotivation: async (jobId, motivationLetter) => {
    try {
      const response = await axios.post(`${API_URL}/applications`, {
        jobId: jobId,
        lettreMotivation: motivationLetter,
        datePostulation: new Date().toISOString(),
      });
      return response.data;
    } catch (error) {
      console.error("Erreur applyToJobWithMotivation:", error);
      throw error;
    }
  },

  //  candidature
  submitApplication: async (applicationData) => {
    try {
      const response = await axios.post(`${API_URL}/applications`, {
        jobId: applicationData.idOffre || applicationData.jobId,
        lettreMotivation: applicationData.lettreMotivation,
        datePostulation:
          applicationData.datePostulation || new Date().toISOString(),
      });
      return response.data;
    } catch (error) {
      console.error("Erreur submitApplication:", error);
      throw error;
    }
  },

  // candidatures pr candidat
  getCandidateApplications: async () => {
    try {
      const response = await axios.get(`${API_URL}/applications/candidate`);
      return response.data;
    } catch (error) {
      console.error("Erreur getCandidateApplications:", error);
      throw error;
    }
  },

  // getCandidateApplications
  getUserApplications: async () => {
    try {
      const response = await axios.get(`${API_URL}/applications/candidate`);
      return response.data;
    } catch (error) {
      console.error("Erreur getUserApplications:", error);
      throw error;
    }
  },

  // Candidatures pr employeur
  getJobApplications: async (jobId) => {
    try {
      const response = await axios.get(`${API_URL}/applications/job/${jobId}`);
      return response.data;
    } catch (error) {
      console.error("Erreur getJobApplications:", error);
      throw error;
    }
  },

  // mise a jour statut d'une candidature
  updateApplicationStatus: async (applicationId, decision) => {
    try {
      console.log(`Mise à jour candidature ${applicationId} vers ${decision}`);

      const response = await axios.put(
        `${API_URL}/applications/${applicationId}/status`,
        {
          status: decision,
        }
      );

      console.log("Réponse API updateApplicationStatus:", response.data);
      return response.data;
    } catch (error) {
      console.error("Erreur API updateApplicationStatus:", error);

      if (error.response?.status === 400) {
        throw new Error(error.response.data.message || "Données invalides");
      } else if (error.response?.status === 403) {
        throw new Error(
          "Vous n'avez pas l'autorisation de modifier cette candidature"
        );
      } else if (error.response?.status === 404) {
        throw new Error("Candidature non trouvée");
      } else {
        throw new Error("Erreur lors de la mise à jour du statut");
      }
    }
  },

  updateApplicationStatusLegacy: async (applicationId, statusData) => {
    try {
      const requestData =
        typeof statusData === "string" ? { status: statusData } : statusData;

      const response = await axios.put(
        `${API_URL}/applications/${applicationId}`,
        requestData
      );

      return response.data;
    } catch (error) {
      console.error("Erreur API updateApplicationStatusLegacy:", error);
      throw error;
    }
  },

  checkIfApplied: async (jobId) => {
    try {
      const response = await axios.get(
        `${API_URL}/applications/candidate/check/${jobId}`
      );
      return response.data.hasApplied;
    } catch (error) {
      try {
        const applications = await jobService.getCandidateApplications();
        return applications.some(
          (app) => app.offre?.idOffre === jobId || app.jobId === jobId
        );
      } catch (fallbackError) {
        console.warn("Impossible de vérifier les candidatures:", fallbackError);
        return false;
      }
    }
  },

  // r écupérer détails  candidature
  getApplicationDetails: async (applicationId) => {
    try {
      const response = await axios.get(
        `${API_URL}/applications/${applicationId}`
      );
      return response.data;
    } catch (error) {
      console.error("Erreur getApplicationDetails:", error);
      throw error;
    }
  },

  getApplicationDetailsForEmployer: async (applicationId) => {
    try {
      const response = await axios.get(
        `${API_URL}/applications/${applicationId}/details`
      );
      return response.data;
    } catch (error) {
      console.error("Erreur getApplicationDetailsForEmployer:", error);
      throw error;
    }
  },

  // retirer une candidature
  withdrawApplication: async (applicationId) => {
    try {
      const response = await axios.delete(
        `${API_URL}/applications/${applicationId}`
      );
      return response.data;
    } catch (error) {
      console.error("Erreur withdrawApplication:", error);
      const errorMessage =
        error.response?.data ||
        error.message ||
        "Erreur lors du retrait de la candidature";
      throw new Error(errorMessage);
    }
  },

  // télécharger le CV d'un candidat pr employeur
  downloadCandidateCV: async (candidatId) => {
    try {
      const response = await axios.get(
        `${API_URL}/profile/cv/download/${candidatId}`,
        {
          responseType: "blob",
          timeout: 30000,
        }
      );

      if (!response.data || response.data.size === 0) {
        throw new Error("Le fichier CV est vide ou inexistant");
      }

      // créer lien de téléchargement
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;

      // récupérer le nom du fichier depuis les headers
      const contentDisposition = response.headers["content-disposition"];
      let filename = `CV_candidat_${candidatId}.pdf`;

      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(
          /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/
        );
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1].replace(/['"]/g, "");
        }
      }

      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      return {
        success: true,
        filename: filename,
        message: "CV téléchargé avec succès",
      };
    } catch (error) {
      console.error("Erreur lors du téléchargement du CV:", error);

      if (error.response?.status === 404) {
        throw new Error(
          "CV non trouvé. Le candidat n'a peut-être pas encore uploadé son CV."
        );
      } else if (error.response?.status === 403) {
        throw new Error(
          "Accès non autorisé. Vous ne pouvez télécharger que les CV des candidats qui ont postulé à vos offres."
        );
      } else if (error.code === "ECONNABORTED") {
        throw new Error("Timeout: Le téléchargement a pris trop de temps.");
      } else {
        throw new Error(error.message || "Impossible de télécharger le CV");
      }
    }
  },

  // télécharger  CV pr candidat
  downloadMyCV: async () => {
    try {
      const response = await axios.get(`${API_URL}/profile/cv/download`, {
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;

      const contentDisposition = response.headers["content-disposition"];
      let filename = "Mon_CV.pdf";

      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(
          /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/
        );
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1].replace(/['"]/g, "");
        }
      }

      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      return { success: true, filename };
    } catch (error) {
      console.error("Erreur lors du téléchargement du CV:", error);
      throw new Error("Impossible de télécharger votre CV");
    }
  },

  // upload CV
  uploadCV: async (file) => {
    try {
      const formData = new FormData();
      formData.append("cv", file);

      const response = await axios.post(
        `${API_URL}/profile/cv/upload`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error("Erreur uploadCV:", error);
      throw error;
    }
  },

  // supprimer CV
  deleteCV: async () => {
    try {
      const response = await axios.delete(`${API_URL}/profile/cv`);
      return response.data;
    } catch (error) {
      console.error("Erreur deleteCV:", error);
      throw error;
    }
  },

  // get  profil utilisateur
  getCurrentProfile: async () => {
    try {
      const response = await axios.get(`${API_URL}/profile`);
      return response.data;
    } catch (error) {
      console.error("Erreur getCurrentProfile:", error);
      throw error;
    }
  },

  // update profil candidat
  updateCandidateProfile: async (profileData) => {
    try {
      const response = await axios.put(
        `${API_URL}/profile/candidat`,
        profileData
      );
      return response.data;
    } catch (error) {
      console.error("Erreur updateCandidateProfile:", error);
      throw error;
    }
  },

  // update profil employeur
  updateEmployerProfile: async (profileData) => {
    try {
      const response = await axios.put(
        `${API_URL}/profile/employeur`,
        profileData
      );
      return response.data;
    } catch (error) {
      console.error("Erreur updateEmployerProfile:", error);
      throw error;
    }
  },
  // get stat pr employeur
  getEmployerStats: async () => {
    try {
      const jobs = await jobService.getEmployerJobs();
      let allApplications = [];

      for (const job of jobs) {
        try {
          const jobApplications = await jobService.getJobApplications(
            job.idOffre
          );
          allApplications = [...allApplications, ...jobApplications];
        } catch (error) {
          console.log(`Pas de candidatures pour l'offre ${job.idOffre}`);
        }
      }

      return {
        totalJobs: jobs.length,
        activeJobs: jobs.filter((job) => job.etat === "ACTIVE").length,
        expiredJobs: jobs.filter((job) => job.etat === "EXPIREE").length,
        totalApplications: allApplications.length,
        pendingApplications: allApplications.filter(
          (app) => app.etat === "EN_ATTENTE"
        ).length,
        acceptedApplications: allApplications.filter(
          (app) => app.etat === "ACCEPTEE"
        ).length,
        rejectedApplications: allApplications.filter(
          (app) => app.etat === "REFUSEE"
        ).length,
      };
    } catch (error) {
      console.error("Erreur lors du calcul des statistiques:", error);
      return {
        totalJobs: 0,
        activeJobs: 0,
        expiredJobs: 0,
        totalApplications: 0,
        pendingApplications: 0,
        acceptedApplications: 0,
        rejectedApplications: 0,
      };
    }
  },

  // get stat employeur
  getCandidateStats: async () => {
    try {
      const applications = await jobService.getCandidateApplications();

      return {
        totalApplications: applications.length,
        pendingApplications: applications.filter(
          (app) => app.etat === "EN_ATTENTE"
        ).length,
        acceptedApplications: applications.filter(
          (app) => app.etat === "ACCEPTEE"
        ).length,
        rejectedApplications: applications.filter(
          (app) => app.etat === "REFUSEE"
        ).length,
      };
    } catch (error) {
      console.error("Erreur lors du calcul des statistiques candidat:", error);
      return {
        totalApplications: 0,
        pendingApplications: 0,
        acceptedApplications: 0,
        rejectedApplications: 0,
      };
    }
  },

  formatDate: (dateString) => {
    if (!dateString) return "Non spécifiée";
    return new Date(dateString).toLocaleDateString("fr-FR");
  },

  formatDateTime: (dateString) => {
    if (!dateString) return "Non spécifiée";
    return new Date(dateString).toLocaleDateString("fr-FR", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  },

  // calculer les jours restants
  getRemainingDays: (dateExpiration) => {
    if (!dateExpiration) return "Non spécifiée";
    const now = new Date();
    const exp = new Date(dateExpiration);
    const diff = Math.ceil((exp - now) / (1000 * 60 * 60 * 24));
    return diff >= 0 ? `${diff} jour(s)` : "Expirée";
  },

  // valider  email
  isValidEmail: (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  // Valider  lettre de motivation
  validateMotivationLetter: (letter) => {
    if (!letter || letter.trim().length === 0) {
      return { valid: false, message: "La lettre de motivation est requise" };
    }
    if (letter.trim().length < 50) {
      return {
        valid: false,
        message: "La lettre de motivation doit contenir au moins 50 caractères",
      };
    }
    if (letter.trim().length > 2000) {
      return {
        valid: false,
        message: "La lettre de motivation ne peut pas dépasser 2000 caractères",
      };
    }
    return { valid: true, message: "Lettre de motivation valide" };
  },

  // Valider un fichier CV
  validateCVFile: (file) => {
    if (!file) {
      return { valid: false, message: "Aucun fichier sélectionné" };
    }

    // Vérifier l'extension
    const allowedExtensions = [".pdf", ".doc", ".docx"];
    const fileExtension = file.name
      .toLowerCase()
      .substr(file.name.lastIndexOf("."));
    if (!allowedExtensions.includes(fileExtension)) {
      return {
        valid: false,
        message: "Format de fichier non supporté. Utilisez PDF, DOC ou DOCX.",
      };
    }

    // Vérifier la taille (5MB max)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return {
        valid: false,
        message: "Le fichier est trop volumineux. Taille maximale: 5MB.",
      };
    }

    return { valid: true, message: "Fichier CV valide" };
  },

  // mÉTHODES  DEBUG & LOGGING

  // Logger  erreurs API
  logError: (functionName, error) => {
    console.group(`🔴 Erreur ${functionName}`);
    console.error("Message:", error.message);
    console.error("Status:", error.response?.status);
    console.error("Data:", error.response?.data);
    console.error("Full error:", error);
    console.groupEnd();
  },

  // Logger  succès API
  logSuccess: (functionName, data) => {
    console.group(`✅ Succès ${functionName}`);
    console.log("Data:", data);
    console.groupEnd();
  },

  // tester  connexion API
  testConnection: async () => {
    try {
      const response = await axios.get(`${API_URL}/health`);
      console.log("✅ Connexion API OK:", response.data);
      return { success: true, data: response.data };
    } catch (error) {
      console.error("❌ Connexion API FAILED:", error);
      return { success: false, error: error.message };
    }
  },
};

export default jobService;
