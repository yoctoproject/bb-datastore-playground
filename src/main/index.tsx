import "bootstrap/dist/css/bootstrap.min.css";
import "../styles/common.scss";

import { createRoot } from "react-dom/client";
import { App } from "./components/App";
import React, { StrictMode } from "react";
import store from "./api/store";
import { Provider } from "react-redux";
import { createBrowserRouter, Outlet, RouterProvider } from "react-router-dom";
import { MainNavbar } from "./components/MainNavbar";

const Root: React.FC = () => {
    return (
        <div className="d-flex flex-column h-100">
            <MainNavbar />
            <Outlet />
        </div>
    );
};

const router = createBrowserRouter(
    [
        {
            element: <Root />,
            children: [
                {
                    path: "/",
                    element: <App />,
                },
            ],
        },
    ],
    {
        basename: import.meta.env.BASE_URL,
    }
);

const container = document.getElementById("root");
const root = createRoot(container!);
root.render(
    <StrictMode>
        <Provider store={store}>
            <RouterProvider router={router} />
        </Provider>
    </StrictMode>
);
