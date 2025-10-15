import {JQueryTerminal} from "./JQueryTerminal";
import React, {useEffect, useMemo, useRef} from "react";
import {EnvironmentStatus, useEnvironmentSetup} from "../hooks/useEnvironmentSetup";
import {PyodideStatus} from "../hooks/usePyodide";
import type {PyodideInterface} from "pyodide";

const PS1 = ">>> ";
const PS2 = "... ";

type TerminalHandle = {
    echo: (message: string, options?: JQueryTerminal.animationOptions & JQueryTerminal.EchoOptions) => void;
    freeze: (toggle?: boolean) => void;
    setPrompt: (prompt: string) => void;
    exec: (command: string) => void;
    setInterpreter: (interpreter: JQueryTerminal.Interpreter) => void;
    setCommand: (value: string) => void;
    beforeCursor?: () => string;
    insert?: (text: string) => void;
    enter: () => void;
    getInstance: () => JQueryTerminal | null;
    focus?: (silent?: boolean) => void;
};

type PyodideConsoleLike = {
    complete: (command: string) => {
        toJs(): [string[], unknown];
        destroy?: () => void;
    };
    buffer: {
        clear: () => void;
    };
    push: (command: string) => {
        syntax_check: string;
        formatted_error?: string;
        destroy: () => void;
    };
    stdout_callback?: (value: string, options?: { newline?: boolean }) => void;
    stderr_callback?: (value: string) => void;
};

// Taken from https://terminal.jcubic.pl/examples.php
function progress(percent, width) {
    var size = Math.round(width * percent / 100);
    var left = '', taken = '', i;
    for (i = size; i--;) {
        taken += '=';
    }
    if (taken.length > 0) {
        taken = taken.replace(/=$/, '>');
    }
    for (i = width - size; i--;) {
        left += ' ';
    }
    return '[' + taken + left + '] ' + percent + '%';
}

// Terminal code largely taken from https://github.com/pyodide/pyodide/blob/main/src/templates/console.html
function sleep(s) {
    return new Promise((resolve) => setTimeout(resolve, s));
}

