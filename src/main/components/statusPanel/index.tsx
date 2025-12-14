import React from "react";
import { usePyodideWorker } from "../../hooks/usePyodideWorker";

export const StatusPanel: React.FC = () => {
    const { workerState } = usePyodideWorker();

    return <div>Status! {JSON.stringify(workerState)}</div>;
};
