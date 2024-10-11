import "./App.scss";
import PageRoutes from "./components/PageRoutes";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";

function App() {
  const { i18n } = useTranslation();
  const [currentLanguage, setCurrentLanguage] = useState(
    navigator.language.split("-")[0]
  );

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
    setCurrentLanguage(lng);
  };

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