function create_interpreter(
    pyodide: PyodideInterface,
    term: JQueryTerminal,
    onConsoleReady: (consoleProxy: PyodideConsoleLike) => void,
) {
    let {repr_shorten, PyodideConsole} = pyodide.pyimport("pyodide.console");
    const pyconsole = PyodideConsole(pyodide.globals) as unknown as PyodideConsoleLike & {
        stdout_callback: (value: string, options?: { newline?: boolean }) => void;
        stderr_callback: (value: string) => void;
    };
    if (!term.ready) {
        term.ready = Promise.resolve();
    }
    onConsoleReady(pyconsole);

    const pyodideInternal = pyodide as unknown as {
        _api?: {
            on_fatal?: (error: Error & { name?: string }) => void;
        };
        version?: string;
    };
    if (pyodideInternal?._api) {
        pyodideInternal._api.on_fatal = async (error) => {
            const errorMessage = String(error);
            if (error.name === "Exit") {
                term.error(error as unknown as string);
                term.error("Pyodide exited and can no longer be used.");
            } else {
                term.error("Pyodide has suffered a fatal error.");
                term.error("The cause of the fatal error was:");
                term.error(errorMessage);
                term.error("Look in the browser console for more details.");
            }
            await term.ready;
            term.pause();
            await sleep(15);
            term.pause();
        };
    }

    const namespace = pyodide.globals.get("dict")();
    const await_fut = pyodide.runPython(
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

    const echo = (msg, ...opts) => {
        return term.echo(
            msg
                .replaceAll("]]", "&rsqb;&rsqb;")
                .replaceAll("[[", "&lsqb;&lsqb;"),
            ...opts,
        );
    };

    async function lock() {
        let resolve;
        const ready = term.ready;
        term.ready = new Promise((res) => (resolve = res));
        await ready;
        return resolve;
    }

    async function interpreter(command, term: JQueryTerminal) {
        const unlock = await lock();
        term.pause();
        // multiline should be split (useful when pasting)
        for (const c of command.split("\n")) {
            const escaped = c.replaceAll(/\u00a0/g, " ");
            const fut = pyconsole.push(escaped);
            term.set_prompt(fut.syntax_check === "incomplete" ? PS2 : PS1);
            switch (fut.syntax_check) {
                case "syntax-error":
                    term.error(fut.formatted_error.trimEnd());
                    continue;
                case "incomplete":
                    continue;
                case "complete":
                    break;
                default:
                    throw new Error(`Unexpected type ${fut.syntax_check}`);
            }
            // In JavaScript, await automatically also awaits any results of
            // awaits, so if an async function returns a future, it will await
            // the inner future too. This is not what we want so we
            // temporarily put it into a list to protect it.
            const wrapped = await_fut(fut);
            // complete case, get result / error and print it.
            try {
                const [value] = await wrapped;
                if (value !== undefined) {
                    echo(
                        repr_shorten.callKwargs(value, {
                            separator: "\n<long output truncated>\n",
                        }),
                    );
                }
                if (value instanceof pyodide.ffi.PyProxy) {
                    value.destroy();
                }
            } catch (e) {
                if (e.constructor.name === "PythonError") {
                    const message = fut.formatted_error || e.message;
                    term.error(message.trimEnd());
                } else {
                    throw e;
                }
            } finally {
                fut.destroy();
                wrapped.destroy();
            }
        }
        term.resume();
        await sleep(10);
        unlock();
    }

    pyconsole.stdout_callback = (s) => echo(s, {newline: false});
    pyconsole.stderr_callback = (s) => {
        term.error(s.trimEnd());
    };

    return interpreter;
}

export const PlaygroundTerminal: React.FC = () => {
    const terminalRef = useRef<TerminalHandle | null>(null);

    const {state, pyodide} = useEnvironmentSetup();

    const setupComplete = useRef<boolean>(false);
    const initialMessagePrinted = useRef(false);
    const pyconsoleRef = useRef<PyodideConsoleLike | null>(null);
    const PS1 = ">>> ";
    const PS2 = "... ";

    const completionHandler = useMemo(
        () => (command: string, callback: (result: string[]) => void) => {
            const pyconsole = pyconsoleRef.current;
            if (!pyconsole) {
                callback([]);
                return;
            }
            try {
                const completionProxy = pyconsole.complete(command);
                // toJs returns [completions, cursor]
                const [completions] = completionProxy.toJs();
                completionProxy.destroy?.();
                callback(completions ?? []);
            } catch (error) {
                console.warn("Completion failed", error);
                callback([]);
            }
        },
        [],
    );

    const terminalOptions = useMemo(() => ({
        completionEscape: false,
        completion: completionHandler,
        keymap: {
            "CTRL+C": () => {
                const pyconsole = pyconsoleRef.current;
                const term = terminalRef.current;
                if (!pyconsole || !term) {
                    return;
                }
                pyconsole.buffer.clear();
                term.enter();
                term.echo("KeyboardInterrupt");
                term.setCommand("");
                term.setPrompt(PS1);
            },
            TAB: (event: KeyboardEvent, original: (event: KeyboardEvent) => unknown) => {
                const term = terminalRef.current;
                if (!term) {
                    return original(event);
                }
                const command = term.beforeCursor?.() ?? "";
                if (command.trim() === "") {
                    term.insert?.("\t");
                    return false;
                }
                return original(event);
            },
        },
    }), [completionHandler]);

    useEffect(() => {
        if (initialMessagePrinted.current) {
            return;
        }
        terminalRef.current.echo("Setting up environment...");
        terminalRef.current.freeze(true);
        terminalRef.current.setPrompt("");
        initialMessagePrinted.current = true;
    }, []);

    useEffect(() => {
        if (state.environmentStatus === EnvironmentStatus.WaitBitbakeOrPyodide) {
            let s = "";
            switch (state.pyodideStatus) {
                case PyodideStatus.Idle:
                    s = "idle";
                    break;
                case PyodideStatus.Fetching:
                    s = "fetching...";
                    break;
                case PyodideStatus.Loading:
                    s = "loading...";
                    break;
                case PyodideStatus.Done:
                    s = "done!";
                    break;
                case PyodideStatus.Inactive:
                    s = "inactive";
                    break;
            }

            terminalRef.current.setPrompt(
                `Downloading BitBake: ${progress(state.bitbakeProgress, 30)}%\nPyodide: ${s}`
            )
        } else {
            switch (state.environmentStatus) {
                case EnvironmentStatus.UnpackingBitbake:
                    terminalRef.current.setPrompt(
                        `Unpacking BitBake...`
                    )
                    break;
                case EnvironmentStatus.LoadingSqlite3:
                    terminalRef.current.setPrompt(
                        `Loading sqlite3...`
                    )
                    break;
                case EnvironmentStatus.Configuring:
                    terminalRef.current.setPrompt(
                        `Installing import hooks...`
                    )
                    break;
                case EnvironmentStatus.ImportingBitbake:
                    terminalRef.current.setPrompt(
                        `Importing BitBake...`
                    )
                    break;
                case EnvironmentStatus.Ready:
                    if (!setupComplete.current) {
                        setupComplete.current = true;

                        const termHandle = terminalRef.current;
                        if (!termHandle) {
                            return;
                        }
                        const termInstance = termHandle.getInstance();
                        if (!termInstance) {
                            return;
                        }
                        const interpreter = create_interpreter(pyodide, termInstance, (consoleProxy) => {
                            pyconsoleRef.current = consoleProxy;
                        });
                        termHandle.setInterpreter(interpreter);

                        terminalRef.current.echo("Ready :)\n");
                        termHandle.setPrompt(PS1);
                        termHandle.exec("d = DataSmart()")
                        termHandle.exec(`d.setVar('P', 'Are you \${MOD} \${ADJ}')`);
                        termHandle.exec(`d.setVar('MOD', 'not')`);
                        termHandle.exec(`d.setVar('ADJ', 'enter')`);
                        termHandle.exec(`d.setVar('ADJ:append', 'tained')`);
                        termHandle.exec(`d.setVar('P:append', '?')`);
                        termHandle.exec(`print(d.expand("\${P}"))`);

                        termHandle.freeze(false);
                        termHandle.focus?.(false);
                    }
                    break;
            }
        }
    }, [pyodide, state]);

    return (<JQueryTerminal ref={terminalRef} options={terminalOptions}/>)
}
