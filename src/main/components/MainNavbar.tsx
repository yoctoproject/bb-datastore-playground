import React from "react";
import { Container, Navbar } from "react-bootstrap";
import { Link } from "react-router-dom";

export const MainNavbar: React.FC = () => {
    const logoHref = `${import.meta.env.BASE_URL}assets/images/BBDatastorePlaygroundLogo.svg`;

    return (
        <Navbar variant="dark" className="bb-main-nav">
            <Container fluid>
                <Navbar.Brand
                    href="#home"
                    className="align-items-center d-flex"
                >
                    <svg
                        width="64"
                        height="64"
                        xmlns="http://www.w3.org/2000/svg"
                        className="pe-3"
                    >
                        <image href={logoHref} height="64" width="64" />
                    </svg>{" "}
                    BB Datastore Playground
                </Navbar.Brand>
                <div className="text-end d-flex align-items-center me-2 gap-2">
                    <Link
                        className="btn btn-outline-light nav-item"
                        role="button"
                        to="/about"
                    >
                        about
                    </Link>
                </div>
            </Container>
        </Navbar>
    );
};
