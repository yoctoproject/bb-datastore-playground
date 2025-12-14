import path from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const fullReloadWorkers = () => {
    const workerDir = path.resolve(process.cwd(), "src/pyodide-worker");

    return {
        name: "full-reload-pyodide-worker",
        handleHotUpdate({ file, server }) {
            if (file.startsWith(workerDir)) {
                server.ws.send({ type: "full-reload", path: "*" });
            }
        },
    };
};

export default defineConfig({
    base: "/bb-datastore-playground/",
    plugins: [react(), fullReloadWorkers()],
    build: {
        outDir: "dist",
        sourcemap: true,
        emptyOutDir: true,
    },
    resolve: {
        alias: {
            "node-fetch": "isomorphic-fetch",
        },
    },
});
