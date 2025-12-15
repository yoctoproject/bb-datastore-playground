/// <reference lib="webworker" />
import type { PyodideInterface } from "pyodide";
import { proxy, expose } from "comlink";

import axios from "axios";

console.error("WORKER!");

declare let self: DedicatedWorkerGlobalScope & {
    pyodide: PyodideInterface;
};

const PYODIDE_MODULE_URL =
    "https://cdn.jsdelivr.net/pyodide/v0.29.0/full/pyodide.mjs";
type LoadPyodide = typeof import("pyodide").loadPyodide;

async function loadPyodideAndPackages() {
    console.log("loading pyodide");
    // @vite-ignore: dynamic CDN import
    const { loadPyodide } = (await import(
        /* @vite-ignore */ PYODIDE_MODULE_URL
    )) as { loadPyodide: LoadPyodide };
    self.pyodide = await loadPyodide();
    console.log("loading packages!");
    await self.pyodide.loadPackage(["sqlite3"]);
}

let progressCallbacks = [
    async (str) => {
        console.log(str);
    },
];

const printAll = async (str) => {
    await Promise.all(progressCallbacks.map((f) => f(str)));
};

export class MyWorker {
    #initialized = false;
    #pyconsole: any = null;
    // repr_shorten: pretty-printer used by Pyodide console to truncate long outputs.
    #repr_shorten: any = null;
    // await_fut: helper to await Python futures and stash the result in builtins._ like the REPL.
    #await_fut: any = null;

    async setProgressCallback(func) {
        progressCallbacks.push(func);
    }

    async test() {
        console.log("test() from the worker :)");
        await printAll("callback!");
    }

    async prepareBitbake(bitbakeUrl: string, version: string) {
        if (this.#initialized) {
            return;
        }

        const helpersPromise = fetch(
            new URL("./my_helpers.py", import.meta.url)
        ).then((res) => res.text());
        const importHooksPromise = fetch(
            new URL("./import_hooks.py", import.meta.url)
        ).then((res) => res.text());
        const bitbakePromise = axios({
            method: "get",
            url: bitbakeUrl,
            responseType: "arraybuffer",
            onDownloadProgress: async function (progressEvent) {
                // Calculate the download progress percentage
                const percentCompleted = Math.round(
                    (progressEvent.loaded * 100) / (progressEvent.total ?? 1)
                );
                await printAll(`progress: ${percentCompleted}`);
            },
        }).then((response) => response.data);

        const pyodidePromise = async () => {
            await printAll("starting!");
            await loadPyodideAndPackages();
            await printAll("done starting!");
        };

        const [bitbakeData, , helpersSource, importHookSource] =
            await Promise.all([
                bitbakePromise,
                pyodidePromise(),
                helpersPromise,
                importHooksPromise,
            ]);

        console.log("unpacking...");
        self.pyodide.unpackArchive(bitbakeData, "zip", {
            extractDir: "bb",
        });

        console.log("applying import hooks...");
        self.pyodide.FS.writeFile("/import_hooks.py", importHookSource);
        self.pyodide.runPython(
            `
import importlib
import sys

if "/" not in sys.path:
    sys.path.insert(0, "/")
importlib.invalidate_caches()
import import_hooks
`
        );

        self.pyodide.runPython(
            `
import sys
sys.path.insert(0, "./bb/bitbake-${version}/lib/")
from bb.data_smart import DataSmart
import bb.parse
import bb.siggen
`
        );

        self.pyodide.FS.writeFile("/my_helpers.py", helpersSource);
        self.pyodide.runPython(
            `
import importlib
importlib.invalidate_caches()
from my_helpers import segment_code, parsehelper
`
        );

        this.#initialized = true;
        await printAll("bitbake ready");
    }

    async parse(data: string): Promise<Array<[string, string]>> {
        self.pyodide.FS.writeFile("/tmp.bb", data);

        const ret = (await self.pyodide.runPython(
            `
import contextlib
from pyodide.ffi import to_js
import io

ret = []
with open("/tmp.bb", "r") as f:
    segments = segment_code(f.read())

d = DataSmart()
bb.parse.siggen = bb.siggen.init(d)

for segment in segments:
    if segment[0] == "bitbake":
        with parsehelper(segment[1]) as f:
            d = bb.parse.handle(f.name, d)['']
    elif segment[0] == "inline_python":
        # TODO: stderr as well
        with contextlib.redirect_stdout(io.StringIO()) as f:
            exec(segment[1])
        ret.append((segment[1], f.getvalue()))

print(ret)
to_js(ret)
`
        )) as Array<[string, string]>;

        return ret;
    }

