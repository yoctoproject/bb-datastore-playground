import type {PyodideInterface, loadPyodide} from "pyodide";

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

export const runPython = async (python: string) => {
    // make sure loading is done
    await pyodideReadyPromise;

    await self.pyodide.loadPackagesFromImports(python);
    const results = await self.pyodide.runPythonAsync(python);
    return `${results}`;
}
