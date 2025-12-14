import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
    base: "/bb-datastore-playground/",
    plugins: [react()],
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
