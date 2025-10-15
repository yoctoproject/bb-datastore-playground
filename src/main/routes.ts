import {route, string} from "react-router-typesafe-routes/dom";


export const ROUTES = {
    OAUTH: route(
        "oauth",
        {
            searchParams: {
                code: string(),
            }
        }
    )
};
