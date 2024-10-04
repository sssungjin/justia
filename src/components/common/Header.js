import React from "react";
import { Navbar, Nav, NavItem, Button } from "reactstrap";

const Header = ({ userName, userEmail, onLogout }) => {
  return (
    <Navbar color="light" light expand="md" className="mt-2 px-2">
      <div className="container-fluid d-flex justify-content-between align-items-center">
        <div className="d-flex align-items-center">
          <h3 className="mb-0 ml-2">Justia - Legal Chatbot</h3>
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
