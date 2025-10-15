import {useEffect, useState} from 'react';

import type {PyodideInterface} from "pyodide";

let cachedInstance: PyodideInterface = null;

export enum PyodideStatus {
    Idle,
    Fetching,
    Loading,
    Done,
    Inactive,
}

export const usePyodide: () => { pyodide: PyodideInterface; status: PyodideStatus } = () => {
    const [pyodide, setPyodide] = useState<PyodideInterface>(null);
    const [status, setStatus] = useState<PyodideStatus>(PyodideStatus.Idle);

    useEffect(() => {
        let isActive = true;

        const loadPyodide = async () => {
            if (!cachedInstance) {
                setStatus(PyodideStatus.Fetching);
                const {loadPyodide: loadPyodideModule} = await import("https://cdn.jsdelivr.net/pyodide/v0.25.1/full/pyodide.mjs");
                setStatus(PyodideStatus.Loading);
                cachedInstance = await loadPyodideModule();
                setStatus(PyodideStatus.Done);
            }
            if (isActive) {
                setPyodide(cachedInstance);
            }
        };

        loadPyodide();

        return () => {
            setStatus(PyodideStatus.Inactive);
            isActive = false;
        };
    }, []);

    return {pyodide, status} as const;
};
