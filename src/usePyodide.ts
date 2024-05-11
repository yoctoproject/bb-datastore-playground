import React, { useEffect, useState } from 'react';

export const usePyodide = () => {
    const [pyodide, setPyodide] = useState(null);

    useEffect(() => {
        let isActive = true;

        const loadPyodide = async () => {
            if (!window.pyodide) {
                const { loadPyodide: loadPyodideModule } = await import("https://cdn.jsdelivr.net/pyodide/v0.25.1/full/pyodide.mjs");
                window.pyodide = await loadPyodideModule();
            }
            if (isActive) {
                setPyodide(window.pyodide);
            }
        };

        loadPyodide();

        return () => {
            isActive = false;
        };
    }, []);

    return pyodide;
};
