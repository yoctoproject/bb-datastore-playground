import 'bootstrap/dist/css/bootstrap.min.css';
import '../../assets/style/common.scss';

import {createRoot} from "react-dom/client";
import {App} from "./components/App";
import React, {StrictMode} from "react";
import store from "./api/store";
import {Provider} from "react-redux";
import {createBrowserRouter, Outlet, RouterProvider} from 'react-router-dom';
import {MainNavbar} from "./components/MainNavbar";
import {githubApi} from "./api/services/github";

const Root: React.FC = () => {
    return (<div className="d-flex flex-column h-100">
        <MainNavbar/>
        <Outlet/>
    </div>);
}

window.addEventListener(
    "message",
    (event) => {
        if (event.data["loggedIn"]) {
            console.log("GOT A MESSAGE BUDDY! " + JSON.stringify(event.data));
            store.dispatch(githubApi.util.invalidateTags(['User']));
        }
    },
    false,
);


const router = createBrowserRouter([
    {
        element: <Root/>,
        children: [
            {
                path: "/",
                element: <App/>,
            },
        ],
    },
], {
    basename: "/bb-datastore-playground",
});

const container = document.getElementById("root");
const root = createRoot(container!);
root.render(
    <StrictMode>
        <Provider store={store}>
            <RouterProvider router={router}/>
        </Provider>
    </StrictMode>
);
