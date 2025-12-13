/// <reference lib="webworker" />
import type { PyodideInterface } from "pyodide";
import { expose } from 'comlink'

import axios from "axios";

console.error("WORKER!")

declare let self: DedicatedWorkerGlobalScope & {
    pyodide: PyodideInterface,
}

const PYODIDE_MODULE_URL = "https://cdn.jsdelivr.net/pyodide/v0.25.1/full/pyodide.mjs";
type LoadPyodide = typeof import("pyodide").loadPyodide;

async function loadPyodideAndPackages() {
    console.log("loading pyodide");
    const { loadPyodide } = await import(PYODIDE_MODULE_URL) as { loadPyodide: LoadPyodide };
    self.pyodide = await loadPyodide();
    console.log("loading packages!");
    await self.pyodide.loadPackage(["sqlite3"]);
}

let progressCallbacks = [
    async (str) => {
        console.log(str);
    }
];

const printAll = async (str) => {
    await Promise.all(progressCallbacks.map(f => f(str)));
}

export class MyWorker {
    #initialized = false;
    #bitbakeVersion: string | null = null;
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

        const bitbakePromise = axios({
            method: 'get',
            url: bitbakeUrl,
            responseType: 'arraybuffer',
            onDownloadProgress: async function (progressEvent) {
                // Calculate the download progress percentage
                const percentCompleted = Math.round((progressEvent.loaded * 100) / (progressEvent.total ?? 1));
                await printAll(`progress: ${percentCompleted}`);
            }
        }).then(response => response.data);

        const pyodidePromise = async () => {
            await printAll("starting!");
            await loadPyodideAndPackages();
            await printAll("done starting!");
        };

        const [bitbakeData] = await Promise.all([bitbakePromise, pyodidePromise()]);

        console.log("unpacking...");
        self.pyodide.unpackArchive(bitbakeData, "zip", {
            extractDir: "bb"
        });

        console.log("applying import hooks...");
        self.pyodide.runPython(`
import os.path
import sys
from importlib.abc import Loader, MetaPathFinder
from importlib.util import spec_from_file_location, spec_from_loader

import _frozen_importlib
import _frozen_importlib_external


class MyMetaFinder(MetaPathFinder):
    def find_spec(self, fullname, path=None, target=None):
        print(f"importing {fullname}")

        if path is None or path == "":
            path = sys.path
        if "." in fullname:
            *parents, name = fullname.split(".")
        else:
            name = fullname
        for entry in path:
            if os.path.isdir(os.path.join(entry, name)):
                # this module has child modules
                filename = os.path.join(entry, name, "__init__.py")
                submodule_locations = [os.path.join(entry, name)]
            else:
                filename = os.path.join(entry, name + ".py")
                submodule_locations = None
            if not os.path.exists(filename):
                continue

            print(">> " + filename)

            return spec_from_file_location(fullname, filename, loader=MyLoader(filename),
                                           submodule_search_locations=submodule_locations)

        # we don't know how to import this
        return None


class MyLoader(Loader):
    def __init__(self, filename):
        self.filename = filename

    def create_module(self, spec):
        # Use default module creation semantics
        return None

    def exec_module(self, module):
        print("FILE NAME: " + self.filename)
        if self.filename.endswith("fcntl/__init__.py"):
            data = """
from unittest.mock import Mock
fcntl = Mock()
            """
        else:
            with open(self.filename) as f:
                data = f.read()

        try:
            exec(data, vars(module))
        except Exception as e:
            print(e)
            raise e


class BuiltinImporterShim(_frozen_importlib.BuiltinImporter):
    @classmethod
    def find_spec(cls, fullname, path=None, target=None):
        ret = super().find_spec(fullname, path, target)

        if ret:
            print(f"shim handling: {ret}")
        return ret


class FrozenImporterShim:
    _original_importer = None

    @classmethod
    def set_original_importer(cls, imp):
        cls._original_importer = imp

    @classmethod
    def find_spec(cls, fullname, path=None, target=None):
        if fullname == "fcntl":
            return spec_from_loader("fcntl", MyLoader("fcntl/__init__.py"))
        ret = cls._original_importer.find_spec(fullname, path, target)

        if ret:
            print(f"frozen shim handling: {ret}")
        return ret

print(sys.meta_path)
js_finder = sys.meta_path.pop()
path_finder = sys.meta_path.pop()
frozen_finder = sys.meta_path.pop()
builtin = sys.meta_path.pop()

#sys.meta_path.append(MyMetaFinder())
sys.meta_path.append(path_finder)

i = FrozenImporterShim()
i.set_original_importer(frozen_finder)
sys.meta_path.append(i)

sys.meta_path.append(BuiltinImporterShim())

print(sys.meta_path)
        `)
        self.pyodide.runPython(`
                    import sys
                    sys.path.insert(0, "./bb/bitbake-${version}/lib/")
                    from bb.data_smart import DataSmart
                `)

        this.#initialized = true;
        this.#bitbakeVersion = version;
        await printAll("bitbake ready");
    }

    // Terminal code largely taken from https://github.com/pyodide/pyodide/blob/main/src/templates/console.html
    async initConsole() {
        if (!this.#initialized) {
            throw new Error("BitBake/Pyodide not prepared yet");
        }
        if (this.#pyconsole) {
            return;
        }

        const {repr_shorten, PyodideConsole} = self.pyodide.pyimport("pyodide.console");
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
            {globals: namespace},
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
        const outputs: Array<{ type: "stdout" | "stderr"; text: string; newline?: boolean }> = [];
        const echo = (text: string, newline = true) => outputs.push({type: "stdout", text, newline});
        const errorOut = (text: string, newline = true) => outputs.push({type: "stderr", text, newline});

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
                        }),
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

        return {outputs, prompt: nextPrompt};
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
