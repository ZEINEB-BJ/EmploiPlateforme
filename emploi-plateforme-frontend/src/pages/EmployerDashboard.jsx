import React, { useState, useEffect } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Modal,
  Form,
  Table,
  Badge,
  Nav,
  Alert,
  Spinner,
} from "react-bootstrap";
import { useAuth } from "../context/AuthContext";
import jobService from "../services/JobServices";
import EditProfileModal from "../components/EditProfileModal";
import ApplicationDetailsModal from "../components/ApplicationDetailsModal";

import matchingService from "../services/matchingService";
import SortedApplications from "../components/SortedApplications";
import JobApplicationsManager from "../components/JobApplicationsManager";

const EmployerDashboard = () => {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [showJobForm, setShowJobForm] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showApplicationDetails, setShowApplicationDetails] = useState(false);
  const [selectedApplicationId, setSelectedApplicationId] = useState(null);
  const [editingJob, setEditingJob] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [applicationSearchTerm, setApplicationSearchTerm] = useState("");
  const [formData, setFormData] = useState({
    titre: "",
    description: "",
    localisation: "",
    dateExpiration: "",
  });
  const [formError, setFormError] = useState("");

  const [stats, setStats] = useState({
    totalJobs: 0,
    activeJobs: 0,
    totalApplications: 0,
    pendingApplications: 0,
    acceptedApplications: 0,
    rejectedApplications: 0,
  });

  const [showJobApplications, setShowJobApplications] = useState(false);
  const [selectedJobForApplications, setSelectedJobForApplications] =
    useState(null);
  const [matchingStats, setMatchingStats] = useState({
    excellentMatches: 0,
    goodMatches: 0,
    averageMatches: 0,
    poorMatches: 0,
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Charger les offres de l'employeur
      const jobsData = await jobService.getEmployerJobs();
      setJobs(jobsData);

      // Charger les candidatures pour toutes les offres
      let allApplications = [];
      for (const job of jobsData) {
        try {
          const jobApplications = await jobService.getJobApplications(
            job.idOffre
          );

          const enrichedApplications = jobApplications.map((app) => ({
            ...app,
            jobTitle: job.titre,
            jobLocation: job.localisation,
          }));
          allApplications = [...allApplications, ...enrichedApplications];
        } catch (error) {
          console.log(`Pas de candidatures pour l'offre ${job.idOffre}`);
        }
      }
      setApplications(allApplications);

      // Calculer les statistiques
      const totalJobs = jobsData.length;
      const activeJobs = jobsData.filter((job) => job.etat === "ACTIVE").length;
      const totalApplications = allApplications.length;
      const pendingApplications = allApplications.filter(
        (app) => app.etat === "EN_ATTENTE"
      ).length;
      const acceptedApplications = allApplications.filter(
        (app) => app.etat === "ACCEPTEE"
      ).length;
      const rejectedApplications = allApplications.filter(
        (app) => app.etat === "REFUSEE"
      ).length;

      setStats({
        totalJobs,
        activeJobs,
        totalApplications,
        pendingApplications,
        acceptedApplications,
        rejectedApplications,
      });

      let totalExcellent = 0,
        totalGood = 0,
        totalAverage = 0,
        totalPoor = 0;

      for (const job of jobsData) {
        try {
          const sortedApps = await matchingService.getSortedApplicationsForJob(
            job.idOffre
          );

          totalExcellent += sortedApps.filter(
            (app) => app.matchingScore >= 0.8
          ).length;
          totalGood += sortedApps.filter(
            (app) => app.matchingScore >= 0.6 && app.matchingScore < 0.8
          ).length;
          totalAverage += sortedApps.filter(
            (app) => app.matchingScore >= 0.4 && app.matchingScore < 0.6
          ).length;
          totalPoor += sortedApps.filter(
            (app) => app.matchingScore < 0.4
          ).length;
        } catch (error) {
          console.log(`Pas de scores pour l'offre ${job.idOffre}`);
        }
      }

      setMatchingStats({
        excellentMatches: totalExcellent,
        goodMatches: totalGood,
        averageMatches: totalAverage,
        poorMatches: totalPoor,
      });
    } catch (error) {
      console.error("Erreur lors du chargement du dashboard:", error);
      setFeedback("Erreur lors du chargement des données");
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdated = (message) => {
    setFeedback(message);
    setTimeout(() => setFeedback(null), 3000);
  };

  const handleShowApplicationDetails = (applicationId) => {
    setSelectedApplicationId(applicationId);
    setShowApplicationDetails(true);
  };

  const handleCloseApplicationDetails = () => {
    setShowApplicationDetails(false);
    setSelectedApplicationId(null);
  };

  const handleApplicationStatusUpdate = (applicationId, newStatus) => {
    // mettre à jour la liste locale des candidatures
    setApplications((prevApplications) =>
      prevApplications.map((app) =>
        app.id === applicationId
          ? {
              ...app,
              decision: newStatus,
              etat: newStatus === "ACCEPTEE" ? "ACCEPTEE" : "REFUSEE",
            }
          : app
      )
    );

    const updatedApplications = applications.map((app) =>
      app.id === applicationId
        ? {
            ...app,
            decision: newStatus,
            etat: newStatus === "ACCEPTEE" ? "ACCEPTEE" : "REFUSEE",
          }
        : app
    );

    const pendingApplications = updatedApplications.filter(
      (app) => app.etat === "EN_ATTENTE"
    ).length;
    const acceptedApplications = updatedApplications.filter(
      (app) => app.etat === "ACCEPTEE"
    ).length;
    const rejectedApplications = updatedApplications.filter(
      (app) => app.etat === "REFUSEE"
    ).length;

    setStats((prevStats) => ({
      ...prevStats,
      pendingApplications,
      acceptedApplications,
      rejectedApplications,
    }));

    setFeedback(
      `Candidature ${
        newStatus === "ACCEPTEE" ? "acceptée" : "refusée"
      } avec succès`
    );
    setTimeout(() => setFeedback(null), 3000);
  };

  const handleShowJobForm = (job = null) => {
    setFormError("");
    if (job) {
      setEditingJob(job);
      setFormData({
        titre: job.titre,
        description: job.description,
        localisation: job.localisation,
        dateExpiration: job.dateExpiration,
      });
    } else {
      setEditingJob(null);
      setFormData({
        titre: "",
        description: "",
        localisation: "",
        dateExpiration: "",
      });
    }
    setShowJobForm(true);
  };

  const handleCloseJobForm = () => {
    setShowJobForm(false);
    setEditingJob(null);
    setFormError("");
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    const today = new Date();
    const expiration = new Date(formData.dateExpiration);

    if (expiration <= today) {
      setFormError("La date d'expiration doit être ultérieure à aujourd'hui.");
      return;
    }

    try {
      if (editingJob) {
        await jobService.updateJob(editingJob.idOffre, formData);
        setFeedback("Offre modifiée avec succès !");
      } else {
        await jobService.createJob(formData);
        setFeedback("Offre ajoutée avec succès !");
      }
      handleCloseJobForm();
      loadDashboardData();
      setTimeout(() => setFeedback(null), 3000);
    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error);
      setFormError("Erreur lors de l'enregistrement de l'offre.");
    }
  };

  const handleJobDelete = async (jobId) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cette offre ?")) {
      try {
        await jobService.deleteJob(jobId);
        setFeedback("Offre supprimée.");
        loadDashboardData();
        setTimeout(() => setFeedback(null), 3000);
      } catch (error) {
        console.error("Erreur lors de la suppression:", error);
      }
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("fr-FR");
  };

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getRemainingDays = (dateExpiration) => {
    const now = new Date();
    const exp = new Date(dateExpiration);
    const diff = Math.ceil((exp - now) / (1000 * 60 * 60 * 24));
    return diff >= 0 ? `${diff} jour(s)` : "Expirée";
  };

  const getStatusBadge = (status, decision = null) => {
    const actualStatus = decision || status;

    const statusConfig = {
      ACTIVE: "success",
      EXPIREE: "warning",
      SUPPRIMEE: "danger",
      EN_ATTENTE: "warning",
      ACCEPTEE: "success",
      REFUSEE: "danger",
    };

    const statusLabels = {
      ACTIVE: "Active",
      EXPIREE: "Expirée",
      SUPPRIMEE: "Supprimée",
      EN_ATTENTE: "En attente",
      ACCEPTEE: "Acceptée",
      REFUSEE: "Refusée",
    };

    const variant = statusConfig[actualStatus] || "secondary";
    const label = statusLabels[actualStatus] || actualStatus;

    return <Badge bg={variant}>{label}</Badge>;
  };

  const getApplicationsByJob = (jobId) => {
    return applications.filter((app) => app.offre?.idOffre === jobId).length;
  };

  const filteredApplications = applications.filter((app) => {
    const searchLower = applicationSearchTerm.toLowerCase();
    return (
      app.candidat?.nom?.toLowerCase().includes(searchLower) ||
      "" ||
      app.candidat?.prenom?.toLowerCase().includes(searchLower) ||
      "" ||
      app.candidat?.email?.toLowerCase().includes(searchLower) ||
      "" ||
      app.jobTitle?.toLowerCase().includes(searchLower) ||
      ""
    );
  });

  if (loading) {
    return (
      <Container className="mt-5 text-center">
        <Spinner animation="border" role="status" size="lg">
          <span className="visually-hidden">Chargement...</span>
        </Spinner>
      </Container>
    );
  }

  const handleShowJobApplications = (job) => {
    setSelectedJobForApplications(job);
    setShowJobApplications(true);
  };

  const handleCloseJobApplications = () => {
    setShowJobApplications(false);
    setSelectedJobForApplications(null);
  };

  return (
    <Container className="mt-4">
      {/* header */}
      <Row className="mb-4">
        <Col>
          <h1 className="display-5 fw-bold text-primary">
            <i className="bi bi-speedometer2 me-3"></i>
            Tableau de bord - {currentUser?.nomEntreprise}
          </h1>
          <p className="lead text-muted">
            Bienvenue {currentUser?.prenom} {currentUser?.nom} - Gérez vos
            offres d'emploi et suivez vos recrutements
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
              <i
                className={`bi ${
                  feedback.includes("Erreur")
                    ? "bi-exclamation-triangle"
                    : "bi-check-circle"
                } me-2`}
              ></i>
              {feedback}
            </Alert>
          </Col>
        </Row>
      )}

      <Row className="mb-4">
        <Col>
          <Nav variant="tabs" activeKey={activeTab} onSelect={setActiveTab}>
            <Nav.Item>
              <Nav.Link eventKey="overview">
                <i className="bi bi-house me-2"></i>Vue d'ensemble
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link eventKey="jobs">
                <i className="bi bi-briefcase me-2"></i>Mes offres
                <Badge bg="primary" className="ms-2">
                  {jobs.length}
                </Badge>
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link eventKey="applications">
                <i className="bi bi-people me-2"></i>Candidatures
                <Badge bg="warning" className="ms-2">
                  {stats.pendingApplications}
                </Badge>
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link eventKey="profile">
                <i className="bi bi-person me-2"></i>Mon profil
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link eventKey="matching">
                <i className="bi bi-graph-up me-2"></i>Analyse matching
                <Badge bg="success" className="ms-2">
                  {matchingStats.excellentMatches}
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
            <Col md={6} lg={3}>
              <Card className="text-center border-primary h-100">
                <Card.Body>
                  <div className="text-primary mb-2">
                    <i className="bi bi-file-text fs-1"></i>
                  </div>
                  <Card.Title className="text-primary fs-2">
                    {stats.totalJobs}
                  </Card.Title>
                  <Card.Text className="text-muted">Total des offres</Card.Text>
                </Card.Body>
              </Card>
            </Col>
            <Col md={6} lg={3}>
              <Card className="text-center border-success h-100">
                <Card.Body>
                  <div className="text-success mb-2">
                    <i className="bi bi-check-circle fs-1"></i>
                  </div>
                  <Card.Title className="text-success fs-2">
                    {stats.activeJobs}
                  </Card.Title>
                  <Card.Text className="text-muted">Offres actives</Card.Text>
                </Card.Body>
              </Card>
            </Col>
            <Col md={6} lg={3}>
              <Card className="text-center border-warning h-100">
                <Card.Body>
                  <div className="text-warning mb-2">
                    <i className="bi bi-clock fs-1"></i>
                  </div>
                  <Card.Title className="text-warning fs-2">
                    {stats.pendingApplications}
                  </Card.Title>
                  <Card.Text className="text-muted">En attente</Card.Text>
                </Card.Body>
              </Card>
            </Col>
            <Col md={6} lg={3}>
              <Card className="text-center border-info h-100">
                <Card.Body>
                  <div className="text-info mb-2">
                    <i className="bi bi-people fs-1"></i>
                  </div>
                  <Card.Title className="text-info fs-2">
                    {stats.totalApplications}
                  </Card.Title>
                  <Card.Text className="text-muted">
                    Total candidatures
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          <Row className="mb-4">
            <Col md={6}>
              <Card className="text-center border-success">
                <Card.Body>
                  <div className="text-success mb-2">
                    <i className="bi bi-check-square fs-3"></i>
                  </div>
                  <Card.Title className="text-success">
                    {stats.acceptedApplications}
                  </Card.Title>
                  <Card.Text className="text-muted">
                    Candidatures acceptées
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>
            <Col md={6}>
              <Card className="text-center border-danger">
                <Card.Body>
                  <div className="text-danger mb-2">
                    <i className="bi bi-x-square fs-3"></i>
                  </div>
                  <Card.Title className="text-danger">
                    {stats.rejectedApplications}
                  </Card.Title>
                  <Card.Text className="text-muted">
                    Candidatures refusées
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* candidatures & offres recentes */}
          <Row>
            <Col lg={6}>
              <Card className="h-100">
                <Card.Header className="d-flex justify-content-between align-items-center bg-primary text-white">
                  <h5 className="mb-0">
                    <i className="bi bi-briefcase me-2"></i>Offres récentes
                  </h5>
                  <Button
                    variant="light"
                    size="sm"
                    onClick={() => handleShowJobForm()}
                  >
                    <i className="bi bi-plus me-1"></i>Nouvelle offre
                  </Button>
                </Card.Header>
                <Card.Body>
                  {jobs.length === 0 ? (
                    <div className="text-center py-4">
                      <i
                        className="bi bi-inbox text-muted"
                        style={{ fontSize: "3rem" }}
                      ></i>
                      <p className="text-muted mt-3">Aucune offre publiée</p>
                      <Button
                        variant="primary"
                        onClick={() => handleShowJobForm()}
                      >
                        Créer votre première offre
                      </Button>
                    </div>
                  ) : (
                    <div className="d-grid gap-3">
                      {jobs.slice(0, 3).map((job) => (
                        <Card
                          key={job.idOffre}
                          className="border-start border-primary border-3"
                        >
                          <Card.Body className="py-3">
                            <div className="d-flex justify-content-between align-items-start">
                              <div className="flex-grow-1">
                                <h6 className="mb-1">{job.titre}</h6>
                                <small className="text-muted d-block">
                                  <i className="bi bi-geo-alt me-1"></i>
                                  {job.localisation}
                                </small>
                                <small className="text-muted">
                                  <i className="bi bi-calendar me-1"></i>
                                  Publié le {formatDate(job.datePublication)}
                                </small>
                                <div className="mt-2">
                                  <small className="text-info">
                                    <i className="bi bi-people me-1"></i>
                                    {getApplicationsByJob(job.idOffre)}{" "}
                                    candidature(s)
                                  </small>
                                </div>
                              </div>
                              <div className="text-end">
                                {getStatusBadge(job.etat)}
                              </div>
                            </div>
                          </Card.Body>
                        </Card>
                      ))}

                      {jobs.length > 3 && (
                        <div className="text-center">
                          <Button
                            variant="outline-primary"
                            size="sm"
                            onClick={() => setActiveTab("jobs")}
                          >
                            Voir toutes les offres ({jobs.length})
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </Card.Body>
              </Card>
            </Col>

            <Col lg={6}>
              <Card className="h-100">
                <Card.Header className="bg-info text-white">
                  <h5 className="mb-0">
                    <i className="bi bi-person-check me-2"></i>Candidatures
                    récentes
                  </h5>
                </Card.Header>
                <Card.Body>
                  {applications.length === 0 ? (
                    <div className="text-center py-4">
                      <i
                        className="bi bi-person-x text-muted"
                        style={{ fontSize: "3rem" }}
                      ></i>
                      <p className="text-muted mt-3">
                        Aucune candidature reçue
                      </p>
                    </div>
                  ) : (
                    <div className="d-grid gap-3">
                      {applications.slice(0, 3).map((application) => (
                        <Card
                          key={application.id}
                          className="border-start border-info border-3"
                        >
                          <Card.Body className="py-3">
                            <div className="d-flex justify-content-between align-items-start">
                              <div className="flex-grow-1">
                                <h6 className="mb-1">
                                  {application.candidat?.prenom}{" "}
                                  {application.candidat?.nom}
                                </h6>
                                <small className="text-muted d-block">
                                  <i className="bi bi-briefcase me-1"></i>
                                  {application.jobTitle}
                                </small>
                                <small className="text-muted">
                                  <i className="bi bi-calendar me-1"></i>
                                  {formatDateTime(application.datePostulation)}
                                </small>
                              </div>
                              <div className="text-end">
                                {getStatusBadge(
                                  application.etat,
                                  application.decision
                                )}
                                <div className="mt-2">
                                  <Button
                                    size="sm"
                                    variant="outline-primary"
                                    onClick={() =>
                                      handleShowApplicationDetails(
                                        application.id
                                      )
                                    }
                                  >
                                    <i className="bi bi-eye me-1"></i>Voir
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </Card.Body>
                        </Card>
                      ))}

                      {applications.length > 3 && (
                        <div className="text-center">
                          <Button
                            variant="outline-info"
                            size="sm"
                            onClick={() => setActiveTab("applications")}
                          >
                            Voir toutes les candidatures ({applications.length})
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </>
      )}

      {activeTab === "jobs" && (
        <Card>
          <Card.Header className="d-flex justify-content-between align-items-center bg-primary text-white">
            <div>
              <h5 className="mb-0">
                <i className="bi bi-briefcase me-2"></i>Mes Offres d'Emploi
              </h5>
              <small>
                {jobs.length} offre(s) publiée(s) • {stats.activeJobs} active(s)
              </small>
            </div>
            <Button variant="light" onClick={() => handleShowJobForm()}>
              <i className="bi bi-plus me-1"></i>Ajouter une Offre
            </Button>
          </Card.Header>
          <Card.Body>
            <Form.Control
              type="text"
              placeholder="🔍 Rechercher une offre par titre..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="mb-3"
            />

            {jobs.length === 0 ? (
              <div className="text-center py-5">
                <i
                  className="bi bi-inbox text-muted"
                  style={{ fontSize: "4rem" }}
                ></i>
                <h4 className="text-muted mt-3">Aucune offre publiée</h4>
                <p className="text-muted">
                  Commencez par créer votre première offre d'emploi
                </p>
                <Button
                  variant="primary"
                  size="lg"
                  onClick={() => handleShowJobForm()}
                >
                  <i className="bi bi-plus me-2"></i>Créer une offre
                </Button>
              </div>
            ) : (
              <Table responsive hover>
                <thead className="table-dark">
                  <tr>
                    <th>
                      <i className="bi bi-file-text me-1"></i>Titre
                    </th>
                    <th>
                      <i className="bi bi-geo-alt me-1"></i>Localisation
                    </th>
                    <th>
                      <i className="bi bi-calendar me-1"></i>Date Publi.
                    </th>
                    <th>
                      <i className="bi bi-calendar-x me-1"></i>Date Expir.
                    </th>
                    <th>
                      <i className="bi bi-clock me-1"></i>Jours Restants
                    </th>
                    <th>
                      <i className="bi bi-people me-1"></i>Candidatures
                    </th>
                    <th>
                      <i className="bi bi-flag me-1"></i>Statut
                    </th>
                    <th>
                      <i className="bi bi-tools me-1"></i>Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {jobs
                    .filter((job) =>
                      job.titre.toLowerCase().includes(searchTerm.toLowerCase())
                    )
                    .map((job) => (
                      <tr key={job.idOffre}>
                        <td className="fw-semibold">{job.titre}</td>
                        <td>
                          <i className="bi bi-geo-alt text-muted me-1"></i>
                          {job.localisation}
                        </td>
                        <td>{formatDate(job.datePublication)}</td>
                        <td>{formatDate(job.dateExpiration)}</td>
                        <td>
                          <span
                            className={
                              getRemainingDays(job.dateExpiration).includes(
                                "Expirée"
                              )
                                ? "text-danger"
                                : "text-success"
                            }
                          >
                            {getRemainingDays(job.dateExpiration)}
                          </span>
                        </td>
                        <td>
                          <Badge bg="info">
                            {getApplicationsByJob(job.idOffre)}
                          </Badge>
                        </td>
                        <td>{getStatusBadge(job.etat)}</td>
                        <td>
                          <div className="btn-group" role="group">
                            <Button
                              size="sm"
                              variant="outline-info"
                              onClick={() => handleShowJobApplications(job)}
                              title="Voir candidatures triées"
                            >
                              <i className="bi bi-sort-down"></i>
                              <span className="d-none d-lg-inline ms-1">
                                Candidatures
                              </span>
                            </Button>
                            <Button
                              size="sm"
                              variant="outline-primary"
                              onClick={() => handleShowJobForm(job)}
                              title="Modifier"
                            >
                              <i className="bi bi-pencil"></i>
                            </Button>
                            <Button
                              size="sm"
                              variant="outline-danger"
                              onClick={() => handleJobDelete(job.idOffre)}
                              title="Supprimer"
                            >
                              <i className="bi bi-trash"></i>
                            </Button>
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

      {activeTab === "applications" && (
        <Card>
          <Card.Header className="bg-info text-white">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <h5 className="mb-0">
                  <i className="bi bi-people me-2"></i>Candidatures reçues
                </h5>
                <small>
                  {applications.length} candidature(s) •{" "}
                  {stats.pendingApplications} en attente •{" "}
                  {stats.acceptedApplications} acceptée(s) •{" "}
                  {stats.rejectedApplications} refusée(s)
                </small>
              </div>
            </div>
          </Card.Header>
          <Card.Body>
            <Form.Control
              type="text"
              placeholder="🔍 Rechercher par nom, email ou poste..."
              value={applicationSearchTerm}
              onChange={(e) => setApplicationSearchTerm(e.target.value)}
              className="mb-3"
            />

            {applications.length === 0 ? (
              <div className="text-center py-5">
                <i
                  className="bi bi-person-x text-muted"
                  style={{ fontSize: "4rem" }}
                ></i>
                <h4 className="text-muted mt-3">Aucune candidature reçue</h4>
                <p className="text-muted">
                  Les candidatures apparaîtront ici une fois que les candidats
                  postuleront à vos offres
                </p>
              </div>
            ) : (
              <div className="d-grid gap-3">
                {filteredApplications.map((application) => (
                  <Card key={application.id} className="border hover-shadow">
                    <Card.Body>
                      <Row className="align-items-center">
                        <Col lg={6}>
                          <div className="d-flex align-items-center">
                            <div
                              className="bg-primary rounded-circle d-flex align-items-center justify-content-center me-3"
                              style={{ width: "50px", height: "50px" }}
                            >
                              <i className="bi bi-person text-white fs-4"></i>
                            </div>
                            <div>
                              <h6 className="mb-1 fw-bold">
                                {application.candidat?.prenom}{" "}
                                {application.candidat?.nom}
                              </h6>
                              <p className="mb-1 text-muted">
                                <i className="bi bi-envelope me-1"></i>
                                {application.candidat?.email}
                              </p>
                              <small className="text-muted">
                                <i className="bi bi-briefcase me-1"></i>
                                {application.jobTitle}
                              </small>
                            </div>
                          </div>
                        </Col>
                        <Col lg={3}>
                          <div className="text-center">
                            <small className="text-muted d-block">
                              Postulé le
                            </small>
                            <strong>
                              {formatDateTime(application.datePostulation)}
                            </strong>
                          </div>
                        </Col>
                        <Col lg={3}>
                          <div className="d-flex align-items-center justify-content-end gap-2">
                            <div className="text-center me-3">
                              {getStatusBadge(
                                application.etat,
                                application.decision
                              )}
                            </div>
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() =>
                                handleShowApplicationDetails(application.id)
                              }
                            >
                              <i className="bi bi-eye me-1"></i>Détails
                            </Button>
                          </div>
                        </Col>
                      </Row>

                      <Row className="mt-3 pt-3 border-top">
                        <Col md={4}>
                          <small className="text-muted">
                            <i className="bi bi-card-text me-1"></i>
                            CIN: {application.candidat?.cin || "Non spécifié"}
                          </small>
                        </Col>
                        <Col md={4}>
                          <small className="text-muted">
                            <i className="bi bi-briefcase me-1"></i>
                            Fonction:{" "}
                            {application.candidat?.fonctionActuelle ||
                              "Non spécifiée"}
                          </small>
                        </Col>
                        <Col md={4}>
                          <small
                            className={
                              application.candidat?.cvPath
                                ? "text-success"
                                : "text-warning"
                            }
                          >
                            <i
                              className={`bi ${
                                application.candidat?.cvPath
                                  ? "bi-file-check"
                                  : "bi-file-x"
                              } me-1`}
                            ></i>
                            CV:{" "}
                            {application.candidat?.cvPath
                              ? "Disponible"
                              : "Non fourni"}
                          </small>
                        </Col>
                      </Row>
                    </Card.Body>
                  </Card>
                ))}

                {filteredApplications.length === 0 && applicationSearchTerm && (
                  <div className="text-center py-4">
                    <i
                      className="bi bi-search text-muted"
                      style={{ fontSize: "3rem" }}
                    ></i>
                    <p className="text-muted mt-3">
                      Aucune candidature trouvée pour "{applicationSearchTerm}"
                    </p>
                  </div>
                )}
              </div>
            )}
          </Card.Body>
        </Card>
      )}

      {/* profile  */}
      {activeTab === "profile" && (
        <Row>
          <Col md={8} className="mx-auto">
            <Card>
              <Card.Header className="d-flex justify-content-between align-items-center bg-dark text-white">
                <h5 className="mb-0">
                  <i className="bi bi-person-circle me-2"></i>Mon Profil
                  Employeur
                </h5>
                <Button
                  variant="light"
                  size="sm"
                  onClick={() => setShowEditProfile(true)}
                >
                  <i className="bi bi-pencil me-1"></i>Modifier
                </Button>
              </Card.Header>
              <Card.Body>
                <Row>
                  <Col md={6}>
                    <div className="mb-3">
                      <strong className="text-muted">
                        <i className="bi bi-person me-1"></i>Prénom:
                      </strong>
                      <p className="mb-0">{currentUser?.prenom}</p>
                    </div>
                  </Col>
                  <Col md={6}>
                    <div className="mb-3">
                      <strong className="text-muted">
                        <i className="bi bi-person me-1"></i>Nom:
                      </strong>
                      <p className="mb-0">{currentUser?.nom}</p>
                    </div>
                  </Col>
                </Row>

                <div className="mb-3">
                  <strong className="text-muted">
                    <i className="bi bi-envelope me-1"></i>Email:
                  </strong>
                  <p className="mb-0">{currentUser?.email}</p>
                </div>

                <Row>
                  <Col md={6}>
                    <div className="mb-3">
                      <strong className="text-muted">
                        <i className="bi bi-building me-1"></i>Nom de
                        l'entreprise:
                      </strong>
                      <p className="mb-0">{currentUser?.nomEntreprise}</p>
                    </div>
                  </Col>
                  <Col md={6}>
                    <div className="mb-3">
                      <strong className="text-muted">
                        <i className="bi bi-hash me-1"></i>Matricule Fiscale:
                      </strong>
                      <p className="mb-0">{currentUser?.matriculeFiscale}</p>
                    </div>
                  </Col>
                </Row>

                <div className="mb-3">
                  <strong className="text-muted">
                    <i className="bi bi-diagram-3 me-1"></i>Secteur d'activité:
                  </strong>
                  <p className="mb-0">{currentUser?.secteurActivite}</p>
                </div>

                <div className="mb-3">
                  <strong className="text-muted">
                    <i className="bi bi-shield-check me-1"></i>Rôle:
                  </strong>
                  <Badge bg="primary" className="ms-2">
                    {currentUser?.role || "Employeur"}
                  </Badge>
                </div>

                {/* stat */}
                <hr />
                <h6 className="text-muted mb-3">
                  <i className="bi bi-graph-up me-2"></i>Statistiques de votre
                  compte
                </h6>
                <Row className="text-center">
                  <Col md={3}>
                    <div className="border rounded p-3">
                      <div className="text-primary fs-4">{stats.totalJobs}</div>
                      <small className="text-muted">Offres créées</small>
                    </div>
                  </Col>
                  <Col md={3}>
                    <div className="border rounded p-3">
                      <div className="text-success fs-4">
                        {stats.activeJobs}
                      </div>
                      <small className="text-muted">Offres actives</small>
                    </div>
                  </Col>
                  <Col md={3}>
                    <div className="border rounded p-3">
                      <div className="text-info fs-4">
                        {stats.totalApplications}
                      </div>
                      <small className="text-muted">Candidatures reçues</small>
                    </div>
                  </Col>
                  <Col md={3}>
                    <div className="border rounded p-3">
                      <div className="text-warning fs-4">
                        {stats.pendingApplications}
                      </div>
                      <small className="text-muted">En attente</small>
                    </div>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      {activeTab === "matching" && (
        <>
          <Row className="mb-4">
            <Col>
              <Card>
                <Card.Header className="bg-success text-white">
                  <h5 className="mb-0">
                    <i className="bi bi-graph-up me-2"></i>Analyse globale du
                    matching
                  </h5>
                </Card.Header>
                <Card.Body>
                  <Row className="text-center">
                    <Col md={3}>
                      <div className="border border-success rounded p-3">
                        <div className="text-success fs-3 fw-bold">
                          {matchingStats.excellentMatches}
                        </div>
                        <small className="text-muted">
                          Excellents matchs (≥80%)
                        </small>
                        <div className="mt-2">
                          <Badge bg="success">★★★</Badge>
                        </div>
                      </div>
                    </Col>
                    <Col md={3}>
                      <div className="border border-warning rounded p-3">
                        <div className="text-warning fs-3 fw-bold">
                          {matchingStats.goodMatches}
                        </div>
                        <small className="text-muted">
                          Bons matchs (60-79%)
                        </small>
                        <div className="mt-2">
                          <Badge bg="warning">★★☆</Badge>
                        </div>
                      </div>
                    </Col>
                    <Col md={3}>
                      <div className="border border-info rounded p-3">
                        <div className="text-info fs-3 fw-bold">
                          {matchingStats.averageMatches}
                        </div>
                        <small className="text-muted">
                          Matchs moyens (40-59%)
                        </small>
                        <div className="mt-2">
                          <Badge bg="info">★☆☆</Badge>
                        </div>
                      </div>
                    </Col>
                    <Col md={3}>
                      <div className="border border-secondary rounded p-3">
                        <div className="text-secondary fs-3 fw-bold">
                          {matchingStats.poorMatches}
                        </div>
                        <small className="text-muted">
                          Matchs faibles (&lt;40%)
                        </small>
                        <div className="mt-2">
                          <Badge bg="secondary">☆☆☆</Badge>
                        </div>
                      </div>
                    </Col>
                  </Row>

                  <hr className="my-4" />

                  <div className="text-center">
                    <Button
                      variant="primary"
                      onClick={async () => {
                        try {
                          setLoading(true);
                          await matchingService.recalculateMatchingScores();
                          await loadDashboardData();
                          setFeedback(
                            "Scores de matching recalculés avec succès"
                          );
                        } catch (error) {
                          setFeedback("Erreur lors du recalcul des scores");
                        } finally {
                          setLoading(false);
                        }
                      }}
                      disabled={loading}
                    >
                      <i className="bi bi-calculator me-2"></i>
                      Recalculer tous les scores
                    </Button>
                    <p className="small text-muted mt-2">
                      Recalcule les scores de compatibilité pour toutes vos
                      offres
                    </p>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          <Row>
            <Col>
              <Card>
                <Card.Header>
                  <h5 className="mb-0">Candidatures par offre</h5>
                </Card.Header>
                <Card.Body>
                  {jobs.length === 0 ? (
                    <p className="text-center text-muted py-4">
                      Aucune offre publiée
                    </p>
                  ) : (
                    <div className="d-grid gap-3">
                      {jobs.map((job) => (
                        <Card key={job.idOffre} className="border">
                          <Card.Body>
                            <Row className="align-items-center">
                              <Col lg={8}>
                                <h6 className="mb-1">{job.titre}</h6>
                                <p className="text-muted small mb-1">
                                  <i className="bi bi-geo-alt me-1"></i>
                                  {job.localisation}
                                </p>
                                <p className="text-muted small mb-0">
                                  <i className="bi bi-people me-1"></i>
                                  {getApplicationsByJob(job.idOffre)}{" "}
                                  candidature(s)
                                </p>
                              </Col>
                              <Col lg={4} className="text-end">
                                <Button
                                  variant="primary"
                                  onClick={() => handleShowJobApplications(job)}
                                >
                                  <i className="bi bi-sort-down me-1"></i>
                                  Voir candidatures triées
                                </Button>
                              </Col>
                            </Row>
                          </Card.Body>
                        </Card>
                      ))}
                    </div>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </>
      )}

      <Modal show={showJobForm} onHide={handleCloseJobForm} size="lg">
        <Modal.Header closeButton className="bg-primary text-white">
          <Modal.Title>
            <i className="bi bi-briefcase me-2"></i>
            {editingJob ? "Modifier l'offre" : "Créer une nouvelle offre"}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>
                <i className="bi bi-file-text me-1"></i>Titre de l'offre *
              </Form.Label>
              <Form.Control
                type="text"
                name="titre"
                value={formData.titre}
                onChange={handleChange}
                placeholder="Ex: Développeur Full Stack"
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>
                <i className="bi bi-card-text me-1"></i>Description
              </Form.Label>
              <Form.Control
                as="textarea"
                rows={4}
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Décrivez le poste, les missions, les compétences requises..."
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>
                <i className="bi bi-geo-alt me-1"></i>Localisation *
              </Form.Label>
              <Form.Control
                type="text"
                name="localisation"
                value={formData.localisation}
                onChange={handleChange}
                placeholder="Ex: Tunis, Tunisie"
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>
                <i className="bi bi-calendar-x me-1"></i>Date d'expiration *
              </Form.Label>
              <Form.Control
                type="date"
                name="dateExpiration"
                value={formData.dateExpiration}
                onChange={handleChange}
                min={new Date().toISOString().split("T")[0]}
                required
              />
              <Form.Text className="text-muted">
                L'offre sera automatiquement désactivée après cette date
              </Form.Text>
            </Form.Group>

            {formError && (
              <Alert variant="danger">
                <i className="bi bi-exclamation-triangle me-2"></i>
                {formError}
              </Alert>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleCloseJobForm}>
              <i className="bi bi-x me-1"></i>Annuler
            </Button>
            <Button variant="primary" type="submit">
              <i className="bi bi-check me-1"></i>
              {editingJob ? "Modifier" : "Créer"}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Edit Profile Modal */}
      <EditProfileModal
        show={showEditProfile}
        onHide={() => setShowEditProfile(false)}
        onProfileUpdated={handleProfileUpdated}
      />

      {/* Application Details Modal */}
      <ApplicationDetailsModal
        show={showApplicationDetails}
        onHide={handleCloseApplicationDetails}
        applicationId={selectedApplicationId}
        onStatusUpdate={handleApplicationStatusUpdate}
      />
      {/* Job Applications Manager Modal */}
      <JobApplicationsManager
        show={showJobApplications}
        onHide={handleCloseJobApplications}
        jobId={selectedJobForApplications?.idOffre}
        jobTitle={selectedJobForApplications?.titre}
        onStatusUpdate={handleApplicationStatusUpdate}
      />
    </Container>
  );
};

export default EmployerDashboard;
