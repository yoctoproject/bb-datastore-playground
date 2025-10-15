import React, {forwardRef, useEffect, useImperativeHandle, useRef} from "react";
import $ from "jquery";
import jqueryTerminalFactory from "jquery.terminal";

import 'jquery.terminal/css/jquery.terminal.min.css';
import jqueryTerminalStylesheetUrl from "jquery.terminal/css/jquery.terminal.min.css?url";

type JQueryStatic = typeof $;

const globalScope = globalThis as typeof globalThis & {
    $?: JQueryStatic;
    jQuery?: JQueryStatic;
};

if (!globalScope.$) {
    globalScope.$ = $;
}

if (!globalScope.jQuery) {
    globalScope.jQuery = $;
}

const maybeInitTerminal = jqueryTerminalFactory as unknown as ((root?: typeof globalThis, jQuery?: JQueryStatic) => void) | undefined;

if (typeof maybeInitTerminal === "function") {
    maybeInitTerminal(globalScope, $);
}

interface Props {
    interpreter?: TypeOrArray<JQueryTerminal.Interpreter>,
    options?: JQueryTerminal.TerminalOptions
}

const BANNER = `Copyright (C) Agilent Technologies 2024`;

export const JQueryTerminal: React.ForwardRefExoticComponent<React.PropsWithoutRef<Props> & React.RefAttributes<unknown>> = forwardRef(function JQueryTerminal(props: Props, ref) {
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
            beforeCursor: () => {
                return terminalObjectRef.current?.before_cursor();
            },
            insert: (text: string) => {
                terminalObjectRef.current?.insert(text);
            },
            enter: () => {
                terminalObjectRef.current?.enter();
            },
            setCommand: (value: string) => {
                terminalObjectRef.current?.set_command(value);
            },
            error: (message: string) => {
                terminalObjectRef.current?.error(message);
            },
            getInstance: () => terminalObjectRef.current,
            setInterpreter: (interpreter?: TypeOrArray<JQueryTerminal.Interpreter>) => {
                if (terminalObjectRef.current) {
                    terminalObjectRef.current.set_interpreter(interpreter);
                }
            }
        };
    }, []);

    useEffect(() => {
        const obj: JQueryTerminal | null = terminalObjectRef.current;

        terminalObjectRef.current = $(terminalContainerRef.current).terminal(props.interpreter, {
            greetings: BANNER,
            ...props.options
        });

        return () => {
            if (obj) {
                obj.destroy();
                terminalObjectRef.current = null;
            }
        };
    }, [props.interpreter, props.options]);

    return (
        <>
            <link href={jqueryTerminalStylesheetUrl} rel="stylesheet"/>
            <div ref={terminalContainerRef} style={{height: '600px'}}></div>
        </>
    );
});
