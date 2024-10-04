import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import LegalComplaintDocs from "./LegalComplaintDocs";
import LoginPage from "./login/LoginPage";
import { ProtectedRoute } from "./ProtectedRoute";
import useAuth from "../hooks/useAuth";

function PageRoutes() {
  const { login, logout } = useAuth();

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage onLogin={login} />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <LegalComplaintDocs onLogout={logout} />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default PageRoutes;
