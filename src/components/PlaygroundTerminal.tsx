import {JQueryTerminal} from "./JQueryTerminal";
import React, {useEffect, useRef} from "react";
import {EnvironmentStatus, useEnvironmentSetup} from "../hooks/useEnvironmentSetup";
import {PyodideStatus} from "../hooks/usePyodide";
import {PyodideInterface} from "pyodide";

// Taken from https://terminal.jcubic.pl/examples.php
function progress(percent, width) {
    var size = Math.round(width*percent/100);
    var left = '', taken = '', i;
    for (i=size; i--;) {
        taken += '=';
    }
    if (taken.length > 0) {
        taken = taken.replace(/=$/, '>');
    }
    for (i=width-size; i--;) {
        left += ' ';
    }
    return '[' + taken + left + '] ' + percent + '%';
}

// Terminal code largely taken from https://github.com/pyodide/pyodide/blob/main/src/templates/console.html
function sleep(s) {
    return new Promise((resolve) => setTimeout(resolve, s));
}

function create_interpreter(pyodide: PyodideInterface, term: JQueryTerminal) {
    let {repr_shorten, PyodideConsole} = pyodide.pyimport("pyodide.console");
    const pyconsole = PyodideConsole(pyodide.globals);

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

    const ps1 = ">>> ";
    const ps2 = "... ";

    async function interpreter(command, term: JQueryTerminal) {
        const unlock = await lock();
        term.pause();
        // multiline should be split (useful when pasting)
        for (const c of command.split("\n")) {
            const escaped = c.replaceAll(/\u00a0/g, " ");
            const fut = pyconsole.push(escaped);
            term.set_prompt(fut.syntax_check === "incomplete" ? ps2 : ps1);
            switch (fut.syntax_check) {
                case "syntax-error":
                    term.error(fut.formatted_error.trimEnd());
                    continue;
                case "incomplete":
                    continue;
                case "complete":
                    break;
                default:
                    throw new Error(`Unexpected type ${ty}`);
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

    pyconsole.stdout_callback = (s) => echo(s, { newline: false });
    pyconsole.stderr_callback = (s) => {
        term.error(s.trimEnd());
    };

    return interpreter;
}

export const PlaygroundTerminal: React.FC = () => {
    const terminalRef = useRef(null);

    const {state, pyodide} = useEnvironmentSetup();

    const setupComplete = useRef<boolean>(false);

    useEffect(() => {
        terminalRef.current.echo("Setting up environment...");
        terminalRef.current.freeze(true);
        terminalRef.current.setPrompt("");
    }, [])

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

                        terminalRef.current.setInterpreter(create_interpreter(pyodide, terminalRef.current));

                        terminalRef.current.echo("Ready :)\n");
                        terminalRef.current.setPrompt(">>> ");
                        terminalRef.current.exec("d = DataSmart()")
                        terminalRef.current.exec(`d.setVar('P', 'Are you \${MOD} \${ADJ}')`);
                        terminalRef.current.exec(`d.setVar('MOD', 'not')`);
                        terminalRef.current.exec(`d.setVar('ADJ', 'enter')`);
                        terminalRef.current.exec(`d.setVar('ADJ:append', 'tained')`);
                        terminalRef.current.exec(`d.setVar('P:append', '?')`);
                        terminalRef.current.exec(`print(d.expand("\${P}"))`);

                        terminalRef.current.freeze(false);
                    }
                    break;
            }
        }
    }, [pyodide, state]);

    return (<JQueryTerminal ref={terminalRef}/>)
}