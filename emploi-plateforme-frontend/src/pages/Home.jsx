import React, { useState, useEffect } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Form,
  Badge,
  Spinner,
  Alert,
  InputGroup,
  Modal,
} from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import jobService from "../services/JobServices";

const Home = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTitle, setSearchTitle] = useState("");
  const [searchLocation, setSearchLocation] = useState("");
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");

  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  const [showQuickApplyModal, setShowQuickApplyModal] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [motivationLetter, setMotivationLetter] = useState("");
  const [submittingApplication, setSubmittingApplication] = useState(false);
  const [applicationError, setApplicationError] = useState("");

  const [userApplications, setUserApplications] = useState([]);

  useEffect(() => {
    loadJobs();
  }, [currentPage]);

  useEffect(() => {
    if (currentUser && currentUser.role === "CANDIDAT") {
      loadUserApplications();
    }
  }, [currentUser]);

  const loadJobs = async () => {
    try {
      setLoading(true);
      const data = await jobService.getAllActiveJobs(
        currentPage,
        10,
        searchTitle,
        searchLocation
      );

      if (data.content) {
        setJobs(data.content);
        setTotalPages(data.totalPages);
        setTotalElements(data.totalElements);
      } else {
        setJobs(data);
      }
    } catch (error) {
      console.error("Erreur lors du chargement des offres:", error);
      setError("Erreur lors du chargement des offres");
    } finally {
      setLoading(false);
    }
  };

  const loadUserApplications = async () => {
    try {
      const applications = await jobService.getUserApplications();
      setUserApplications(applications);
    } catch (error) {
      console.error("Erreur lors du chargement des candidatures:", error);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(0);
    loadJobs();
  };

  const hasUserApplied = (jobId) => {
    return userApplications.some(
      (app) => app.idOffre === jobId || app.jobId === jobId
    );
  };

  const isJobExpired = (dateExpiration) => {
    const now = new Date();
    const exp = new Date(dateExpiration);
    return exp <= now;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("fr-FR");
  };

  const getRemainingDays = (dateExpiration) => {
    const now = new Date();
    const exp = new Date(dateExpiration);
    const diffTime = exp - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return "Expirée";
    if (diffDays === 0) return "Expire aujourd'hui";
    if (diffDays === 1) return "Expire demain";
    return `${diffDays} jours`;
  };

  const handleQuickApply = (job) => {
    // Vérifier si l'utilisateur est connecté
    if (!currentUser) {
      navigate("/login", {
        state: {
          redirectTo: `/job/${job.idOffre}`,
          message: "Veuillez vous connecter pour postuler à cette offre.",
        },
      });
      return;
    }

    // Vérifier si l'utilisateur est un candidat
    if (currentUser.role !== "CANDIDAT") {
      setError("Seuls les candidats peuvent postuler aux offres d'emploi.");
      setTimeout(() => setError(""), 5000);
      return;
    }

    // Vérifier si l'utilisateur a déjà postulé
    if (hasUserApplied(job.idOffre)) {
      setError("Vous avez déjà postulé à cette offre.");
      setTimeout(() => setError(""), 5000);
      return;
    }

    // Vérifier si l'offre n'est pas expirée
    if (isJobExpired(job.dateExpiration)) {
      setError("Cette offre a expiré.");
      setTimeout(() => setError(""), 5000);
      return;
    }

    setSelectedJob(job);
    setMotivationLetter("");
    setApplicationError("");
    setShowQuickApplyModal(true);
  };

  const handleQuickApplicationSubmit = async (e) => {
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
        selectedJob.idOffre,
        motivationLetter.trim()
      );

      setShowQuickApplyModal(false);
      setFeedback("Votre candidature a été envoyée avec succès !");
      loadUserApplications();

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

  const shouldShowApplyButton = (job) => {
    return (
      (!currentUser || currentUser.role === "CANDIDAT") &&
      !isJobExpired(job.dateExpiration)
    );
  };

  const getApplyButtonState = (job) => {
    if (!currentUser) {
      return {
        text: "Se connecter pour postuler",
        disabled: false,
        variant: "outline-primary",
      };
    }

    if (currentUser.role !== "CANDIDAT") {
      return {
        text: "Réservé aux candidats",
        disabled: true,
        variant: "outline-secondary",
      };
    }

    if (hasUserApplied(job.idOffre)) {
      return {
        text: "Déjà postulé",
        disabled: true,
        variant: "outline-success",
      };
    }

    if (isJobExpired(job.dateExpiration)) {
      return {
        text: "Offre expirée",
        disabled: true,
        variant: "outline-secondary",
      };
    }

    return {
      text: "Postuler",
      disabled: false,
      variant: "primary",
    };
  };

  if (loading) {
    return (
      <Container className="mt-5 text-center">
        <Spinner animation="border" role="status" size="lg">
          <span className="visually-hidden">Chargement...</span>
        </Spinner>
      </Container>
    );
  }

  return (
    <Container className="mt-4">
      <section
        className="hero-section text-white text-center py-5"
        style={{ backgroundColor: "#5dade2" }}
      >
        <Container>
          <h1 className="display-4 mb-4">Trouvez votre emploi idéal</h1>
          <p className="lead mb-4">
            La plateforme qui connecte les talents avec les opportunités.
          </p>
          {!useAuth && (
            <Button as={Link} to="/register" variant="light" size="lg">
              Commencer
            </Button>
          )}
        </Container>
      </section>

      {/* Barre de recherche */}
      <Card className="mb-4">
        <Card.Body>
          <Form onSubmit={handleSearch}>
            <Row>
              <Col md={5}>
                <InputGroup>
                  <InputGroup.Text>
                    <i className="bi bi-search"></i>
                  </InputGroup.Text>
                  <Form.Control
                    type="text"
                    placeholder="Titre du poste..."
                    value={searchTitle}
                    onChange={(e) => setSearchTitle(e.target.value)}
                  />
                </InputGroup>
              </Col>
              <Col md={5}>
                <InputGroup>
                  <InputGroup.Text>
                    <i className="bi bi-geo-alt"></i>
                  </InputGroup.Text>
                  <Form.Control
                    type="text"
                    placeholder="Localisation..."
                    value={searchLocation}
                    onChange={(e) => setSearchLocation(e.target.value)}
                  />
                </InputGroup>
              </Col>
              <Col md={2}>
                <Button type="submit" variant="primary" className="w-100">
                  Rechercher
                </Button>
              </Col>
            </Row>
          </Form>
        </Card.Body>
      </Card>

      {/* Liste des offres */}
      {jobs.length === 0 ? (
        <Card>
          <Card.Body className="text-center py-5">
            <i className="bi bi-briefcase fs-1 text-muted mb-3"></i>
            <h5 className="text-muted">Aucune offre trouvée</h5>
            <p className="text-muted">
              Essayez de modifier vos critères de recherche
            </p>
          </Card.Body>
        </Card>
      ) : (
        <>
          <Row>
            {jobs.map((job) => {
              const buttonState = getApplyButtonState(job);
              const expired = isJobExpired(job.dateExpiration);

              return (
                <Col lg={6} className="mb-4" key={job.idOffre}>
                  <Card
                    className={`h-100 ${
                      expired ? "border-secondary" : "border-primary"
                    }`}
                  >
                    <Card.Header className="d-flex justify-content-between align-items-start">
                      <div>
                        <h5 className="mb-1">
                          <Link
                            to={`/job/${job.idOffre}`}
                            className="text-decoration-none"
                          >
                            {job.titre}
                          </Link>
                        </h5>
                        <h6 className="text-muted mb-0">
                          {job.employeur?.nomEntreprise || "Entreprise"}
                        </h6>
                      </div>
                      <div>
                        {expired ? (
                          <Badge bg="danger">Expirée</Badge>
                        ) : (
                          <Badge bg="success">Active</Badge>
                        )}
                      </div>
                    </Card.Header>

                    <Card.Body className="d-flex flex-column">
                      <div className="mb-3">
                        <p className="text-muted mb-2">
                          <i className="bi bi-geo-alt me-1"></i>
                          {job.localisation}
                        </p>
                        <p className="text-muted mb-2">
                          <i className="bi bi-calendar me-1"></i>
                          Publié le {formatDate(job.datePublication)}
                        </p>
                        <p className="text-muted mb-0">
                          <i className="bi bi-clock me-1"></i>
                          {getRemainingDays(job.dateExpiration)}
                        </p>
                      </div>

                      <div className="mb-3 flex-grow-1">
                        <p className="text-truncate-3">
                          {job.description || "Description non disponible"}
                        </p>
                      </div>

                      <div className="d-flex gap-2 mt-auto">
                        <Button
                          as={Link}
                          to={`/job/${job.idOffre}`}
                          variant="outline-primary"
                          size="sm"
                          className="flex-grow-1"
                        >
                          Voir détails
                        </Button>

                        {shouldShowApplyButton(job) && (
                          <Button
                            variant={buttonState.variant}
                            size="sm"
                            disabled={buttonState.disabled}
                            onClick={() =>
                              !currentUser
                                ? navigate("/login", {
                                    state: {
                                      redirectTo: `/job/${job.idOffre}`,
                                      message:
                                        "Veuillez vous connecter pour postuler à cette offre.",
                                    },
                                  })
                                : handleQuickApply(job)
                            }
                            className="flex-shrink-0"
                            style={{ minWidth: "120px" }}
                          >
                            {buttonState.text}
                          </Button>
                        )}
                      </div>

                      {currentUser &&
                        currentUser.role === "CANDIDAT" &&
                        hasUserApplied(job.idOffre) && (
                          <div className="mt-2">
                            <small className="text-success">
                              <i className="bi bi-check-circle me-1"></i>
                              Vous avez postulé à cette offre
                            </small>
                          </div>
                        )}
                    </Card.Body>
                  </Card>
                </Col>
              );
            })}
          </Row>

          {totalPages > 1 && (
            <Row className="mt-4">
              <Col className="d-flex justify-content-center">
                <nav>
                  <ul className="pagination">
                    <li
                      className={`page-item ${
                        currentPage === 0 ? "disabled" : ""
                      }`}
                    >
                      <Button
                        variant="link"
                        className="page-link"
                        onClick={() => setCurrentPage(currentPage - 1)}
                        disabled={currentPage === 0}
                      >
                        Précédent
                      </Button>
                    </li>

                    {[...Array(totalPages)].map((_, index) => (
                      <li
                        key={index}
                        className={`page-item ${
                          currentPage === index ? "active" : ""
                        }`}
                      >
                        <Button
                          variant={currentPage === index ? "primary" : "link"}
                          className="page-link"
                          onClick={() => setCurrentPage(index)}
                        >
                          {index + 1}
                        </Button>
                      </li>
                    ))}

                    <li
                      className={`page-item ${
                        currentPage === totalPages - 1 ? "disabled" : ""
                      }`}
                    >
                      <Button
                        variant="link"
                        className="page-link"
                        onClick={() => setCurrentPage(currentPage + 1)}
                        disabled={currentPage === totalPages - 1}
                      >
                        Suivant
                      </Button>
                    </li>
                  </ul>
                </nav>
              </Col>
            </Row>
          )}
        </>
      )}

      <Modal
        show={showQuickApplyModal}
        onHide={() => setShowQuickApplyModal(false)}
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>Candidature rapide : {selectedJob?.titre}</Modal.Title>
        </Modal.Header>

        <Form onSubmit={handleQuickApplicationSubmit}>
          <Modal.Body>
            {selectedJob && (
              <div className="mb-3">
                <p>
                  <strong>Entreprise:</strong>{" "}
                  {selectedJob.employeur?.nomEntreprise}
                </p>
                <p>
                  <strong>Poste:</strong> {selectedJob.titre}
                </p>
                <p>
                  <strong>Localisation:</strong> {selectedJob.localisation}
                </p>
              </div>
            )}

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
              onClick={() => setShowQuickApplyModal(false)}
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

      {/*  CSS  */}
      <style>{`
        .text-truncate-3 {
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .pagination .page-link {
          border: none;
          color: #0d6efd;
        }

        .pagination .page-item.active .page-link {
          background-color: #0d6efd;
          border-color: #0d6efd;
        }

        .pagination .page-link:hover {
          background-color: #e7f1ff;
        }
      `}</style>
    </Container>
  );
};

export default Home;
