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
        if (value && value.length > 0) {
            content = (
                <div className="d-flex flex-column gap-3">
                    {value.map(([code, output], idx) => (
                        <div
                            key={`${idx}-${code.substring(0, 10)}`}
                            className="border rounded p-2 bg-white"
                        >
                            <div className="text-muted small mb-1">Python</div>
                            <pre className="bg-light p-2 rounded border mb-2">
                                {code.trimEnd()}
                            </pre>
                            <div className="text-muted small mb-1">Stdout</div>
                            <pre className="bg-light p-2 rounded border mb-0">
                                {output.trimEnd() || "(no output)"}
                            </pre>
                        </div>
                    ))}
                </div>
            );
        } else {
            content = (
                <span className="text-muted">No inline Python found.</span>
            );
        }
    } else {
        content = <span>...</span>;
    }

    return <div className="p-3">{content}</div>;
};
