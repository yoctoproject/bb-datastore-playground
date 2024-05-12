import {useEffect, useState} from 'react';

import {PyodideInterface} from "pyodide";

let cachedInstance: PyodideInterface = null;

export const usePyodide: () => { pyodide: PyodideInterface; status: string } = () => {
    const [pyodide, setPyodide] = useState<PyodideInterface>(null);
    const [status, setStatus] = useState<string>('idle');

    useEffect(() => {
        let isActive = true;

        const loadPyodide = async () => {
            if (!cachedInstance) {
                setStatus("importing");
                const { loadPyodide: loadPyodideModule } = await import("https://cdn.jsdelivr.net/pyodide/v0.25.1/full/pyodide.mjs");
                setStatus("loading");
                cachedInstance = await loadPyodideModule();
                setStatus("done");
            }
            if (isActive) {
                setPyodide(cachedInstance);
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
