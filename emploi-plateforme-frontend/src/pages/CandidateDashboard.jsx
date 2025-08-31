import React, { useState, useEffect } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Table,
  Badge,
  Nav,
  Alert,
  Spinner,
  Form,
  Modal,
} from "react-bootstrap";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import jobService from "../services/JobServices";
import EditProfileModal from "../components/EditProfileModal";
import CVManager from "../components/CVManager";
import matchingService from "../services/matchingService";
import RecommendedJobs from "../components/RecommendedJobs";

const CandidateDashboard = () => {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [applications, setApplications] = useState([]);
  const [availableJobs, setAvailableJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showEditProfile, setShowEditProfile] = useState(false);

  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [withdrawing, setWithdrawing] = useState(false);

  const [stats, setStats] = useState({
    totalApplications: 0,
    pendingApplications: 0,
    acceptedApplications: 0,
    rejectedApplications: 0,
  });

  const [recommendations, setRecommendations] = useState([]);
  const [recommendationsLoading, setRecommendationsLoading] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Charger les candidatures du candidat
      const applicationsData = await jobService.getCandidateApplications();
      setApplications(applicationsData);

      // Charger les offres disponibles
      const jobsData = await jobService.getJobs(0, 6);
      setAvailableJobs(jobsData.content || jobsData);

      // Calculer les statistiques
      const totalApplications = applicationsData.length;
      const pendingApplications = applicationsData.filter(
        (app) => app.etat === "EN_ATTENTE"
      ).length;
      const acceptedApplications = applicationsData.filter(
        (app) => app.etat === "ACCEPTEE"
      ).length;
      const rejectedApplications = applicationsData.filter(
        (app) => app.etat === "REFUSEE"
      ).length;

      setStats({
        totalApplications,
        pendingApplications,
        acceptedApplications,
        rejectedApplications,
      });

      if (currentUser?.id) {
        try {
          setRecommendationsLoading(true);
          const recommendationsData =
            await matchingService.getTopCandidateRecommendations(
              currentUser.id,
              3
            );
          setRecommendations(recommendationsData);
        } catch (error) {
          console.error("Erreur recommandations:", error);
        } finally {
          setRecommendationsLoading(false);
        }
      }
    } catch (error) {
      console.error("Erreur lors du chargement du dashboard:", error);
      setFeedback("Erreur lors du chargement des données.");
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdated = (message) => {
    setFeedback(message);
    setTimeout(() => setFeedback(null), 3000);
  };

  //  gérer le retrait de candidature
  const handleWithdrawApplication = async () => {
    if (!selectedApplication) return;

    try {
      setWithdrawing(true);
      await jobService.withdrawApplication(selectedApplication.id);

      setFeedback("Candidature retirée avec succès");
      setShowWithdrawModal(false);
      setSelectedApplication(null);

      // Recharger les données
      await loadDashboardData();
    } catch (error) {
      console.error("Erreur lors du retrait:", error);
      setFeedback(
        error.response?.data || "Erreur lors du retrait de la candidature"
      );
    } finally {
      setWithdrawing(false);
    }
  };

  const openWithdrawModal = (application) => {
    setSelectedApplication(application);
    setShowWithdrawModal(true);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("fr-FR");
  };

  const getStatusBadge = (etat) => {
    const statusConfig = {
      EN_ATTENTE: { variant: "warning", text: "En attente" },
      ACCEPTEE: { variant: "success", text: "Acceptée" },
      REFUSEE: { variant: "danger", text: "Refusée" },
    };

    const config = statusConfig[etat] || { variant: "secondary", text: etat };
    return <Badge bg={config.variant}>{config.text}</Badge>;
  };

  const getJobStatusBadge = (etat) => {
    const statusConfig = {
      ACTIVE: "success",
      EXPIREE: "warning",
      SUPPRIMEE: "danger",
    };

    const variant = statusConfig[etat] || "secondary";
    return <Badge bg={variant}>{etat}</Badge>;
  };

  //  vérifier si une candidature peut être retirée
  const canWithdrawApplication = (application) => {
    return application.etat === "EN_ATTENTE";
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
      {/* header */}
      <Row className="mb-4">
        <Col>
          <h1 className="display-5 fw-bold text-primary">
            Bienvenue, {currentUser?.prenom} {currentUser?.nom}
          </h1>
          <p className="lead text-muted">
            Suivez vos candidatures et découvrez de nouvelles opportunités
          </p>
        </Col>
      </Row>

      {feedback && (
        <Row className="mb-4">
          <Col>
            <Alert
              variant={feedback.includes("Erreur") ? "danger" : "success"}
              dismissible
              onClose={() => setFeedback(null)}
            >
              {feedback}
            </Alert>
          </Col>
        </Row>
      )}

      <Row className="mb-4">
        <Col>
          <Nav variant="tabs" activeKey={activeTab} onSelect={setActiveTab}>
            <Nav.Item>
              <Nav.Link eventKey="overview">Vue d'ensemble</Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link eventKey="applications">Mes candidatures</Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link eventKey="jobs">Offres disponibles</Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link eventKey="profile">Mon profil</Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link eventKey="cv">Mon CV</Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link eventKey="recommendations">
                <i className="bi bi-star me-1"></i>Recommandations
                <Badge bg="info" className="ms-2">
                  {recommendations.length}
                </Badge>
              </Nav.Link>
            </Nav.Item>
          </Nav>
        </Col>
      </Row>

      {activeTab === "overview" && (
        <>
          {/* stat */}
          <Row className="mb-4">
            <Col md={3}>
              <Card className="text-center border-primary">
                <Card.Body>
                  <div className="text-primary mb-2">
                    <i className="bi bi-file-text fs-1"></i>
                  </div>
                  <Card.Title className="text-primary">
                    {stats.totalApplications}
                  </Card.Title>
                  <Card.Text className="text-muted">
                    Total candidatures
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="text-center border-warning">
                <Card.Body>
                  <div className="text-warning mb-2">
                    <i className="bi bi-clock fs-1"></i>
                  </div>
                  <Card.Title className="text-warning">
                    {stats.pendingApplications}
                  </Card.Title>
                  <Card.Text className="text-muted">En attente</Card.Text>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="text-center border-success">
                <Card.Body>
                  <div className="text-success mb-2">
                    <i className="bi bi-check-circle fs-1"></i>
                  </div>
                  <Card.Title className="text-success">
                    {stats.acceptedApplications}
                  </Card.Title>
                  <Card.Text className="text-muted">Acceptées</Card.Text>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="text-center border-danger">
                <Card.Body>
                  <div className="text-danger mb-2">
                    <i className="bi bi-x-circle fs-1"></i>
                  </div>
                  <Card.Title className="text-danger">
                    {stats.rejectedApplications}
                  </Card.Title>
                  <Card.Text className="text-muted">Refusées</Card.Text>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/*  candidatures recentes & offrs dispo */}
          <Row>
            <Col lg={6}>
              <Card className="h-100">
                <Card.Header className="d-flex justify-content-between align-items-center">
                  <h5 className="mb-0">Candidatures récentes</h5>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setActiveTab("applications")}
                  >
                    Voir toutes
                  </Button>
                </Card.Header>
                <Card.Body>
                  {applications.length === 0 ? (
                    <p className="text-muted text-center py-4">
                      Aucune candidature pour le moment
                    </p>
                  ) : (
                    <div className="d-grid gap-3">
                      {applications.slice(0, 3).map((application) => (
                        <Card
                          key={application.id}
                          className="border-start border-primary border-3"
                        >
                          <Card.Body className="py-3">
                            <div className="d-flex justify-content-between align-items-start">
                              <div>
                                <h6 className="mb-1">
                                  {application.offre.titre}
                                </h6>
                                <small className="text-muted d-block">
                                  {application.offre.employeur.nomEntreprise}
                                </small>
                                <small className="text-muted">
                                  Postulé le{" "}
                                  {formatDate(application.datePostulation)}
                                </small>
                              </div>
                              <div className="d-flex flex-column gap-1">
                                {getStatusBadge(application.etat)}
                                {canWithdrawApplication(application) && (
                                  <Button
                                    variant="outline-danger"
                                    size="sm"
                                    onClick={() =>
                                      openWithdrawModal(application)
                                    }
                                  >
                                    Retirer
                                  </Button>
                                )}
                              </div>
                            </div>
                          </Card.Body>
                        </Card>
                      ))}
                    </div>
                  )}
                </Card.Body>
              </Card>
            </Col>

            <Col lg={6}>
              <RecommendedJobs limit={3} showHeader={true} />
            </Col>
          </Row>
        </>
      )}

      {activeTab === "applications" && (
        <Card>
          <Card.Header>
            <h5 className="mb-0">Mes Candidatures</h5>
            <small className="text-muted">
              {applications.length} candidature(s)
            </small>
          </Card.Header>
          <Card.Body>
            {applications.length === 0 ? (
              <div className="text-center py-5">
                <p className="text-muted">Aucune candidature pour le moment.</p>
                <Button variant="primary" onClick={() => setActiveTab("jobs")}>
                  Découvrir les offres
                </Button>
              </div>
            ) : (
              <Table responsive hover>
                <thead className="table-light">
                  <tr>
                    <th>Poste</th>
                    <th>Entreprise</th>
                    <th>Localisation</th>
                    <th>Date Candidature</th>
                    <th>Statut</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {applications.map((application) => (
                    <tr key={application.id}>
                      <td className="fw-semibold">{application.offre.titre}</td>
                      <td>{application.offre.employeur.nomEntreprise}</td>
                      <td>{application.offre.localisation}</td>
                      <td>{formatDate(application.datePostulation)}</td>
                      <td>{getStatusBadge(application.etat)}</td>
                      <td>
                        <div className="d-flex gap-2">
                          <Link
                            to={`/job/${application.offre.idOffre}`}
                            className="btn btn-outline-primary btn-sm"
                          >
                            Voir l'offre
                          </Link>
                          {canWithdrawApplication(application) && (
                            <Button
                              variant="outline-danger"
                              size="sm"
                              onClick={() => openWithdrawModal(application)}
                            >
                              <i className="bi bi-trash me-1"></i>
                              Retirer
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </Card.Body>
        </Card>
      )}

      {activeTab === "jobs" && (
        <Card>
          <Card.Header className="d-flex justify-content-between align-items-center">
            <div>
              <h5 className="mb-0">Offres d'Emploi Disponibles</h5>
              <small className="text-muted">
                {availableJobs.length} offre(s) disponible(s)
              </small>
            </div>
            <Link to="/" className="btn btn-primary">
              Recherche avancée
            </Link>
          </Card.Header>
          <Card.Body>
            <Form.Control
              type="text"
              placeholder="Rechercher une offre par titre..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="mb-3"
            />

            {availableJobs.length === 0 ? (
              <p className="text-center py-5 text-muted">
                Aucune offre disponible pour le moment.
              </p>
            ) : (
              <Row>
                {availableJobs
                  .filter((job) =>
                    job.titre.toLowerCase().includes(searchTerm.toLowerCase())
                  )
                  .map((job) => (
                    <Col md={6} lg={4} key={job.idOffre} className="mb-3">
                      <Card className="h-100 border-primary">
                        <Card.Body>
                          <div className="d-flex justify-content-between align-items-start mb-2">
                            <h6 className="card-title">{job.titre}</h6>
                            {getJobStatusBadge(job.etat)}
                          </div>
                          <p className="text-muted small mb-2">
                            {job.employeur?.nomEntreprise || "Entreprise"}
                          </p>
                          <p className="text-muted small mb-2">
                            📍 {job.localisation}
                          </p>
                          <p className="card-text small">
                            {job.description?.substring(0, 100)}...
                          </p>
                          <div className="d-flex gap-2">
                            <Link
                              to={`/job/${job.idOffre}`}
                              className="btn btn-outline-primary btn-sm flex-grow-1"
                            >
                              Voir détails
                            </Link>
                            <Link to="/" className="btn btn-primary btn-sm">
                              Rechercher
                            </Link>
                          </div>
                        </Card.Body>
                      </Card>
                    </Col>
                  ))}
              </Row>
            )}
          </Card.Body>
        </Card>
      )}

      {/* profile  */}
      {activeTab === "profile" && (
        <Row>
          <Col md={8} className="mx-auto">
            <Card>
              <Card.Header className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0">Mon Profil</h5>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setShowEditProfile(true)}
                >
                  <i className="bi bi-pencil me-1"></i>
                  Modifier
                </Button>
              </Card.Header>
              <Card.Body>
                <Row>
                  <Col md={6}>
                    <div className="mb-3">
                      <strong>Prénom:</strong>
                      <p className="text-muted">{currentUser?.prenom}</p>
                    </div>
                  </Col>
                  <Col md={6}>
                    <div className="mb-3">
                      <strong>Nom:</strong>
                      <p className="text-muted">{currentUser?.nom}</p>
                    </div>
                  </Col>
                </Row>
                <div className="mb-3">
                  <strong>Email:</strong>
                  <p className="text-muted">{currentUser?.email}</p>
                </div>
                <Row>
                  <Col md={6}>
                    <div className="mb-3">
                      <strong>CIN:</strong>
                      <p className="text-muted">{currentUser?.cin}</p>
                    </div>
                  </Col>
                  <Col md={6}>
                    <div className="mb-3">
                      <strong>Fonction actuelle:</strong>
                      <p className="text-muted">
                        {currentUser?.fonctionActuelle || "Non spécifiée"}
                      </p>
                    </div>
                  </Col>
                </Row>
                <div className="mb-3">
                  <strong>Rôle:</strong>
                  <Badge bg="info" className="ms-2">
                    {currentUser?.role || "Candidat"}
                  </Badge>
                </div>
                <div className="mb-3">
                  <strong>CV:</strong>
                  <p className="text-muted">
                    {currentUser?.cvPath ? (
                      <span className="text-success">
                        <i className="bi bi-check-circle me-1"></i>
                        CV disponible
                      </span>
                    ) : (
                      <span className="text-warning">
                        <i className="bi bi-exclamation-triangle me-1"></i>
                        Aucun CV uploadé
                      </span>
                    )}
                  </p>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      {/* CV  */}
      {activeTab === "cv" && (
        <Row>
          <Col md={8} className="mx-auto">
            <CVManager onFeedback={handleProfileUpdated} />
          </Col>
        </Row>
      )}

      {activeTab === "recommendations" && (
        <Row>
          <Col>
            <RecommendedJobs limit={10} showHeader={true} />
          </Col>
        </Row>
      )}

      <Modal
        show={showWithdrawModal}
        onHide={() => setShowWithdrawModal(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Confirmer le retrait</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="text-center">
            <i className="bi bi-exclamation-triangle text-warning fs-1 mb-3"></i>
            <h5>Êtes-vous sûr de vouloir retirer cette candidature ?</h5>
            {selectedApplication && (
              <div className="mt-3 p-3 bg-light rounded">
                <strong>Poste :</strong> {selectedApplication.offre.titre}
                <br />
                <strong>Entreprise :</strong>{" "}
                {selectedApplication.offre.employeur.nomEntreprise}
                <br />
                <strong>Date de candidature :</strong>{" "}
                {formatDate(selectedApplication.datePostulation)}
              </div>
            )}
            <p className="text-muted mt-3">
              Cette action est irréversible. Vous devrez postuler à nouveau si
              vous changez d'avis.
            </p>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowWithdrawModal(false)}
            disabled={withdrawing}
          >
            Annuler
          </Button>
          <Button
            variant="danger"
            onClick={handleWithdrawApplication}
            disabled={withdrawing}
          >
            {withdrawing ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Retrait...
              </>
            ) : (
              <>
                <i className="bi bi-trash me-1"></i>
                Confirmer le retrait
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Edit Profile Modal */}
      <EditProfileModal
        show={showEditProfile}
        onHide={() => setShowEditProfile(false)}
        onProfileUpdated={handleProfileUpdated}
      />
    </Container>
  );
};

export default CandidateDashboard;
