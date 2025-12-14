import { JQueryTerminal } from "./JQueryTerminal";
import React, { useEffect, useMemo, useRef } from "react";
import type { Remote } from "comlink";
import type { MyWorker } from "../../pyodide-worker/worker";

const PS1 = ">>> ";

type TerminalHandle = {
    echo: (
        message: string,
        options?: JQueryTerminal.animationOptions & JQueryTerminal.EchoOptions
    ) => void;
    error: (message: string) => void;
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

type PlaygroundTerminalProps = {
    client: Remote<MyWorker>;
};

export const PlaygroundTerminal: React.FC<PlaygroundTerminalProps> = ({
    client,
}) => {
    const terminalRef = useRef<TerminalHandle | null>(null);
    const setupComplete = useRef<boolean>(false);

    const terminalOptions = useMemo(() => {
        const completionHandler = (
            command: string,
            callback: (result: string[]) => void
        ) => {
            client
                .complete(command)
                .then((completions) => callback(completions ?? []))
                .catch((error) => {
                    console.warn("Completion failed", error);
                    callback([]);
                });
        };

        return {
            completionEscape: false,
            completion: completionHandler,
            keymap: {
                "CTRL+C": () => {
                    const term = terminalRef.current;
                    if (!term) {
                        return;
                    }
                    client.interrupt();
                    term.enter();
                    term.echo("KeyboardInterrupt");
                    term.setCommand("");
                    term.setPrompt(PS1);
                },
                TAB: (
                    event: KeyboardEvent,
                    original: (event: KeyboardEvent) => unknown
                ) => {
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
        };
    }, [client]);

    useEffect(() => {
        const termHandle = terminalRef.current;
        if (!termHandle || setupComplete.current) {
            return;
        }
        setupComplete.current = true;
        termHandle.setPrompt("Preparing Pyodide...");

        const bootstrap = async () => {
            try {
                await client.initConsole();
                const interpreter = async (command: string) => {
                    const term = terminalRef.current;
                    if (!term) {
                        return;
                    }

                    const { outputs, prompt } =
                        await client.runConsole(command);

                    outputs.forEach(({ type, text, newline }) => {
                        if (type === "stdout") {
                            term.echo(
                                text
                                    .replaceAll("]]", "&rsqb;&rsqb;")
                                    .replaceAll("[[", "&lsqb;&lsqb;"),
                                { newline: newline !== false }
                            );
                        } else {
                            term.error(text);
                        }
                    });

                    term.setPrompt(prompt ?? PS1);
                    term.freeze(false);
                };

                termHandle.setInterpreter(
                    interpreter as unknown as JQueryTerminal.Interpreter
                );

                termHandle.setPrompt(PS1);
            } catch (err) {
                const term = terminalRef.current;
                term?.error(
                    `Failed to initialize Pyodide console: ${String(err)}`
                );
                term?.freeze(false);
            }
        };

        void bootstrap();
    }, [client]);

    return <JQueryTerminal ref={terminalRef} options={terminalOptions} />;
};
