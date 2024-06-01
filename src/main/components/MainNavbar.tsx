import React from "react";
import {Button, Container, Navbar, NavDropdown, OverlayTrigger, Tooltip} from "react-bootstrap";
import {Link} from "react-router-dom";
import {useGetUserQuery, useLogoutMutation} from "../api/services/github";
import {useSelector} from "react-redux";

export const MainNavbar: React.FC = () => {
    const isLoggedIn = useSelector(state => state.auth.isLoggedIn === "yes");
    const [logout, {isLoading, isSuccess, isError}] = useLogoutMutation();

    const handleLogout = async () => {
        await logout().unwrap();
    }

    const {data} = useGetUserQuery();
    console.log(data);

    return (
        <Navbar variant="dark">
            <Container fluid>
                <Navbar.Brand href="#home" className="align-items-center d-flex">
                    <svg width="64" height="64" xmlns="http://www.w3.org/2000/svg" className="pe-3">
                        <image href="/assets/images/BBDatastorePlaygroundLogo.svg" height="64" width="64"/>
                    </svg>
                    {' '}
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

                    {!isLoggedIn && (
                        <OverlayTrigger placement="auto-start"
                                        overlay={<Tooltip className="custom-tooltip">Gists!</Tooltip>}>
                            <Button href="https://github-gist-proxy.laplante.io/authorize" target="_blank" rel="opener"
                                    variant="outline-light">
                                <div className="align-items-center d-flex gap-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor"
                                         className="bi bi-github" viewBox="0 0 16 16">
                                        <path
                                            d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8"/>
                                    </svg>
                                    Login
                                </div>
                            </Button>
                        </OverlayTrigger>
                    )}
                    {isLoggedIn && (
                        <NavDropdown title={<img src={data?.avatar_url || ""} alt="mdo" width="48" height="48"
                                                 className="rounded-circle"/>} align="end">
                            <NavDropdown.Item onClick={handleLogout}>Sign out</NavDropdown.Item>
                        </NavDropdown>
                    )}
                </div>
            </Container>
        </Navbar>
    );
};