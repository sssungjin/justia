import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import facebookLoginImage from "../../styles/images/facebooklogin.png";
import justiaLogo from "../../styles/images/justia_logo.png";

const LoginPage = ({ onLogin }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  useEffect(() => {
    const loadFacebookSDK = () => {
      window.fbAsyncInit = function () {
        window.FB.init({
          appId: "8416889168371106",
          cookie: true,
          xfbml: true,
          version: "v10.0",
        });
        window.FB.AppEvents.logPageView();
      };

      (function (d, s, id) {
        var js,
          fjs = d.getElementsByTagName(s)[0];
        if (d.getElementById(id)) return;
        js = d.createElement(s);
        js.id = id;
        js.src = "https://connect.facebook.net/ko_KR/sdk.js";
        fjs.parentNode.insertBefore(js, fjs);
      })(document, "script", "facebook-jssdk");
    };

    loadFacebookSDK();
  }, []);

  const handleFacebookLogin = () => {
    window.FB.login(
      function (response) {
        if (response.status === "connected") {
          console.log("Login successful", response);
          window.FB.api("/me", { fields: "name,email" }, function (userData) {
            const user = {
              id: response.authResponse.userID,
              accessToken: response.authResponse.accessToken,
              name: userData.name,
              email: userData.email,
            };
            onLogin(user);
            navigate("/");
          });
        } else if (response.status === "not_authorized") {
          alert(t("loginAlerts.notAuthorized"));
        } else {
          alert(t("loginAlerts.notLoggedIn"));
        }
      },
      { scope: "public_profile,email" }
    );
  };

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
      }}
    >
      <div style={{ textAlign: "center" }}>
        <h1 style={{ marginBottom: "20px" }}>{t("loginPage.title")}</h1>
        <img
          src={justiaLogo}
          alt="Justia Logo"
          style={{ width: "400px", height: "auto", marginBottom: "20px" }}
        />
        <br />
        <img
          src={facebookLoginImage}
          alt={t("loginPage.facebookLoginAlt")}
          onClick={handleFacebookLogin}
          style={{ cursor: "pointer", width: "200px", height: "auto" }}
        />
      </div>
    </div>
  );
};

export default LoginPage;
