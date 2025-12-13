import React from "react";
import 'flexlayout-react/style/light.css';
import {AppLayout} from "./layout";
import ToastManager from "./ToastManager";
import { PyodideWorkerProvider } from "../hooks/usePyodideWorker";

export const App: React.FC = () => {
    return (
        <PyodideWorkerProvider>
            <ToastManager/>
            <AppLayout/>
        </PyodideWorkerProvider>
    );
};