    // Terminal code largely taken from https://github.com/pyodide/pyodide/blob/main/src/templates/console.html
    async initConsole() {
        if (!this.#initialized) {
            throw new Error("BitBake/Pyodide not prepared yet");
        }
        if (this.#pyconsole) {
            return;
        }

        const { repr_shorten, PyodideConsole } =
            self.pyodide.pyimport("pyodide.console");
        const pyconsole = PyodideConsole(self.pyodide.globals);

        const pyodideInternal = self.pyodide as unknown as {
            _api?: {
                on_fatal?: (error: Error & { name?: string }) => void;
            };
            version?: string;
        };
        if (pyodideInternal?._api) {
            pyodideInternal._api.on_fatal = async (error) => {
                console.error("Pyodide fatal error:", error);
            };
        }

        const namespace = self.pyodide.globals.get("dict")();
        const await_fut = self.pyodide.runPython(
            `
              import builtins
              from pyodide.ffi import to_js

              async def await_fut(fut):
                  res = await fut
                  if res is not None:
                      builtins._ = res
                  return to_js([res], depth=1)

              await_fut
              `,
            { globals: namespace }
        );
        namespace.destroy();

        this.#pyconsole = pyconsole;
        this.#repr_shorten = repr_shorten;
        this.#await_fut = await_fut;
    }

    async runConsole(command: string) {
        if (!this.#initialized) {
            throw new Error("BitBake/Pyodide not prepared yet");
        }
        if (!this.#pyconsole) {
            await this.initConsole();
        }
        const pyconsole = this.#pyconsole;
        const outputs: Array<{
            type: "stdout" | "stderr";
            text: string;
            newline?: boolean;
        }> = [];
        const echo = (text: string, newline = true) =>
            outputs.push({ type: "stdout", text, newline });
        const errorOut = (text: string, newline = true) =>
            outputs.push({ type: "stderr", text, newline });

        // Match the original Pyodide console: stdout/stderr callbacks are responsible for newlines.
        pyconsole.stdout_callback = (s) => echo(s, false);
        pyconsole.stderr_callback = (s) => errorOut(s.trimEnd(), false);

        const PS1 = ">>> ";
        const PS2 = "... ";
        let nextPrompt = PS1;

        // multiline should be split (useful when pasting)
        for (const c of command.split("\n")) {
            const escaped = c.replaceAll(/\u00a0/g, " ");
            const fut = pyconsole.push(escaped);
            nextPrompt = fut.syntax_check === "incomplete" ? PS2 : PS1;
            switch (fut.syntax_check) {
                case "syntax-error":
                    errorOut(fut.formatted_error.trimEnd());
                    fut.destroy();
                    continue;
                case "incomplete":
                    fut.destroy();
                    continue;
                case "complete":
                    break;
                default:
                    fut.destroy();
                    throw new Error(`Unexpected type ${fut.syntax_check}`);
            }

            // In JavaScript, await automatically also awaits any results of
            // awaits, so if an async function returns a future, it will await
            // the inner future too. This is not what we want so we
            // temporarily put it into a list to protect it.
            const wrapped = this.#await_fut(fut);

            // complete case, get result / error and print it.
            try {
                const [value] = await wrapped;
                if (value !== undefined) {
                    echo(
                        this.#repr_shorten.callKwargs(value, {
                            separator: "\n<long output truncated>\n",
                        })
                    );
                }
                if (value instanceof self.pyodide.ffi.PyProxy) {
                    value.destroy();
                }
            } catch (e) {
                if (e.constructor?.name === "PythonError") {
                    const message = fut.formatted_error || e.message;
                    errorOut(message.trimEnd());
                } else {
                    throw e;
                }
            } finally {
                fut.destroy();
                wrapped.destroy();
            }
        }

        return { outputs, prompt: nextPrompt };
    }

    async complete(prefix: string): Promise<string[]> {
        if (!this.#initialized) {
            throw new Error("BitBake/Pyodide not prepared yet");
        }
        if (!this.#pyconsole) {
            await this.initConsole();
        }
        const completionProxy = this.#pyconsole.complete(prefix);
        // toJs returns [completions, cursor]
        const [completions] = completionProxy.toJs();
        completionProxy.destroy?.();
        return completions ?? [];
    }

    async interrupt() {
        if (!this.#pyconsole) {
            return;
        }
        this.#pyconsole.buffer.clear();
    }
}

expose(MyWorker);
