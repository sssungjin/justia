import React from "react";
import { Navbar, Nav, NavItem, Button } from "reactstrap";
import justiaLogo from "../../styles/images/justia_text.png";
import { useNavigate } from "react-router-dom";
import useAuth from "../../hooks/useAuth";

const Header = ({ userName, userEmail }) => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
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
        <Nav className="d-flex align-items-center" navbar>
          <NavItem className="mr-3">
            <span>
              {userName} ({userEmail})
            </span>
          </NavItem>
          <NavItem className="mr-2">
            <Button color="secondary" onClick={handleLogout}>
              Logout
            </Button>
          </NavItem>
        </Nav>
      </div>
    </Navbar>
  );
};

export default Header;
