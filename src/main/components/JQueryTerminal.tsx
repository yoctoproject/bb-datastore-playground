import React, {useImperativeHandle, forwardRef, useRef, useEffect} from "react";
import * as $ from "jquery";
import 'jquery.terminal';
import 'jquery.terminal/css/jquery.terminal.min.css';
import {terminal} from "jquery";
import {usePyodide} from "../hooks/usePyodide";

interface Props {
    interpreter?: TypeOrArray<JQueryTerminal.Interpreter>,
    options?: JQueryTerminal.TerminalOptions
}

const BANNER = `
Copyright (C) Agilent Technologies 2024
`;

export const JQueryTerminal: React.ForwardRefExoticComponent<React.PropsWithoutRef<Props> & React.RefAttributes<unknown>> = forwardRef(function JQueryTerminal(props, ref) {
    const terminalContainerRef = useRef(null);
    const terminalObjectRef = useRef<JQueryTerminal>(null);

    useImperativeHandle(ref, () => {
        return {
            echo: async (arg: string, options: JQueryTerminal.animationOptions & JQueryTerminal.EchoOptions) => {
                if (terminalObjectRef.current) {
                    return terminalObjectRef.current.echo(arg, options);
                }
            },
            update: (line: number, str: string) => {
                terminalObjectRef.current?.update(line, str);
            },
            freeze: (toggle?: boolean) => {
                terminalObjectRef.current?.freeze(toggle);
            },
            setPrompt: (prompt) => {
                terminalObjectRef.current?.set_prompt(prompt);
            },
            exec: (str: string) => {
                terminalObjectRef.current?.exec(str);
            },
            setInterpreter: (interpreter?: TypeOrArray<JQueryTerminal.Interpreter>) => {
                if (terminalObjectRef.current) {
                    terminalObjectRef.current.set_interpreter(interpreter);
                }
            }
        };
    }, []);

    useEffect(() => {
        const currentTerminal = terminalContainerRef.current;

        if (currentTerminal) {
            terminalObjectRef.current = $(currentTerminal).terminal(props.interpreter, {
                greetings: BANNER,
                ...props.options
            });
        }

        return () => {
            if (currentTerminal) {
                $(currentTerminal).remove();
            }
            if (terminalObjectRef.current) {
                terminalObjectRef.current = null;
            }
        };
    }, [props.interpreter, props.options]);

    return <div ref={terminalContainerRef} id="terminal" style={{height: '600px'}}></div>;
});