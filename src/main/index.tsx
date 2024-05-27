import 'bootstrap/dist/css/bootstrap.min.css';

import {createRoot} from "react-dom/client";
import {App} from "./components/App";
import React, {StrictMode} from "react";
import store from "./api/store";
import {Provider} from "react-redux";
import {createBrowserRouter, Outlet, RouterProvider} from 'react-router-dom';
import {MainNavbar} from "./components/MainNavbar";
import * as Comlink from "comlink";
import {useServiceWorkerStore} from "./store";
import {ROUTES} from "./routes";
import {OAuth} from "./pages/OAuth";

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
                path: ROUTES.OAUTH.path,
                element: <OAuth/>,
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
            <RouterProvider router={router}/>
        </Provider>
    </StrictMode>
);

async function initComlink() {
    const { port1, port2 } = new MessageChannel();
    const msg = {
        comlinkInit: true,
        port: port1,
    };

    navigator.serviceWorker.controller.postMessage(msg, [port1]);

    useServiceWorkerStore.setState({serviceWorker: Comlink.wrap(port2)});
}

if ("serviceWorker" in navigator) {
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

                installingWorker.onstatechange = () => {
                    if (installingWorker.state === 'installed' &&
                        navigator.serviceWorker.controller) {
                        console.warn("RELOADING");
                        // Preferably, display a message asking the user to reload...
                        //location.reload();
                    }
                };
            });
        })
        .catch((error) => {
            console.error(`Service worker registration failed: ${error}`);
        });
} else {
    console.error("Service workers are not supported.");
}
