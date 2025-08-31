import React, { useState, useEffect } from "react";
import {
  Container,
  Card,
  Button,
  Alert,
  Modal,
  Form,
  Spinner,
  Badge,
} from "react-bootstrap";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import jobService from "../services/JobServices";

const JobDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");

  const [showApplicationModal, setShowApplicationModal] = useState(false);
  const [motivationLetter, setMotivationLetter] = useState("");
  const [submittingApplication, setSubmittingApplication] = useState(false);
  const [applicationError, setApplicationError] = useState("");

  const [hasApplied, setHasApplied] = useState(false);
  const [checkingApplication, setCheckingApplication] = useState(false);

  useEffect(() => {
    loadJob();
  }, [id]);

  useEffect(() => {
    if (currentUser && currentUser.role === "CANDIDAT" && job) {
      checkIfUserApplied();
    }
  }, [currentUser, job]);

  const loadJob = async () => {
    try {
      const data = await jobService.getJobById(id);
      setJob(data);
      setLoading(false);
    } catch (error) {
      setError("Erreur lors du chargement de l'offre");
      setLoading(false);
    }
  };

  const checkIfUserApplied = async () => {
    try {
      setCheckingApplication(true);
      const applications = await jobService.getCandidateApplications();
      const applicationExists = applications.some(
        (app) => app.idOffre === parseInt(id) || app.jobId === parseInt(id)
      );
      setHasApplied(applicationExists);
    } catch (error) {
      console.error("Erreur lors de la vérification des candidatures:", error);
    } finally {
      setCheckingApplication(false);
    }
  };

  const handleApplyClick = () => {
    // Vérifier si l'utilisateur est connecté
    if (!currentUser) {
      navigate("/login", {
        state: {
          redirectTo: `/job/${id}`,
          message: "Veuillez vous connecter pour postuler à cette offre.",
        },
      });
      return;
    }

    // Vérifier si l'utilisateur est un candidat
    if (currentUser.role !== "CANDIDAT") {
      setError("Seuls les candidats peuvent postuler à cette offre.");
      setTimeout(() => setError(""), 5000);
      return;
    }

    // Vérifier si l'utilisateur a déjà postulé
    if (hasApplied) {
      setError("Vous avez déjà postulé à cette offre.");
      setTimeout(() => setError(""), 5000);
      return;
    }

    // Vérifier si l'offre n'est pas expirée
    if (isJobExpired()) {
      setError("Cette offre a expiré.");
      setTimeout(() => setError(""), 5000);
      return;
    }

    setShowApplicationModal(true);
    setMotivationLetter("");
    setApplicationError("");
  };

  const handleApplicationSubmit = async (e) => {
    e.preventDefault();
    setApplicationError("");

    // Validation de la lettre de motivation
    if (!motivationLetter.trim()) {
      setApplicationError("La lettre de motivation est requise.");
      return;
    }

    if (motivationLetter.trim().length < 50) {
      setApplicationError(
        "La lettre de motivation doit contenir au moins 50 caractères."
      );
      return;
    }

    if (motivationLetter.trim().length > 2000) {
      setApplicationError(
        "La lettre de motivation ne peut pas dépasser 2000 caractères."
      );
      return;
    }

    try {
      setSubmittingApplication(true);

      await jobService.applyToJobWithMotivation(
        job.idOffre,
        motivationLetter.trim()
      );

      setShowApplicationModal(false);
      setFeedback("Votre candidature a été envoyée avec succès !");
      setHasApplied(true);

      setTimeout(() => setFeedback(""), 5000);
    } catch (error) {
      console.error("Erreur lors de l'envoi de la candidature:", error);
      setApplicationError(
        error.response?.data?.message ||
          "Erreur lors de l'envoi de la candidature. Veuillez réessayer."
      );
    } finally {
      setSubmittingApplication(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("fr-FR");
  };

  const isJobExpired = () => {
    if (!job) return false;
    const now = new Date();
    const expirationDate = new Date(job.dateExpiration);
    return expirationDate <= now;
  };

  const getRemainingDays = () => {
    if (!job) return "";
    const now = new Date();
    const expirationDate = new Date(job.dateExpiration);
    const diffTime = expirationDate - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return "Expirée";
    if (diffDays === 0) return "Expire aujourd'hui";
    if (diffDays === 1) return "Expire demain";
    return `${diffDays} jours restants`;
  };

  const shouldShowApplyButton = () => {
    return !currentUser || currentUser.role === "CANDIDAT";
  };

  const getApplyButtonState = () => {
    if (!currentUser) {
      return { text: "Se connecter pour postuler", disabled: false };
    }

    if (currentUser.role !== "CANDIDAT") {
      return { text: "Réservé aux candidats", disabled: true };
    }

    if (checkingApplication) {
      return { text: "Vérification...", disabled: true };
    }

    if (hasApplied) {
      return { text: "Déjà postulé", disabled: true };
    }

    if (isJobExpired()) {
      return { text: "Offre expirée", disabled: true };
    }

    return { text: "Postuler", disabled: false };
  };

  if (loading) {
    return (
      <Container className="mt-4">
        <div className="text-center">
          <Spinner animation="border" role="status" size="lg">
            <span className="visually-hidden">Chargement...</span>
          </Spinner>
        </div>
      </Container>
    );
  }

  if (!job) {
    return (
      <Container className="mt-4">
        <Alert variant="danger">Offre non trouvée</Alert>
        <Button variant="secondary" onClick={() => navigate("/")}>
          Retour aux offres
        </Button>
      </Container>
    );
  }

  const buttonState = getApplyButtonState();

  return (
    <Container className="mt-4">
      <Card>
        <Card.Header>
          <div className="d-flex justify-content-between align-items-start">
            <div>
              <h2>{job.titre}</h2>
              <h5 className="text-muted">
                {job.employeur?.nomEntreprise || "Entreprise"}
              </h5>
            </div>
            <div>
              {isJobExpired() ? (
                <Badge bg="danger">Expirée</Badge>
              ) : (
                <Badge bg="success">Active</Badge>
              )}
            </div>
          </div>
        </Card.Header>

        <Card.Body>
          {error && (
            <Alert variant="danger" dismissible onClose={() => setError("")}>
              {error}
            </Alert>
          )}

          {feedback && (
            <Alert
              variant="success"
              dismissible
              onClose={() => setFeedback("")}
            >
              {feedback}
            </Alert>
          )}

          <div className="mb-3">
            <strong>Localisation:</strong> {job.localisation}
          </div>

          <div className="mb-3">
            <strong>Date de publication:</strong>{" "}
            {formatDate(job.datePublication)}
          </div>

          <div className="mb-3">
            <strong>Date d'expiration:</strong> {formatDate(job.dateExpiration)}
            <span className="ms-2">
              <Badge bg={isJobExpired() ? "danger" : "info"}>
                {getRemainingDays()}
              </Badge>
            </span>
          </div>

          <div className="mb-4">
            <strong>Description:</strong>
            <p className="mt-2" style={{ whiteSpace: "pre-wrap" }}>
              {job.description}
            </p>
          </div>

          <div className="d-flex gap-2">
            {shouldShowApplyButton() && (
              <Button
                variant="primary"
                onClick={handleApplyClick}
                disabled={buttonState.disabled}
              >
                {buttonState.text}
              </Button>
            )}

            <Button variant="secondary" onClick={() => navigate("/")}>
              Retour aux offres
            </Button>
          </div>

          {!currentUser && (
            <div className="mt-3">
              <small className="text-muted">
                Vous devez être connecté en tant que candidat pour postuler.
              </small>
            </div>
          )}
        </Card.Body>
      </Card>

      <Modal
        show={showApplicationModal}
        onHide={() => setShowApplicationModal(false)}
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>Postuler à l'offre : {job?.titre}</Modal.Title>
        </Modal.Header>

        <Form onSubmit={handleApplicationSubmit}>
          <Modal.Body>
            <div className="mb-3">
              <p>
                <strong>Entreprise:</strong> {job?.employeur?.nomEntreprise}
              </p>
              <p>
                <strong>Poste:</strong> {job?.titre}
              </p>
              <p>
                <strong>Localisation:</strong> {job?.localisation}
              </p>
            </div>

            <Form.Group className="mb-3">
              <Form.Label>
                Lettre de motivation <span className="text-danger">*</span>
              </Form.Label>
              <Form.Control
                as="textarea"
                rows={8}
                value={motivationLetter}
                onChange={(e) => setMotivationLetter(e.target.value)}
                placeholder="Rédigez votre lettre de motivation ici... (minimum 50 caractères)"
                required
              />
              <Form.Text className="text-muted">
                {motivationLetter.length}/2000 caractères
                {motivationLetter.length < 50 &&
                  motivationLetter.length > 0 &&
                  ` (minimum 50 caractères requis)`}
              </Form.Text>
            </Form.Group>

            {applicationError && (
              <Alert variant="danger">{applicationError}</Alert>
            )}
          </Modal.Body>

          <Modal.Footer>
            <Button
              variant="secondary"
              onClick={() => setShowApplicationModal(false)}
              disabled={submittingApplication}
            >
              Annuler
            </Button>
            <Button
              variant="primary"
              type="submit"
              disabled={
                submittingApplication || motivationLetter.trim().length < 50
              }
            >
              {submittingApplication ? (
                <>
                  <Spinner
                    as="span"
                    animation="border"
                    size="sm"
                    className="me-2"
                  />
                  Envoi en cours...
                </>
              ) : (
                "Envoyer ma candidature"
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
};

export default JobDetails;
