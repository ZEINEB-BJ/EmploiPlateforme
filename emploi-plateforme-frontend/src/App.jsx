import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Navbar from "./components/layout/Navbar";
//import Footer from "./components/layout/Footer";
import Home from "./pages/Home";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Register from "./pages/Register";
import EmployerDashboard from "./pages/EmployerDashboard";
import CandidateDashboard from "./pages/CandidateDashboard";
import JobDetails from "./pages/JobDetails";
import PrivateRoute from "./components/PrivateRoute";
import "bootstrap/dist/css/bootstrap.min.css";

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Navbar />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/register" element={<Register />} />
            <Route path="/job/:id" element={<JobDetails />} />
            <Route
              path="/employer/dashboard"
              element={
                <PrivateRoute role="EMPLOYEUR">
                  <EmployerDashboard />
                </PrivateRoute>
              }
            />
            <Route
              path="/candidat/dashboard"
              element={
                <PrivateRoute role="CANDIDAT">
                  <CandidateDashboard />
                </PrivateRoute>
              }
            />
          </Routes>
          {/*<Footer />*/}
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
