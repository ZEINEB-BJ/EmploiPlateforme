import React, { useState, useEffect } from "react";
import { Modal, Form, Button, Alert, Row, Col, Spinner } from "react-bootstrap";
import { useAuth } from "../context/AuthContext";
import profileService from "../services/ProfileService";

const EditProfileModal = ({ show, onHide, onProfileUpdated }) => {
  const { currentUser, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [validationErrors, setValidationErrors] = useState({});

  const [formData, setFormData] = useState({
    nom: "",
    prenom: "",
    email: "",
    cin: "",
    fonctionActuelle: "",
    matriculeFiscale: "",
    nomEntreprise: "",
    secteurActivite: "",
    nouveauMotDePasse: "",
    confirmPassword: "",
  });

  useEffect(() => {
    if (show && currentUser) {
      setFormData({
        nom: currentUser.nom || "",
        prenom: currentUser.prenom || "",
        email: currentUser.email || "",
        cin: currentUser.cin || "",
        fonctionActuelle: currentUser.fonctionActuelle || "",
        matriculeFiscale: currentUser.matriculeFiscale || "",
        nomEntreprise: currentUser.nomEntreprise || "",
        secteurActivite: currentUser.secteurActivite || "",
        nouveauMotDePasse: "",
        confirmPassword: "",
      });
      setError("");
      setValidationErrors({});
    }
  }, [show, currentUser]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (validationErrors[name]) {
      const newErrors = { ...validationErrors };
      delete newErrors[name];
      setValidationErrors(newErrors);
    }
    setError("");
  };

  const validateForm = () => {
    const errors = {};
    let valid = true;

    const emailRegex = /\S+@\S+\.\S+/;

    // validation commune
    if (!formData.nom.trim()) {
      errors.nom = "Le nom est requis.";
      valid = false;
    } else if (formData.nom.length < 3) {
      errors.nom = "Le nom doit contenir au moins 3 caractères.";
      valid = false;
    }

    if (!formData.prenom.trim()) {
      errors.prenom = "Le prénom est requis.";
      valid = false;
    } else if (formData.prenom.length < 3) {
      errors.prenom = "Le prénom doit contenir au moins 3 caractères.";
      valid = false;
    }

    if (!formData.email.trim()) {
      errors.email = "L'adresse email est requise.";
      valid = false;
    } else if (!emailRegex.test(formData.email)) {
      errors.email = "Format d'email invalide.";
      valid = false;
    }

    // validation  mot de passe
    if (formData.nouveauMotDePasse && formData.nouveauMotDePasse.length < 6) {
      errors.nouveauMotDePasse =
        "Le mot de passe doit contenir au moins 6 caractères.";
      valid = false;
    }

    if (formData.nouveauMotDePasse !== formData.confirmPassword) {
      errors.confirmPassword = "Les mots de passe ne correspondent pas.";
      valid = false;
    }

    // validation  pour candidat
    if (currentUser?.role === "CANDIDAT") {
      if (!formData.cin.trim()) {
        errors.cin = "Le CIN est requis.";
        valid = false;
      } else if (!/^\d{8}$/.test(formData.cin)) {
        errors.cin = "Le CIN doit contenir exactement 8 chiffres.";
        valid = false;
      }

      if (
        formData.fonctionActuelle &&
        formData.fonctionActuelle.trim().length < 3
      ) {
        errors.fonctionActuelle =
          "La fonction actuelle doit contenir au moins 3 caractères.";
        valid = false;
      }
    }

    // validation  pour employeur
    if (currentUser?.role === "EMPLOYEUR") {
      if (!formData.matriculeFiscale.trim()) {
        errors.matriculeFiscale = "Le matricule fiscale est requis.";
        valid = false;
      }

      if (!formData.nomEntreprise.trim()) {
        errors.nomEntreprise = "Le nom de l'entreprise est requis.";
        valid = false;
      } else if (formData.nomEntreprise.trim().length < 3) {
        errors.nomEntreprise =
          "Le nom de l'entreprise doit contenir au moins 3 caractères.";
        valid = false;
      }

      if (!formData.secteurActivite.trim()) {
        errors.secteurActivite = "Le secteur d'activité est requis.";
        valid = false;
      } else if (formData.secteurActivite.trim().length < 3) {
        errors.secteurActivite =
          "Le secteur d'activité doit contenir au moins 3 caractères.";
        valid = false;
      }
    }

    setValidationErrors(errors);
    return valid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!validateForm()) return;

    try {
      setLoading(true);

      const updateData = {
        nom: formData.nom,
        prenom: formData.prenom,
        email: formData.email,
      };

      if (formData.nouveauMotDePasse) {
        updateData.nouveauMotDePasse = formData.nouveauMotDePasse;
      }

      let updatedUser;
      if (currentUser.role === "CANDIDAT") {
        updateData.cin = formData.cin;
        updateData.fonctionActuelle = formData.fonctionActuelle || null;
        const response = await profileService.updateCandidatProfile(updateData);
        updatedUser = response.user;
      } else if (currentUser.role === "EMPLOYEUR") {
        updateData.matriculeFiscale = formData.matriculeFiscale;
        updateData.nomEntreprise = formData.nomEntreprise;
        updateData.secteurActivite = formData.secteurActivite;
        const response = await profileService.updateEmployeurProfile(
          updateData
        );
        updatedUser = response.user;
      }

      updateUser(updatedUser);

      if (onProfileUpdated) {
        onProfileUpdated("Profil mis à jour avec succès !");
      }

      onHide();
    } catch (err) {
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError("Erreur lors de la mise à jour du profil.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Modifier mon profil</Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          {error && <Alert variant="danger">{error}</Alert>}

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Nom</Form.Label>
                <Form.Control
                  type="text"
                  name="nom"
                  value={formData.nom}
                  onChange={handleChange}
                  isInvalid={!!validationErrors.nom}
                  placeholder="Entrez votre nom"
                />
                <Form.Control.Feedback type="invalid">
                  {validationErrors.nom}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Prénom</Form.Label>
                <Form.Control
                  type="text"
                  name="prenom"
                  value={formData.prenom}
                  onChange={handleChange}
                  isInvalid={!!validationErrors.prenom}
                  placeholder="Entrez votre prénom"
                />
                <Form.Control.Feedback type="invalid">
                  {validationErrors.prenom}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>
          </Row>

          <Form.Group className="mb-3">
            <Form.Label>Email</Form.Label>
            <Form.Control
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              isInvalid={!!validationErrors.email}
              placeholder="Entrez votre email"
            />
            <Form.Control.Feedback type="invalid">
              {validationErrors.email}
            </Form.Control.Feedback>
          </Form.Group>

          {/* Champs  pour candidat */}
          {currentUser?.role === "CANDIDAT" && (
            <>
              <Form.Group className="mb-3">
                <Form.Label>CIN</Form.Label>
                <Form.Control
                  type="text"
                  name="cin"
                  value={formData.cin}
                  onChange={handleChange}
                  isInvalid={!!validationErrors.cin}
                  placeholder="Entrez votre CIN"
                />
                <Form.Control.Feedback type="invalid">
                  {validationErrors.cin}
                </Form.Control.Feedback>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Fonction actuelle (optionnel)</Form.Label>
                <Form.Control
                  type="text"
                  name="fonctionActuelle"
                  value={formData.fonctionActuelle}
                  onChange={handleChange}
                  isInvalid={!!validationErrors.fonctionActuelle}
                  placeholder="Ex: Développeur Web"
                />
                <Form.Control.Feedback type="invalid">
                  {validationErrors.fonctionActuelle}
                </Form.Control.Feedback>
              </Form.Group>
            </>
          )}

          {/* Champs  pour employeur */}
          {currentUser?.role === "EMPLOYEUR" && (
            <>
              <Form.Group className="mb-3">
                <Form.Label>Matricule Fiscale</Form.Label>
                <Form.Control
                  type="text"
                  name="matriculeFiscale"
                  value={formData.matriculeFiscale}
                  onChange={handleChange}
                  isInvalid={!!validationErrors.matriculeFiscale}
                  placeholder="Entrez votre matricule fiscale"
                />
                <Form.Control.Feedback type="invalid">
                  {validationErrors.matriculeFiscale}
                </Form.Control.Feedback>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Nom de l'entreprise</Form.Label>
                <Form.Control
                  type="text"
                  name="nomEntreprise"
                  value={formData.nomEntreprise}
                  onChange={handleChange}
                  isInvalid={!!validationErrors.nomEntreprise}
                  placeholder="Nom de l'entreprise"
                />
                <Form.Control.Feedback type="invalid">
                  {validationErrors.nomEntreprise}
                </Form.Control.Feedback>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Secteur d'activité</Form.Label>
                <Form.Control
                  type="text"
                  name="secteurActivite"
                  value={formData.secteurActivite}
                  onChange={handleChange}
                  isInvalid={!!validationErrors.secteurActivite}
                  placeholder="Ex: Informatique, Finance..."
                />
                <Form.Control.Feedback type="invalid">
                  {validationErrors.secteurActivite}
                </Form.Control.Feedback>
              </Form.Group>
            </>
          )}

          <hr />
          <h6>Changer le mot de passe (optionnel)</h6>

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Nouveau mot de passe</Form.Label>
                <Form.Control
                  type="password"
                  name="nouveauMotDePasse"
                  value={formData.nouveauMotDePasse}
                  onChange={handleChange}
                  isInvalid={!!validationErrors.nouveauMotDePasse}
                  placeholder="Laisser vide pour ne pas changer"
                />
                <Form.Control.Feedback type="invalid">
                  {validationErrors.nouveauMotDePasse}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Confirmer le mot de passe</Form.Label>
                <Form.Control
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  isInvalid={!!validationErrors.confirmPassword}
                  placeholder="Confirmer le nouveau mot de passe"
                />
                <Form.Control.Feedback type="invalid">
                  {validationErrors.confirmPassword}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide} disabled={loading}>
            Annuler
          </Button>
          <Button variant="primary" type="submit" disabled={loading}>
            {loading ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Mise à jour...
              </>
            ) : (
              "Mettre à jour"
            )}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default EditProfileModal;
