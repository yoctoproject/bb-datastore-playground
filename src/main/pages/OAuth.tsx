import React, {useEffect} from "react";
import {useServiceWorkerStore} from "../store";
import {useTypedSearchParams} from "react-router-typesafe-routes/dom";
import {ROUTES} from "../routes";

export const OAuth: React.FC = () => {
    const serviceWorkerProxy = useServiceWorkerStore((state) => state.serviceWorker);

    const [{code}] = useTypedSearchParams(ROUTES.OAUTH);

    useEffect(() => {
        (async () => {
            if (serviceWorkerProxy) {
                const token = await serviceWorkerProxy.logIn(code);
                console.warn("TOKEN: " + token);
            }
        })();
    }, [code, serviceWorkerProxy]);

    return (<p>Got it :)</p>);
};