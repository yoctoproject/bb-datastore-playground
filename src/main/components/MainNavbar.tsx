import React from "react";
import {Container, Navbar} from "react-bootstrap";

export const MainNavbar: React.FC = () => {
    return (
        <Navbar className="bg-body-tertiary">
            <Container fluid>
                <Navbar.Brand href="#home" className="align-items-center d-flex">
                    <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" fill="currentColor"
                         className="bi bi-play-fill" viewBox="0 0 16 16">
                        <path
                            d="m11.596 8.697-6.363 3.692c-.54.313-1.233-.066-1.233-.697V4.308c0-.63.692-1.01 1.233-.696l6.363 3.692a.802.802 0 0 1 0 1.393"/>
                    </svg>
                    {' '}
                    BB Datastore Playground
                </Navbar.Brand>
            </Container>
        </Navbar>
    );
};