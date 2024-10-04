import { useState, useEffect, useCallback } from "react";

const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const checkAuthStatus = useCallback(() => {
    const userInfo = sessionStorage.getItem("userInfo");
    const newAuthState = !!userInfo;
    if (newAuthState !== isAuthenticated) {
      setIsAuthenticated(newAuthState);
    }
    return newAuthState;
  }, [isAuthenticated]);

  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

  const login = useCallback((userData) => {
    sessionStorage.setItem("userInfo", JSON.stringify(userData));
    setIsAuthenticated(true);
  }, []);

  const logout = useCallback(() => {
    sessionStorage.removeItem("userInfo");
    setIsAuthenticated(false);
  }, []);

  return { isAuthenticated, login, logout, checkAuthStatus };
};

export default useAuth;
