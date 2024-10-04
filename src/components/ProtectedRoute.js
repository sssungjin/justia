import React, { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import useAuth from "../hooks/useAuth";

export const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, checkAuthStatus } = useAuth();
  const location = useLocation();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    checkAuthStatus();
    setIsChecking(false);
  }, [checkAuthStatus]);

  if (isChecking) {
    return <div>Loading...</div>; // 또는 로딩 스피너 컴포넌트
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};
