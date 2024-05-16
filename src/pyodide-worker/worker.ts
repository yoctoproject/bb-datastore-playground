import type {PyodideInterface, loadPyodide} from "pyodide";
import {retain} from "@shopify/react-web-worker";
import axios from "axios";

declare let self: DedicatedWorkerGlobalScope & {
    pyodide: PyodideInterface,
}

importScripts("https://cdn.jsdelivr.net/pyodide/v0.25.1/full/pyodide.js");

async function loadPyodideAndPackages() {
    // @ts-expect-error Method imported by importScripts
    self.pyodide = await loadPyodide();
    await self.pyodide.loadPackage(["numpy", "pytz"]);
}

const pyodideReadyPromise = loadPyodideAndPackages();

let the_func = null;

export const setProgressCallback = async (func) => {
    the_func = func;
    retain(func);
}

let bitbake_data = false;

const download_bitbake = async (u) => {
    await fetch(u);
};

export const runPython = async (python: string, u: string) => {

    console.log(await fetch(u).then((response) => {
        if (!response.ok) {
            throw new Error(`HTTP error, status = ${response.status}`);
        }
        return response.arrayBuffer();
    }));

    await the_func("starting!");

    // make sure loading is done
    await pyodideReadyPromise;
    await the_func("done starting!");

    await self.pyodide.loadPackagesFromImports(python);
    const results = await self.pyodide.runPythonAsync(python);
    return `${results}`;
}


export const streamMe = function* () {
    yield 'a';
    yield 'b';
    yield 'c';
};