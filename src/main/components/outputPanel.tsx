import React from "react";
import { useParseBitbake } from "../hooks/useParseBitbake";
import { usePyodideWorker } from "../hooks/usePyodideWorker";

export const OutputPanel: React.FC = () => {
    const { value, status, error } = useParseBitbake();
    const { workerState } = usePyodideWorker();

    let content: React.ReactNode = null;

    if (workerState.status === "error") {
        content = (
            <span className="text-danger">
                Pyodide failed to start: {workerState.error?.message}
            </span>
        );
    } else if (workerState.status !== "ready") {
        const label =
            workerState.status === "starting"
                ? "Starting Pyodide"
                : workerState.status === "preparing"
                  ? "Preparing BitBake"
                  : "Waiting for Pyodide";
        content = <span>{label}&hellip;</span>;
    } else if (status === "failed") {
        content = <span className="text-danger">Error: {error}</span>;
    } else if (status === "succeeded") {
        content = (
            <pre className="bg-light p-2 rounded border">
                {value ?? "(no value)"}
            </pre>
        );
    } else {
        content = <span>...</span>;
    }

    return <div className="p-3">{content}</div>;
};
