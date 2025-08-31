import axios from "axios";

const API_URL = "http://localhost:8081/api";

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

const matchingService = {
  getCandidateRecommendations: async (candidatId) => {
    try {
      const response = await axios.get(
        `${API_URL}/recommandations/candidat/${candidatId}`
      );
      return response.data;
    } catch (error) {
      console.error("Erreur getCandidateRecommendations:", error);
      throw new Error(
        error.response?.data?.message ||
          "Erreur lors du chargement des recommandations"
      );
    }
  },

  getTopCandidateRecommendations: async (candidatId, limit = 5) => {
    try {
      const response = await axios.get(
        `${API_URL}/recommandations/candidat/${candidatId}/top/${limit}`
      );
      return response.data;
    } catch (error) {
      console.error("Erreur getTopCandidateRecommendations:", error);
      throw new Error(
        error.response?.data?.message ||
          "Erreur lors du chargement des top recommandations"
      );
    }
  },

  getSortedApplicationsForJob: async (jobId) => {
    try {
      const response = await axios.get(
        `${API_URL}/applications/job/${jobId}/sorted`
      );
      return response.data;
    } catch (error) {
      console.error("Erreur getSortedApplicationsForJob:", error);
      throw new Error(
        error.response?.data?.message ||
          "Erreur lors du chargement des candidatures triées"
      );
    }
  },

  recalculateMatchingScores: async () => {
    try {
      const response = await axios.post(
        `${API_URL}/applications/recalculate-scores`
      );
      return response.data;
    } catch (error) {
      console.error("Erreur recalculateMatchingScores:", error);
      throw new Error(
        error.response?.data?.message || "Erreur lors du recalcul des scores"
      );
    }
  },

  formatMatchingScore: (score) => {
    if (typeof score !== "number" || score < 0) return "0%";
    return `${Math.round(score * 100)}%`;
  },

  getScoreVariant: (score) => {
    if (score >= 0.8) return "success";
    if (score >= 0.6) return "warning";
    if (score >= 0.4) return "info";
    return "secondary";
  },

  getScoreDescription: (score) => {
    if (score >= 0.8) return "Excellent match";
    if (score >= 0.6) return "Bon match";
    if (score >= 0.4) return "Match moyen";
    return "Match faible";
  },

  validateRecommendation: (recommendation) => {
    return (
      recommendation &&
      typeof recommendation.score === "number" &&
      recommendation.offre &&
      recommendation.offre.idOffre
    );
  },

  validateSortedApplication: (application) => {
    return (
      application &&
      typeof application.matchingScore === "number" &&
      application.candidat &&
      application.id
    );
  },

  logMatchingError: (operation, error) => {
    console.group(`🔴 Erreur Matching - ${operation}`);
    console.error("Message:", error.message);
    console.error("Status:", error.response?.status);
    console.error("Data:", error.response?.data);
    console.groupEnd();
  },

  logMatchingSuccess: (operation, data) => {
    console.group(`✅ Succès Matching - ${operation}`);
    console.log("Data:", data);
    console.groupEnd();
  },

  _recommendationsCache: new Map(),
  _cacheTimeout: 5 * 60 * 1000,

  getCachedRecommendations: async function (candidatId, limit = 5) {
    const cacheKey = `${candidatId}-${limit}`;
    const cached = this._recommendationsCache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < this._cacheTimeout) {
      console.log(
        `📦 Recommandations récupérées du cache pour candidat ${candidatId}`
      );
      return cached.data;
    }

    try {
      const data = await this.getTopCandidateRecommendations(candidatId, limit);
      this._recommendationsCache.set(cacheKey, {
        data,
        timestamp: Date.now(),
      });
      return data;
    } catch (error) {
      if (cached) {
        console.warn("Utilisation du cache expiré en fallback");
        return cached.data;
      }
      throw error;
    }
  },

  clearRecommendationsCache: function () {
    this._recommendationsCache.clear();
    console.log("🗑️ Cache des recommandations vidé");
  },
};

export default matchingService;
