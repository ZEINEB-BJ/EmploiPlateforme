import React, { useState, useEffect } from "react";
import { Card, Badge, Button, Spinner, Alert, Row, Col } from "react-bootstrap";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import matchingService from "../services/matchingService";

const RecommendedJobs = ({ limit = 5, showHeader = true }) => {
  const { currentUser } = useAuth();
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (currentUser?.id) {
      loadRecommendations();
    }
  }, [currentUser]);

  const loadRecommendations = async () => {
    if (!currentUser?.id) return;

    try {
      setLoading(true);
      setError(null);

      const data = await matchingService.getCachedRecommendations(
        currentUser.id,
        limit
      );

      const validRecommendations = data.filter(
        matchingService.validateRecommendation
      );
      setRecommendations(validRecommendations);
    } catch (err) {
      console.error("Erreur lors du chargement des recommandations:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    matchingService.clearRecommendationsCache();
    loadRecommendations();
  };

  if (loading) {
    return (
      <Card>
        {showHeader && (
          <Card.Header className="bg-info text-white">
            <h5 className="mb-0">
              <i className="bi bi-star me-2"></i>Offres recommandées pour vous
            </h5>
          </Card.Header>
        )}
        <Card.Body className="text-center py-5">
          <Spinner animation="border" variant="info" />
          <p className="mt-3 text-muted">Analyse de votre profil en cours...</p>
        </Card.Body>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        {showHeader && (
          <Card.Header className="bg-info text-white">
            <h5 className="mb-0">
              <i className="bi bi-star me-2"></i>Offres recommandées pour vous
            </h5>
          </Card.Header>
        )}
        <Card.Body>
          <Alert variant="warning">
            <i className="bi bi-exclamation-triangle me-2"></i>
            {error}
            <div className="mt-2">
              <Button
                variant="outline-warning"
                size="sm"
                onClick={handleRefresh}
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
        <Card.Header className="bg-info text-white d-flex justify-content-between align-items-center">
          <h5 className="mb-0">
            <i className="bi bi-star me-2"></i>Offres recommandées pour vous
          </h5>
          <div>
            <Button
              variant="light"
              size="sm"
              onClick={handleRefresh}
              className="me-2"
            >
              <i className="bi bi-arrow-clockwise me-1"></i>Actualiser
            </Button>
            <Badge bg="light" text="dark">
              {recommendations.length} trouvée(s)
            </Badge>
          </div>
        </Card.Header>
      )}

      <Card.Body>
        {recommendations.length === 0 ? (
          <div className="text-center py-4">
            <i
              className="bi bi-search text-muted"
              style={{ fontSize: "3rem" }}
            ></i>
            <h6 className="text-muted mt-3">
              Aucune recommandation disponible
            </h6>
            <p className="text-muted small">
              Assurez-vous d'avoir uploadé votre CV pour recevoir des
              recommandations personnalisées
            </p>
            <Button variant="primary" onClick={() => window.location.reload()}>
              <i className="bi bi-upload me-1"></i>Aller au profil
            </Button>
          </div>
        ) : (
          <div className="d-grid gap-3">
            {recommendations.map((recommendation, index) => {
              const job = recommendation.offre;
              const score = recommendation.score;

              return (
                <Card
                  key={job.idOffre}
                  className={`border-start border-3 ${
                    score >= 0.8
                      ? "border-success"
                      : score >= 0.6
                      ? "border-warning"
                      : "border-info"
                  } hover-shadow`}
                  style={{ transition: "all 0.2s ease" }}
                >
                  <Card.Body>
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <div className="flex-grow-1">
                        <div className="d-flex align-items-center mb-2">
                          <h6 className="mb-0 me-2">{job.titre}</h6>
                          <Badge bg={matchingService.getScoreVariant(score)}>
                            <i className="bi bi-star-fill me-1"></i>
                            {matchingService.formatMatchingScore(score)}
                          </Badge>
                        </div>

                        <p className="text-muted small mb-2">
                          <i className="bi bi-building me-1"></i>
                          {job.employeur?.nomEntreprise || "Entreprise"}
                        </p>

                        <p className="text-muted small mb-2">
                          <i className="bi bi-geo-alt me-1"></i>
                          {job.localisation}
                        </p>

                        {job.description && (
                          <p className="text-muted small mb-3">
                            {job.description.length > 120
                              ? `${job.description.substring(0, 120)}...`
                              : job.description}
                          </p>
                        )}

                        <div className="d-flex align-items-center text-muted small">
                          <span className="me-3">
                            <i className="bi bi-calendar me-1"></i>
                            Publié le{" "}
                            {new Date(job.datePublication).toLocaleDateString(
                              "fr-FR"
                            )}
                          </span>
                          <span className="me-3">
                            <i className="bi bi-clock me-1"></i>
                            Expire le{" "}
                            {new Date(job.dateExpiration).toLocaleDateString(
                              "fr-FR"
                            )}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="d-flex justify-content-between align-items-center">
                      <div className="d-flex align-items-center">
                        <small className="text-muted me-2">
                          Match basé sur votre CV
                        </small>
                        <Badge bg="light" text="dark" className="border">
                          {matchingService.getScoreDescription(score)}
                        </Badge>
                      </div>

                      <div className="d-flex gap-2">
                        <Link
                          to={`/job/${job.idOffre}`}
                          className="btn btn-outline-primary btn-sm"
                        >
                          <i className="bi bi-eye me-1"></i>Voir détails
                        </Link>
                        <Link
                          to={`/job/${job.idOffre}?apply=true`}
                          className="btn btn-primary btn-sm"
                        >
                          <i className="bi bi-send me-1"></i>Postuler
                        </Link>
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              );
            })}
          </div>
        )}

        {recommendations.length > 0 && (
          <div className="mt-3 text-center">
            <small className="text-muted">
              <i className="bi bi-info-circle me-1"></i>
              Recommandations basées sur l'analyse de votre CV et vos
              compétences
            </small>
          </div>
        )}
      </Card.Body>
    </Card>
  );
};

export default RecommendedJobs;
