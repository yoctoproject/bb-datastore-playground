import React from "react";
import "flexlayout-react/style/light.css";
import { AppLayout } from "./layout";
import ToastManager from "./ToastManager";
import { PyodideWorkerProvider } from "../hooks/usePyodideWorker";
import { useEditorUrlSync } from "../hooks/useEditorUrlSync";
import { EditorParseListener } from "./EditorParseListener";

export const App: React.FC = () => {
    useEditorUrlSync();

    return (
        <PyodideWorkerProvider>
            <ToastManager />
            <EditorParseListener />
            <AppLayout />
        </PyodideWorkerProvider>
    );
};
