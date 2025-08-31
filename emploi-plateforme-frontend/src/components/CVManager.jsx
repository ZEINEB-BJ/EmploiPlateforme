import React, { useState, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import profileService from "../services/ProfileService";

const CVManager = ({ onFeedback }) => {
  const { currentUser, updateUser } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);

  const handleFileSelect = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    if (!allowedTypes.includes(file.type)) {
      setError(
        "Format de fichier non supporté. Seuls PDF, DOC et DOCX sont acceptés."
      );
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Le fichier est trop volumineux. Taille maximum: 5MB");
      return;
    }

    try {
      setUploading(true);
      setError("");

      await profileService.uploadCV(file);

      const updatedProfile = await profileService.getCurrentProfile();
      updateUser(updatedProfile);

      if (onFeedback) {
        onFeedback("CV uploadé avec succès !");
      }
    } catch (err) {
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError("Erreur lors de l'upload du CV.");
      }
    } finally {
      setUploading(false);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDeleteCV = async () => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer votre CV ?")) {
      return;
    }

    try {
      setDeleting(true);
      setError("");

      await profileService.deleteCV();

      const updatedProfile = await profileService.getCurrentProfile();
      updateUser(updatedProfile);

      if (onFeedback) {
        onFeedback("CV supprimé avec succès !");
      }
    } catch (err) {
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError("Erreur lors de la suppression du CV.");
      }
    } finally {
      setDeleting(false);
    }
  };

  const handleDownloadCV = async () => {
    try {
      const blob = await profileService.downloadCV();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `CV_${currentUser.prenom}_${currentUser.nom}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError("Erreur lors du téléchargement du CV.");
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("fr-FR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getFileExtension = (path) => {
    if (!path) return "";
    return path.split(".").pop().toUpperCase();
  };

  if (currentUser?.role !== "CANDIDAT") {
    return null;
  }

  return (
    <div className="card">
      <div className="card-header">
        <h5 className="mb-0">Gestion du CV</h5>
      </div>
      <div className="card-body">
        {error && (
          <div className="alert alert-danger alert-dismissible" role="alert">
            {error}
            <button
              type="button"
              className="btn-close"
              onClick={() => setError("")}
              aria-label="Close"
            ></button>
          </div>
        )}

        {currentUser.cvPath ? (
          <div>
            <div className="row align-items-center">
              <div className="col">
                <div className="d-flex align-items-center mb-3">
                  <div className="me-3">
                    <i className="bi bi-file-earmark-pdf fs-1 text-danger"></i>
                  </div>
                  <div>
                    <h6 className="mb-1">
                      CV disponible{" "}
                      <span className="badge bg-success ms-2">
                        {getFileExtension(currentUser.cvPath)}
                      </span>
                    </h6>
                    {currentUser.cvUploadDate && (
                      <small className="text-muted">
                        Uploadé le {formatDate(currentUser.cvUploadDate)}
                      </small>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="d-flex gap-2 flex-wrap">
              <button
                className="btn btn-primary btn-sm"
                onClick={handleDownloadCV}
              >
                <i className="bi bi-download me-1"></i>
                Télécharger
              </button>

              <button
                className="btn btn-outline-primary btn-sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? (
                  <>
                    <span
                      className="spinner-border spinner-border-sm me-1"
                      role="status"
                    ></span>
                    Upload...
                  </>
                ) : (
                  <>
                    <i className="bi bi-arrow-clockwise me-1"></i>
                    Remplacer
                  </>
                )}
              </button>

              <button
                className="btn btn-outline-danger btn-sm"
                onClick={handleDeleteCV}
                disabled={deleting}
              >
                {deleting ? (
                  <>
                    <span
                      className="spinner-border spinner-border-sm me-1"
                      role="status"
                    ></span>
                    Suppression...
                  </>
                ) : (
                  <>
                    <i className="bi bi-trash me-1"></i>
                    Supprimer
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center py-4">
            <i className="bi bi-file-earmark-plus fs-1 text-muted mb-3"></i>
            <h6 className="text-muted mb-3">Aucun CV uploadé</h6>
            <p className="text-muted small mb-3">
              Ajoutez votre CV pour augmenter vos chances d'être recruté.
              <br />
              Formats acceptés: PDF, DOC, DOCX (max 5MB)
            </p>

            <button
              className="btn btn-primary"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? (
                <>
                  <span
                    className="spinner-border spinner-border-sm me-2"
                    role="status"
                  ></span>
                  Upload en cours...
                </>
              ) : (
                <>
                  <i className="bi bi-upload me-2"></i>
                  Uploader mon CV
                </>
              )}
            </button>
          </div>
        )}

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          accept=".pdf,.doc,.docx"
          style={{ display: "none" }}
        />

        <hr />
        <small className="text-muted">
          <strong>Conseils :</strong>
          <ul className="mb-0 mt-2">
            <li>Utilisez un nom de fichier professionnel</li>
            <li>Assurez-vous que votre CV est à jour</li>
            <li>Privilégiez le format PDF pour une meilleure compatibilité</li>
          </ul>
        </small>
      </div>
    </div>
  );
};

export default CVManager;
