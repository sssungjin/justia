import React from "react";
import { Navbar, Nav, NavItem, Button } from "reactstrap";
import { useTranslation } from "react-i18next";
import justiaLogo from "../../styles/images/justia_text.png";

const Header = ({ userName, userEmail, onLogout }) => {
  const { i18n } = useTranslation();

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
  };

  return (
    <Navbar color="light" light expand="md" className="mt-2 px-2">
      <div className="container-fluid d-flex justify-content-between align-items-center">
        <div className="d-flex align-items-center">
          <img
            src={justiaLogo}
            alt="Justia Logo"
            className="mt-2"
            style={{ width: "200px", height: "auto" }}
          />
        </div>
        <div className="d-flex justify-content-center flex-grow-1">
          <Button
            color="link"
            onClick={() => changeLanguage("ko")}
            className="mx-2"
          >
            한국어
          </Button>
          <Button
            color="link"
            onClick={() => changeLanguage("en")}
            className="mx-2"
          >
            English
          </Button>
        </div>
        <Nav className="d-flex align-items-center" navbar>
          <NavItem className="mr-3">
            <span>
              {userName} ({userEmail})
            </span>
          </NavItem>
          <NavItem className="mr-2">
            <Button color="secondary" onClick={onLogout}>
              Logout
            </Button>
          </NavItem>
        </Nav>
      </div>
    </Navbar>
  );
};

export default Header;
