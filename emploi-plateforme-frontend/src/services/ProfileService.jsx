import axios from "axios";

const API_URL = "http://localhost:8081/api";

// intercepteur pr ajouter le token aux requêtes
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

const profileService = {
  getCurrentProfile: async () => {
    const response = await axios.get(`${API_URL}/profile`);
    return response.data;
  },

  updateCandidatProfile: async (profileData) => {
    const response = await axios.put(
      `${API_URL}/profile/candidat`,
      profileData
    );
    return response.data;
  },

  updateEmployeurProfile: async (profileData) => {
    const response = await axios.put(
      `${API_URL}/profile/employeur`,
      profileData
    );
    return response.data;
  },

  // uploade CV
  uploadCV: async (file) => {
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
  },

  // supprimer  CV
  deleteCV: async () => {
    const response = await axios.delete(`${API_URL}/profile/cv`);
    return response.data;
  },

  // télécharger  CV
  downloadCV: async () => {
    const response = await axios.get(`${API_URL}/profile/cv/download`, {
      responseType: "blob",
    });
    return response.data;
  },
};

export default profileService;
