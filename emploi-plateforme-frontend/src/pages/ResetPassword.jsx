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
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";

const ResetPassword = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const token = new URLSearchParams(location.search).get("token");

  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");
  const [variant, setVariant] = useState("info");

  const handleReset = async (e) => {
    e.preventDefault();
    try {
      await axios.post("http://localhost:8081/api/auth/reset-password", {
        token,
        newPassword,
      });
      setMessage("Mot de passe changé avec succès !");
      setVariant("success");
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      setMessage(
        "Erreur : " + (err.response?.data || "Échec de réinitialisation.")
      );
      setVariant("danger");
    }
  };

  return (
    <Container className="mt-5">
      <Row className="justify-content-center">
        <Col md={6} lg={4}>
          <Card>
            <Card.Body>
              <h2 className="text-center mb-4">Nouveau mot de passe</h2>
              {message && <Alert variant={variant}>{message}</Alert>}

              <Form onSubmit={handleReset}>
                <Form.Group className="mb-3">
                  <Form.Label>Nouveau mot de passe</Form.Label>
                  <Form.Control
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    placeholder="Nouveau mot de passe"
                  />
                </Form.Group>

                <Button variant="primary" type="submit" className="w-100">
                  Réinitialiser le mot de passe
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default ResetPassword;
