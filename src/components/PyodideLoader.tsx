import React, { useEffect, useState } from 'react';

import pyodide from "pyodide";

interface Props {
    pyodide: pyodide | null;
    setPyodide: (value: pyodide) => void;
}

const PyodideLoader: React.FC<Props> = (props: Props) => {
    useEffect(() => {
        async function loadPyodide() {
            const { loadPyodide: loadPyodideModule } = await import("https://cdn.jsdelivr.net/pyodide/v0.25.1/full/pyodide.mjs");
            const pyodideInstance: pyodide = await loadPyodideModule();
            props.setPyodide(pyodideInstance);
        }

        loadPyodide();
    }, []);

    return (
        <div>
            {props.pyodide ? 'Pyodide Loaded!' : 'Loading Pyodide...'}
        </div>
    );
};

export default PyodideLoader;
