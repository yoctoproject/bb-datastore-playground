import {useEffect, useState} from 'react';

import pyodide from "pyodide";

export const usePyodide = () => {
    const [pyodide, setPyodide] = useState<pyodide>(null);
    const [status, setStatus] = useState<string>('idle');

    useEffect(() => {
        let isActive = true;

        const loadPyodide = async () => {
            if (!window.pyodide) {
                setStatus("importing");
                const { loadPyodide: loadPyodideModule } = await import("https://cdn.jsdelivr.net/pyodide/v0.25.1/full/pyodide.mjs");
                setStatus("loading");
                window.pyodide = await loadPyodideModule();
                setStatus("done");
            }
            if (isActive) {
                setPyodide(window.pyodide);
            }
        };

        loadPyodide();

        return () => {
            setStatus("inactive");
            isActive = false;
        };
    }, []);

    return { pyodide, status } as const;
};
