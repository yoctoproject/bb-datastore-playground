import 'bootstrap/dist/css/bootstrap.min.css';

import {createRoot} from "react-dom/client";
import {App} from "./components/App";
import React, {StrictMode} from "react";
import store from "./api/store";
import {Provider} from "react-redux";
import {createBrowserRouter, Outlet, RouterProvider} from 'react-router-dom';
import {MainNavbar} from "./components/MainNavbar";
import * as Comlink from "comlink";

if ("serviceWorker" in navigator) {
    async function initComlink() {
        const { port1, port2 } = new MessageChannel();
        const msg = {
            comlinkInit: true,
            port: port1,
        };
        navigator.serviceWorker.controller.postMessage(msg, [port1]);

        const swProxy = Comlink.wrap(port2);
        console.log(await swProxy.initialize());

        console.log("isLoggedIn? " + await swProxy.isLoggedIn());
    }

    if (navigator.serviceWorker.controller) {
        initComlink();
    }

    navigator.serviceWorker.addEventListener("controllerchange", initComlink);
    navigator.serviceWorker
        .register(new URL("../oauth-service-worker/worker.ts", import.meta.url))
        .then((registration) => {
            registration.addEventListener("updatefound", () => {
                // If updatefound is fired, it means that there's
                // a new service worker being installed.
                const installingWorker = registration.installing;
                console.log(
                    "A new service worker is being installed:",
                    installingWorker,
                );

                // You can listen for changes to the installing service worker's
                // state via installingWorker.onstatechange
            });
        })
        .catch((error) => {
            console.error(`Service worker registration failed: ${error}`);
        });
} else {
    console.error("Service workers are not supported.");
}

const Root: React.FC = () => {
    return(<div>
        <MainNavbar/>
        <Outlet/>
    </div>);
}

const router = createBrowserRouter([
    {
        element: <Root />,
        children: [
            {
                path: "/",
                element: <App />,
            },
            {
                path: "/oauth",
                element: <p>Yeah fam!</p>,
            }
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
            <RouterProvider router={router} />
        </Provider>
    </StrictMode>
);