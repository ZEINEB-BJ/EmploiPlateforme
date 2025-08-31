import React, { useState, useEffect } from "react";
import {
  Card,
  Badge,
  Button,
  Spinner,
  Alert,
  Row,
  Col,
  ProgressBar,
  ButtonGroup,
  Form,
} from "react-bootstrap";
import matchingService from "../services/matchingService";
import jobService from "../services/JobServices";

const SortedApplications = ({ jobId, onStatusUpdate, showHeader = true }) => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [recalculating, setRecalculating] = useState(false);
  const [jobDetails, setJobDetails] = useState(null);
  const [sortOrder, setSortOrder] = useState("desc");
  const [filterScore, setFilterScore] = useState(0);

  useEffect(() => {
    if (jobId) {
      loadSortedApplications();
      loadJobDetails();
    }
  }, [jobId]);

  const loadJobDetails = async () => {
    try {
      const job = await jobService.getJobById(jobId);
      setJobDetails(job);
    } catch (err) {
      console.error("Erreur chargement détails offre:", err);
    }
  };

  const loadSortedApplications = async () => {
    if (!jobId) return;

    try {
      setLoading(true);
      setError(null);

      const data = await matchingService.getSortedApplicationsForJob(jobId);

      const validApplications = data.filter(
        matchingService.validateSortedApplication
      );
      setApplications(validApplications);
    } catch (err) {
      console.error("Erreur chargement candidatures triées:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRecalculateScores = async () => {
    try {
      setRecalculating(true);
      await matchingService.recalculateMatchingScores();

      await loadSortedApplications();

      if (onStatusUpdate) {
        onStatusUpdate(null, "Scores recalculés avec succès");
      }
    } catch (err) {
      console.error("Erreur recalcul scores:", err);
      setError("Erreur lors du recalcul des scores");
    } finally {
      setRecalculating(false);
    }
  };

  const handleDownloadCV = async (candidatId, candidatNom) => {
    try {
      await jobService.downloadCandidateCV(candidatId);
    } catch (err) {
      console.error("Erreur téléchargement CV:", err);
      if (onStatusUpdate) {
        onStatusUpdate(null, `Erreur: ${err.message}`);
      }
    }
  };

  const handleStatusChange = async (applicationId, newStatus) => {
    try {
      await jobService.updateApplicationStatus(applicationId, newStatus);

      setApplications((prev) =>
        prev.map((app) =>
          app.id === applicationId
            ? { ...app, etat: newStatus, decision: newStatus }
            : app
        )
      );

      if (onStatusUpdate) {
        onStatusUpdate(applicationId, newStatus);
      }
    } catch (err) {
      console.error("Erreur mise à jour statut:", err);
      if (onStatusUpdate) {
        onStatusUpdate(null, `Erreur: ${err.message}`);
      }
    }
  };

  const filteredApplications = applications
    .filter((app) => app.matchingScore >= filterScore)
    .sort((a, b) => {
      if (sortOrder === "desc") {
        return b.matchingScore - a.matchingScore;
      }
      return a.matchingScore - b.matchingScore;
    });

  const getScoreColor = (score) => {
    if (score >= 0.8) return "success";
    if (score >= 0.6) return "warning";
    if (score >= 0.4) return "info";
    return "secondary";
  };

  if (loading) {
    return (
      <Card>
        {showHeader && (
          <Card.Header className="bg-primary text-white">
            <h5 className="mb-0">
              <i className="bi bi-sort-down me-2"></i>Candidatures triées par
              pertinence
            </h5>
          </Card.Header>
        )}
        <Card.Body className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3 text-muted">
            Analyse des candidatures en cours...
          </p>
        </Card.Body>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        {showHeader && (
          <Card.Header className="bg-primary text-white">
            <h5 className="mb-0">
              <i className="bi bi-sort-down me-2"></i>Candidatures triées par
              pertinence
            </h5>
          </Card.Header>
        )}
        <Card.Body>
          <Alert variant="danger">
            <i className="bi bi-exclamation-triangle me-2"></i>
            {error}
            <div className="mt-2">
              <Button
                variant="outline-danger"
                size="sm"
                onClick={loadSortedApplications}
              >
                <i className="bi bi-arrow-clockwise me-1"></i>Réessayer
              </Button>
            </div>
          </Alert>
        </Card.Body>
      </Card>
    );
  }

  return (
    <Card className="h-100">
      {showHeader && (
        <Card.Header className="bg-primary text-white">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h5 className="mb-0">
                <i className="bi bi-sort-down me-2"></i>Candidatures triées par
                pertinence
              </h5>
              {jobDetails && (
                <small className="opacity-75">
                  Pour l'offre: {jobDetails.titre}
                </small>
              )}
            </div>
            <div className="d-flex align-items-center gap-2">
              <Button
                variant="light"
                size="sm"
                onClick={handleRecalculateScores}
                disabled={recalculating}
              >
                {recalculating ? (
                  <>
                    <Spinner animation="border" size="sm" className="me-1" />
                    Recalcul...
                  </>
                ) : (
                  <>
                    <i className="bi bi-calculator me-1"></i>Recalculer
                  </>
                )}
              </Button>
              <Badge bg="light" text="dark">
                {filteredApplications.length} candidature(s)
              </Badge>
            </div>
          </div>
        </Card.Header>
      )}

      <Card.Body>
        <Row className="mb-3">
          <Col md={6}>
            <Form.Group>
              <Form.Label className="small text-muted">
                Trier par score
              </Form.Label>
              <Form.Select
                size="sm"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
              >
                <option value="desc">Meilleurs scores en premier</option>
                <option value="asc">Scores les plus faibles en premier</option>
              </Form.Select>
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group>
              <Form.Label className="small text-muted">
                Score minimum
              </Form.Label>
              <Form.Range
                min={0}
                max={1}
                step={0.1}
                value={filterScore}
                onChange={(e) => setFilterScore(parseFloat(e.target.value))}
              />
              <div className="d-flex justify-content-between small text-muted">
                <span>0%</span>
                <span className="fw-bold">
                  {Math.round(filterScore * 100)}%
                </span>
                <span>100%</span>
              </div>
            </Form.Group>
          </Col>
        </Row>

        {applications.length === 0 ? (
          <div className="text-center py-4">
            <i
              className="bi bi-person-x text-muted"
              style={{ fontSize: "3rem" }}
            ></i>
            <h6 className="text-muted mt-3">Aucune candidature reçue</h6>
            <p className="text-muted small">
              Les candidatures avec scores de matching apparaîtront ici
            </p>
          </div>
        ) : filteredApplications.length === 0 ? (
          <div className="text-center py-4">
            <i
              className="bi bi-funnel text-muted"
              style={{ fontSize: "3rem" }}
            ></i>
            <h6 className="text-muted mt-3">
              Aucune candidature ne correspond aux filtres
            </h6>
            <p className="text-muted small">
              Réduisez le score minimum pour voir plus de candidatures
            </p>
            <Button
              variant="outline-primary"
              size="sm"
              onClick={() => setFilterScore(0)}
            >
              Réinitialiser les filtres
            </Button>
          </div>
        ) : (
          <div className="d-grid gap-3">
            {filteredApplications.map((application, index) => {
              const candidate = application.candidat;
              const score = application.matchingScore;
              const scorePercent = Math.round(score * 100);

              return (
                <Card
                  key={application.id}
                  className={`border-start border-3 ${
                    score >= 0.8
                      ? "border-success"
                      : score >= 0.6
                      ? "border-warning"
                      : score >= 0.4
                      ? "border-info"
                      : "border-secondary"
                  }`}
                >
                  <Card.Body>
                    <Row className="align-items-center">
                      <Col lg={6}>
                        <div className="d-flex align-items-center">
                          <div
                            className={`rounded-circle d-flex align-items-center justify-content-center me-3 ${
                              score >= 0.8
                                ? "bg-success"
                                : score >= 0.6
                                ? "bg-warning"
                                : score >= 0.4
                                ? "bg-info"
                                : "bg-secondary"
                            }`}
                            style={{ width: "50px", height: "50px" }}
                          >
                            <i className="bi bi-person text-white fs-4"></i>
                          </div>

                          <div className="flex-grow-1">
                            <div className="d-flex align-items-center mb-1">
                              <h6 className="mb-0 me-2">
                                {candidate?.prenom} {candidate?.nom}
                              </h6>
                              <Badge bg={getScoreColor(score)} className="me-2">
                                #{index + 1}
                              </Badge>
                            </div>

                            <p className="text-muted small mb-1">
                              <i className="bi bi-envelope me-1"></i>
                              {candidate?.email}
                            </p>

                            {candidate?.fonctionActuelle && (
                              <p className="text-muted small mb-1">
                                <i className="bi bi-briefcase me-1"></i>
                                {candidate.fonctionActuelle}
                              </p>
                            )}

                            <p className="text-muted small mb-0">
                              <i className="bi bi-calendar me-1"></i>
                              Postulé le{" "}
                              {new Date(
                                application.datePostulation
                              ).toLocaleDateString("fr-FR")}
                            </p>
                          </div>
                        </div>
                      </Col>

                      <Col lg={3}>
                        <div className="text-center">
                          <div className="mb-2">
                            <Badge
                              bg={getScoreColor(score)}
                              className="fs-6 px-3 py-2"
                            >
                              <i className="bi bi-star-fill me-1"></i>
                              {matchingService.formatMatchingScore(score)}
                            </Badge>
                          </div>

                          <ProgressBar
                            now={scorePercent}
                            variant={getScoreColor(score)}
                            className="mb-2"
                            style={{ height: "8px" }}
                          />

                          <small className="text-muted d-block">
                            {matchingService.getScoreDescription(score)}
                          </small>
                        </div>
                      </Col>

                      <Col lg={3}>
                        <div className="d-flex flex-column gap-2">
                          <div className="text-center">
                            <Badge
                              bg={
                                application.etat === "ACCEPTEE"
                                  ? "success"
                                  : application.etat === "REFUSEE"
                                  ? "danger"
                                  : "warning"
                              }
                            >
                              {application.etat === "ACCEPTEE"
                                ? "Acceptée"
                                : application.etat === "REFUSEE"
                                ? "Refusée"
                                : "En attente"}
                            </Badge>
                          </div>

                          <ButtonGroup size="sm">
                            {application.etat === "EN_ATTENTE" && (
                              <>
                                <Button
                                  variant="success"
                                  onClick={() =>
                                    handleStatusChange(
                                      application.id,
                                      "ACCEPTEE"
                                    )
                                  }
                                  title="Accepter la candidature"
                                >
                                  <i className="bi bi-check-lg"></i>
                                </Button>
                                <Button
                                  variant="danger"
                                  onClick={() =>
                                    handleStatusChange(
                                      application.id,
                                      "REFUSEE"
                                    )
                                  }
                                  title="Refuser la candidature"
                                >
                                  <i className="bi bi-x-lg"></i>
                                </Button>
                              </>
                            )}
                          </ButtonGroup>

                          {candidate?.cvPath && (
                            <Button
                              variant="outline-primary"
                              size="sm"
                              onClick={() =>
                                handleDownloadCV(
                                  candidate.id,
                                  `${candidate.prenom}_${candidate.nom}`
                                )
                              }
                            >
                              <i className="bi bi-download me-1"></i>CV
                            </Button>
                          )}
                        </div>
                      </Col>
                    </Row>

                    <Row className="mt-3 pt-3 border-top">
                      <Col md={4}>
                        <small className="text-muted">
                          <i className="bi bi-card-text me-1"></i>
                          CIN: {candidate?.cin || "Non spécifié"}
                        </small>
                      </Col>
                      <Col md={4}>
                        <small className="text-muted">
                          <i className="bi bi-clock me-1"></i>
                          Postulé:{" "}
                          {new Date(
                            application.datePostulation
                          ).toLocaleDateString("fr-FR")}
                        </small>
                      </Col>
                      <Col md={4}>
                        <small
                          className={
                            candidate?.cvPath ? "text-success" : "text-warning"
                          }
                        >
                          <i
                            className={`bi ${
                              candidate?.cvPath ? "bi-file-check" : "bi-file-x"
                            } me-1`}
                          ></i>
                          CV: {candidate?.cvPath ? "Disponible" : "Non fourni"}
                        </small>
                      </Col>
                    </Row>

                    <div className="mt-3 p-2 bg-light rounded">
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <small className="fw-bold text-muted">
                          Score de compatibilité
                        </small>
                        <Badge bg={getScoreColor(score)} className="fs-7">
                          {scorePercent}% de match
                        </Badge>
                      </div>
                      <ProgressBar className="mb-1" style={{ height: "6px" }}>
                        <ProgressBar
                          variant={getScoreColor(score)}
                          now={scorePercent}
                          key={1}
                        />
                      </ProgressBar>
                      <small className="text-muted">
                        Basé sur l'analyse du CV et des compétences requises
                      </small>
                    </div>
                  </Card.Body>
                </Card>
              );
            })}
          </div>
        )}

        {filteredApplications.length > 0 && (
          <div className="mt-4 p-3 bg-light rounded">
            <h6 className="text-muted mb-3">
              <i className="bi bi-graph-up me-2"></i>Analyse des scores
            </h6>
            <Row className="text-center">
              <Col>
                <div className="text-success fs-5 fw-bold">
                  {
                    filteredApplications.filter(
                      (app) => app.matchingScore >= 0.8
                    ).length
                  }
                </div>
                <small className="text-muted">Excellents matchs (≥80%)</small>
              </Col>
              <Col>
                <div className="text-warning fs-5 fw-bold">
                  {
                    filteredApplications.filter(
                      (app) =>
                        app.matchingScore >= 0.6 && app.matchingScore < 0.8
                    ).length
                  }
                </div>
                <small className="text-muted">Bons matchs (60-79%)</small>
              </Col>
              <Col>
                <div className="text-info fs-5 fw-bold">
                  {
                    filteredApplications.filter(
                      (app) =>
                        app.matchingScore >= 0.4 && app.matchingScore < 0.6
                    ).length
                  }
                </div>
                <small className="text-muted">Matchs moyens (40-59%)</small>
              </Col>
              <Col>
                <div className="text-secondary fs-5 fw-bold">
                  {
                    filteredApplications.filter(
                      (app) => app.matchingScore < 0.4
                    ).length
                  }
                </div>
                <small className="text-muted">Matchs faibles(&lt;40%)</small>
              </Col>
            </Row>
          </div>
        )}
      </Card.Body>
    </Card>
  );
};

export default SortedApplications;
