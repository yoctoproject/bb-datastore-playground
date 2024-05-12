import React, {useImperativeHandle, forwardRef, useRef, useEffect} from "react";
import * as $ from "jquery";
import 'jquery.terminal';
import 'jquery.terminal/css/jquery.terminal.min.css';
import {terminal} from "jquery";

interface Props {
    interpreter?: TypeOrArray<JQueryTerminal.Interpreter>,
    options?: JQueryTerminal.TerminalOptions
}

const BANNER = `
 __ __   __   __ _____ __    __ _____ __  ___ ___   ___ _    __ __   __ __ ___  __  _  _ __  _ __  
|  \\  \\ | _\\ /  \\_   _/  \\ /' _/_   _/__\\| _ \\ __| | _,\\ |  /  \\\\ \`v' // _] _ \\/__\\| || |  \\| | _\\ 
| -< -< | v | /\\ || || /\\ |\`._\`. | || \\/ | v / _|  | v_/ |_| /\\ |\`. .'| [/\\ v / \\/ | \\/ | | ' | v |
|__/__/ |__/|_||_||_||_||_||___/ |_| \\__/|_|_\\___| |_| |___|_||_| !_!  \\__/_|_\\\\__/ \\__/|_|\\__|__/ 

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
            freeze: () => {
                terminalObjectRef.current?.freeze(true);
                terminalObjectRef.current?.set_prompt("");
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
    }, []);

    return <div ref={terminalContainerRef} id="terminal" style={{height: '300px'}}></div>;
});