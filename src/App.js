import "./App.scss";
import PageRoutes from "./components/PageRoutes";
import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";

function App() {
  const { i18n } = useTranslation();

  // sessionStorage에서 언어를 불러옵니다. 없으면 기본값으로 설정합니다.
  const [currentLanguage, setCurrentLanguage] = useState(() => {
    const savedLanguage = sessionStorage.getItem("currentLanguage");
    return savedLanguage ? savedLanguage : navigator.language.split("-")[0];
  });

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
    setCurrentLanguage(lng);
    sessionStorage.setItem("currentLanguage", lng); // 언어를 sessionStorage에 저장
  };

  useEffect(() => {
    console.log("Current language: " + currentLanguage);
  }, [currentLanguage]);

  return (
    <div className="App">
      <PageRoutes
        currentLanguage={currentLanguage}
        changeLanguage={changeLanguage}
      />
    </div>
  );
}

export default App;
