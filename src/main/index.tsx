import 'bootstrap/dist/css/bootstrap.min.css';

import {createRoot} from "react-dom/client";
import {App} from "./components/App";
import React, {StrictMode} from "react";
import store from "./api/store";
import {Provider} from "react-redux";


const container = document.getElementById("root");
const root = createRoot(container!);
root.render(
    <StrictMode>
        <Provider store={store}>
            <App/>
        </Provider>
    </StrictMode>
);