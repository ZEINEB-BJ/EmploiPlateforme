import React, { useState, useEffect } from "react";
import {
  Modal,
  Card,
  Row,
  Col,
  Badge,
  Button,
  Spinner,
  Alert,
} from "react-bootstrap";
import jobService from "../services/JobServices";

const ApplicationDetailsModal = ({
  show,
  onHide,
  applicationId,
  onStatusUpdate,
}) => {
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [downloadingCV, setDownloadingCV] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);

  useEffect(() => {
    if (show && applicationId) {
      loadApplicationDetails();
    }
  }, [show, applicationId]);

  const loadApplicationDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await jobService.getApplicationDetailsForEmployer(
        applicationId
      );
      setApplication(data);
    } catch (error) {
      console.error("Erreur lors du chargement des détails:", error);
      setError("Impossible de charger les détails de la candidature");
    } finally {
      setLoading(false);
    }
  };

  // mise à jour du statut
  const handleStatusUpdate = async (newDecision) => {
    try {
      setUpdating(true);
      setError(null);
      setSuccessMessage(null);

      console.log(`Mise à jour vers: ${newDecision}`);

      const result = await jobService.updateApplicationStatus(
        applicationId,
        newDecision
      );

      console.log("Résultat API:", result);

      setApplication((prev) => ({
        ...prev,
        decision: newDecision,
        etat: newDecision === "ACCEPTEE" ? "ACCEPTEE" : "REFUSEE",
      }));

      const statusText = newDecision === "ACCEPTEE" ? "acceptée" : "refusée";
      setSuccessMessage(`Candidature ${statusText} avec succès !`);

      if (onStatusUpdate) {
        onStatusUpdate(applicationId, newDecision);
      }

      setTimeout(() => {
        if (show) {
          onHide();
        }
      }, 2000);
    } catch (error) {
      console.error("Erreur lors de la mise à jour:", error);
      setError(error.message || "Erreur lors de la mise à jour du statut");
    } finally {
      setUpdating(false);
    }
  };

  const handleDownloadCV = async () => {
    if (!application?.candidat?.id) return;

    try {
      setDownloadingCV(true);
      setError(null);
      await jobService.downloadCandidateCV(application.candidat.id);
    } catch (error) {
      console.error("Erreur lors du téléchargement:", error);
      setError(
        "Impossible de télécharger le CV. Le candidat n'a peut-être pas encore uploadé son CV."
      );
    } finally {
      setDownloadingCV(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Non spécifiée";
    return new Date(dateString).toLocaleDateString("fr-FR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadge = (etat, decision) => {
    if (decision === "ACCEPTEE") {
      return (
        <Badge bg="success" className="fs-6">
          <i className="bi bi-check-circle me-1"></i>Acceptée
        </Badge>
      );
    } else if (decision === "REFUSEE") {
      return (
        <Badge bg="danger" className="fs-6">
          <i className="bi bi-x-circle me-1"></i>Refusée
        </Badge>
      );
    } else {
      return (
        <Badge bg="warning" className="fs-6">
          <i className="bi bi-clock me-1"></i>En attente
        </Badge>
      );
    }
  };

  const canUpdateStatus = () => {
    return (
      application &&
      (!application.decision || application.etat === "EN_ATTENTE")
    );
  };

  return (
    <Modal show={show} onHide={onHide} size="xl" centered scrollable>
      <Modal.Header closeButton className="bg-primary text-white">
        <Modal.Title>
          <i className="bi bi-person-lines-fill me-2"></i>
          Détails de la candidature
          {application && (
            <small className="d-block mt-1 opacity-75">
              ID: #{application.id} • {formatDate(application.datePostulation)}
            </small>
          )}
        </Modal.Title>
      </Modal.Header>

      <Modal.Body className="p-0">
        {loading && (
          <div className="text-center py-5">
            <Spinner
              animation="border"
              role="status"
              variant="primary"
              size="lg"
            >
              <span className="visually-hidden">Chargement...</span>
            </Spinner>
            <p className="text-muted mt-3">Chargement des détails...</p>
          </div>
        )}

        {(error || successMessage) && (
          <div className="p-4">
            {error && (
              <Alert
                variant="danger"
                dismissible
                onClose={() => setError(null)}
              >
                <Alert.Heading>
                  <i className="bi bi-exclamation-triangle me-2"></i>Erreur
                </Alert.Heading>
                {error}
              </Alert>
            )}
            {successMessage && (
              <Alert
                variant="success"
                dismissible
                onClose={() => setSuccessMessage(null)}
              >
                <Alert.Heading>
                  <i className="bi bi-check-circle me-2"></i>Succès
                </Alert.Heading>
                {successMessage}
              </Alert>
            )}
          </div>
        )}

        {application && !loading && (
          <div className="p-4">
            {updating && (
              <Alert variant="info" className="mb-4">
                <Spinner animation="border" size="sm" className="me-2" />
                Mise à jour en cours...
              </Alert>
            )}

            <div className="d-grid gap-4">
              {/* infos générales */}
              <Card className="border-primary shadow-sm">
                <Card.Header className="bg-primary text-white">
                  <div className="d-flex justify-content-between align-items-center">
                    <h6 className="mb-0">
                      <i className="bi bi-info-circle me-2"></i>
                      Informations générales
                    </h6>
                    {getStatusBadge(application.etat, application.decision)}
                  </div>
                </Card.Header>
                <Card.Body>
                  <Row>
                    <Col md={6}>
                      <div className="mb-3">
                        <strong className="text-muted">
                          <i className="bi bi-briefcase me-1"></i>Poste :
                        </strong>
                        <p className="mb-1 fs-5 fw-semibold text-primary">
                          {application.offre?.titre}
                        </p>
                      </div>
                      <div className="mb-3">
                        <strong className="text-muted">
                          <i className="bi bi-calendar-event me-1"></i>Date de
                          candidature :
                        </strong>
                        <p className="mb-1">
                          {formatDate(application.datePostulation)}
                        </p>
                      </div>
                    </Col>
                    <Col md={6}>
                      <div className="mb-3">
                        <strong className="text-muted">
                          <i className="bi bi-geo-alt me-1"></i>Localisation :
                        </strong>
                        <p className="mb-1">
                          {application.offre?.localisation}
                        </p>
                      </div>
                      <div className="mb-3">
                        <strong className="text-muted">
                          <i className="bi bi-hash me-1"></i>ID Candidature :
                        </strong>
                        <p className="mb-1">#{application.id}</p>
                      </div>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>

              {/* infos candidat */}
              <Card className="border-info shadow-sm">
                <Card.Header className="bg-info text-white">
                  <h6 className="mb-0">
                    <i className="bi bi-person me-2"></i>
                    Profil du candidat
                  </h6>
                </Card.Header>
                <Card.Body>
                  <Row>
                    <Col md={6}>
                      <div className="mb-3">
                        <strong className="text-muted">
                          <i className="bi bi-person-fill me-1"></i>Nom complet
                          :
                        </strong>
                        <p className="mb-1 fs-5 fw-semibold">
                          {application.candidat?.prenom}{" "}
                          {application.candidat?.nom}
                        </p>
                      </div>
                      <div className="mb-3">
                        <strong className="text-muted">
                          <i className="bi bi-envelope me-1"></i>Email :
                        </strong>
                        <p className="mb-1">
                          <a
                            href={`mailto:${application.candidat?.email}`}
                            className="text-decoration-none"
                          >
                            {application.candidat?.email}
                          </a>
                        </p>
                      </div>
                    </Col>
                    <Col md={6}>
                      <div className="mb-3">
                        <strong className="text-muted">
                          <i className="bi bi-card-text me-1"></i>CIN :
                        </strong>
                        <p className="mb-1">
                          {application.candidat?.cin || "Non spécifié"}
                        </p>
                      </div>
                      <div className="mb-3">
                        <strong className="text-muted">
                          <i className="bi bi-briefcase-fill me-1"></i>Fonction
                          actuelle :
                        </strong>
                        <p className="mb-1">
                          {application.candidat?.fonctionActuelle ||
                            "Non spécifiée"}
                        </p>
                      </div>
                    </Col>
                  </Row>

                  {/* section CV */}
                  <hr />
                  <div className="mb-3">
                    <strong className="text-muted">
                      <i className="bi bi-file-earmark-text me-1"></i>Curriculum
                      Vitae :
                    </strong>
                    <div className="mt-2">
                      {application.candidat?.hasCv ? (
                        <div className="d-flex align-items-center gap-2">
                          <Badge bg="success">
                            <i className="bi bi-check-circle me-1"></i>CV
                            disponible
                          </Badge>
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={handleDownloadCV}
                            disabled={downloadingCV}
                          >
                            {downloadingCV ? (
                              <>
                                <Spinner
                                  animation="border"
                                  size="sm"
                                  className="me-2"
                                />
                                Téléchargement...
                              </>
                            ) : (
                              <>
                                <i className="bi bi-download me-1"></i>
                                Télécharger le CV
                              </>
                            )}
                          </Button>
                        </div>
                      ) : (
                        <div className="alert alert-warning py-2">
                          <i className="bi bi-exclamation-triangle me-2"></i>
                          <strong>Aucun CV disponible</strong>
                        </div>
                      )}
                    </div>
                  </div>
                </Card.Body>
              </Card>

              {/* lettre de motivation */}
              <Card className="border-warning shadow-sm">
                <Card.Header className="bg-warning text-dark">
                  <h6 className="mb-0">
                    <i className="bi bi-file-text me-2"></i>
                    Lettre de motivation
                  </h6>
                </Card.Header>
                <Card.Body>
                  {application.lettreMotivation ? (
                    <div className="bg-light p-4 rounded border">
                      <div
                        style={{
                          whiteSpace: "pre-wrap",
                          lineHeight: "1.6",
                          fontSize: "1.05rem",
                          maxHeight: "300px",
                          overflowY: "auto",
                        }}
                        className="border-start border-warning border-3 ps-3"
                      >
                        {application.lettreMotivation}
                      </div>
                    </div>
                  ) : (
                    <div className="alert alert-secondary text-center py-4">
                      <i
                        className="bi bi-file-x text-muted"
                        style={{ fontSize: "3rem" }}
                      ></i>
                      <h6 className="mt-3 text-muted">
                        Aucune lettre de motivation fournie
                      </h6>
                    </div>
                  )}
                </Card.Body>
              </Card>

              {canUpdateStatus() && (
                <Card className="border-success shadow-sm">
                  <Card.Header className="bg-success text-white">
                    <h6 className="mb-0">
                      <i className="bi bi-check-square me-2"></i>
                      Décision sur la candidature
                    </h6>
                  </Card.Header>
                  <Card.Body>
                    <div className="text-center">
                      <p className="text-muted mb-4">
                        Quelle est votre décision concernant cette candidature ?
                      </p>
                      <div className="d-flex gap-3 justify-content-center">
                        <Button
                          variant="success"
                          size="lg"
                          onClick={() => handleStatusUpdate("ACCEPTEE")}
                          disabled={updating}
                          className="px-4"
                        >
                          {updating ? (
                            <Spinner
                              animation="border"
                              size="sm"
                              className="me-2"
                            />
                          ) : (
                            <i className="bi bi-check-circle me-2"></i>
                          )}
                          Accepter la candidature
                        </Button>
                        <Button
                          variant="danger"
                          size="lg"
                          onClick={() => handleStatusUpdate("REFUSEE")}
                          disabled={updating}
                          className="px-4"
                        >
                          {updating ? (
                            <Spinner
                              animation="border"
                              size="sm"
                              className="me-2"
                            />
                          ) : (
                            <i className="bi bi-x-circle me-2"></i>
                          )}
                          Refuser la candidature
                        </Button>
                      </div>
                      <div className="mt-4 p-3 bg-light rounded">
                        <small className="text-muted">
                          <i className="bi bi-info-circle me-1"></i>
                          <strong>Important :</strong> Une fois votre décision
                          prise, elle ne pourra plus être modifiée.
                        </small>
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              )}

              {!canUpdateStatus() && application.decision && (
                <Card
                  className={`border-${
                    application.decision === "ACCEPTEE" ? "success" : "danger"
                  } shadow-sm`}
                >
                  <Card.Header
                    className={`bg-${
                      application.decision === "ACCEPTEE" ? "success" : "danger"
                    } text-white`}
                  >
                    <h6 className="mb-0">
                      <i
                        className={`bi ${
                          application.decision === "ACCEPTEE"
                            ? "bi-check-circle"
                            : "bi-x-circle"
                        } me-2`}
                      ></i>
                      Candidature{" "}
                      {application.decision === "ACCEPTEE"
                        ? "acceptée"
                        : "refusée"}
                    </h6>
                  </Card.Header>
                  <Card.Body className="text-center">
                    <p className="mb-0">
                      Cette candidature a été{" "}
                      {application.decision === "ACCEPTEE"
                        ? "acceptée"
                        : "refusée"}
                      .
                    </p>
                  </Card.Body>
                </Card>
              )}
            </div>
          </div>
        )}
      </Modal.Body>

      <Modal.Footer className="bg-light">
        <div className="d-flex justify-content-between w-100 align-items-center">
          <div className="text-muted">
            {application && (
              <small>
                <i className="bi bi-clock me-1"></i>
                Dernière mise à jour : {formatDate(application.datePostulation)}
              </small>
            )}
          </div>
          <Button variant="secondary" onClick={onHide} size="lg">
            <i className="bi bi-x me-1"></i>Fermer
          </Button>
        </div>
      </Modal.Footer>
    </Modal>
  );
};

export default ApplicationDetailsModal;
