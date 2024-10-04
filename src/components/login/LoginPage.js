import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import facebookLoginImage from "../../styles/images/facebooklogin.png";

const LoginPage = ({ onLogin }) => {
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
          // 사용자 정보를 가져와 sessionStorage에 저장
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
          alert("앱에 로그인해야 이용가능한 기능입니다.");
        } else {
          alert("페이스북에 로그인해야 이용가능한 기능입니다.");
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
      <div>
        <h1 style={{ textAlign: "center", marginBottom: "20px" }}>
          Login Page
        </h1>
        <img
          src={facebookLoginImage}
          alt="Login with Facebook"
          onClick={handleFacebookLogin}
          style={{ cursor: "pointer", width: "200px", height: "auto" }}
        />
      </div>
    </div>
  );
};

export default LoginPage;
