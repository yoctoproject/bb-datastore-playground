import React, {useEffect, useRef} from 'react';
import * as $ from "jquery";
import 'jquery.terminal';
import 'jquery.terminal/css/jquery.terminal.min.css';
import {PyodideInterface} from "pyodide";


interface Props {
    pyodide: PyodideInterface
}

const TerminalComponent: React.FC<Props> = (props) => {
    const terminalContainerRef = useRef(null);
    const terminalObjectRef = useRef<JQueryTerminal>(null);

    function sleep(s) {
        return new Promise((resolve) => setTimeout(resolve, s));
    }

    const pyodide = props.pyodide;
    let {repr_shorten, BANNER, PyodideConsole} = pyodide.pyimport("pyodide.console");

    pyodide.setStdin({
        stdin: () => {
            const result = prompt();
            echo(result);
            return result;
        }
    })

    BANNER =
        `Welcome to the Pyodide ${pyodide.version} terminal emulator 🐍\n` +
        BANNER;
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
        if (terminalObjectRef.current) {
            return terminalObjectRef.current.echo(
                msg
                    .replaceAll("]]", "&rsqb;&rsqb;")
                    .replaceAll("[[", "&lsqb;&lsqb;"),
                ...opts,
            );
        }
    };

    async function lock() {
        if (!terminalObjectRef.current) {
            return;
        }

        const term = terminalObjectRef.current;

        let resolve;
        const ready = term.ready;
        term.ready = new Promise((res) => (resolve = res));
        await ready;
        return resolve;
    }

    const ps1 = ">>> ";
    const ps2 = "... ";

    async function interpreter(command) {
        if (!terminalObjectRef.current) {
            return;
        }

        const term = terminalObjectRef.current;

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

    useEffect(() => {
        const currentTerminal = terminalContainerRef.current;

        if (currentTerminal) {
            terminalObjectRef.current = $(currentTerminal).terminal(interpreter, {
                prompt: ">>>",
            });

            pyconsole.stdout_callback = (s) => echo(s, { newline: false });
            pyconsole.stderr_callback = (s) => {
                terminalObjectRef.current.error(s.trimEnd());
            };
        }

        // Cleanup function to be called when the component unmounts
        return () => {
            if (currentTerminal) {
                $(currentTerminal).remove();
            }
            if (terminalObjectRef.current) {
                terminalObjectRef.current = null;
            }
        };
    }, [interpreter, pyconsole]);  // Empty dependency array ensures this effect runs only once after initial render

    // Render a div that will host the jQuery Terminal
    return <div ref={terminalContainerRef} id="terminal" style={{height: '300px'}}></div>;
};

export default TerminalComponent;
