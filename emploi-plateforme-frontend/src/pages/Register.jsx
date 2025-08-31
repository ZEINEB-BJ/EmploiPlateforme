import React, { useState } from "react";
import {
  Container,
  Row,
  Col,
  Form,
  Button,
  Card,
  Alert,
} from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Register = () => {
  const [formData, setFormData] = useState({
    nom: "",
    prenom: "",
    email: "",
    motDePasse: "",
    confirmPassword: "",
    role: "CANDIDAT",
    cin: "",
    fonctionActuelle: "",
    nomEntreprise: "",
    secteurActivite: "",
    matriculeFiscale: "",
  });

  const [error, setError] = useState("");
  const [validationErrors, setValidationErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

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

    if (!formData.motDePasse) {
      errors.motDePasse = "Le mot de passe est requis.";
      valid = false;
    } else if (formData.motDePasse.length < 6) {
      errors.motDePasse =
        "Le mot de passe doit contenir au moins 6 caractères.";
      valid = false;
    }

    if (formData.motDePasse !== formData.confirmPassword) {
      errors.confirmPassword = "Les mots de passe ne correspondent pas.";
      valid = false;
    }

    if (formData.role === "CANDIDAT") {
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
    } else if (formData.role === "EMPLOYEUR") {
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

      const userData = {
        nom: formData.nom,
        prenom: formData.prenom,
        email: formData.email,
        motDePasse: formData.motDePasse,
        role: formData.role,
      };

      if (formData.role === "CANDIDAT") {
        userData.cin = formData.cin;
        userData.fonctionActuelle = formData.fonctionActuelle.trim() || null;
      } else {
        userData.matriculeFiscale = formData.matriculeFiscale;
        userData.nomEntreprise = formData.nomEntreprise;
        userData.secteurActivite = formData.secteurActivite;
      }

      await register(userData);
      navigate("/login");
    } catch (err) {
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError("Erreur lors de l'inscription.");
      }
      setLoading(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Container className="mt-5">
      <Row className="justify-content-center">
        <Col md={8} lg={6}>
          <Card>
            <Card.Body>
              <h2 className="text-center mb-4">Créer un compte</h2>
              {error && <Alert variant="danger">{error}</Alert>}

              <Form onSubmit={handleSubmit}>
                {/* Rôle */}
                <Form.Group className="mb-3">
                  <Form.Label>Vous êtes :</Form.Label>
                  <div>
                    <Form.Check
                      inline
                      type="radio"
                      id="candidat"
                      label="Candidat"
                      name="role"
                      value="CANDIDAT"
                      checked={formData.role === "CANDIDAT"}
                      onChange={handleChange}
                    />
                    <Form.Check
                      inline
                      type="radio"
                      id="employeur"
                      label="Employeur"
                      name="role"
                      value="EMPLOYEUR"
                      checked={formData.role === "EMPLOYEUR"}
                      onChange={handleChange}
                    />
                  </div>
                </Form.Group>

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

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Mot de passe</Form.Label>
                      <Form.Control
                        type="password"
                        name="motDePasse"
                        value={formData.motDePasse}
                        onChange={handleChange}
                        isInvalid={!!validationErrors.motDePasse}
                        placeholder="Mot de passe"
                      />
                      <Form.Control.Feedback type="invalid">
                        {validationErrors.motDePasse}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Confirmation</Form.Label>
                      <Form.Control
                        type="password"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        isInvalid={!!validationErrors.confirmPassword}
                        placeholder="Confirmer le mot de passe"
                      />
                      <Form.Control.Feedback type="invalid">
                        {validationErrors.confirmPassword}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                </Row>

                {/*  CANDIDAT */}
                {formData.role === "CANDIDAT" && (
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

                {/*  EMPLOYEUR */}
                {formData.role === "EMPLOYEUR" && (
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

                <Button
                  variant="primary"
                  type="submit"
                  className="w-100"
                  disabled={loading}
                >
                  {loading ? "Inscription..." : "S'inscrire"}
                </Button>
              </Form>

              <div className="text-center mt-3">
                Déjà un compte ? <Link to="/login">Se connecter</Link>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Register;
