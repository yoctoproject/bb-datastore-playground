import {JQueryTerminal} from "./JQueryTerminal";
import React, {useEffect, useRef} from "react";
import {usePyodide} from "../hooks/usePyodide";

import {terminal} from "jquery";
import {useEnvironmentSetup} from "../hooks/useEnvironmentSetup";

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

export const PlaygroundTerminal: React.FC = () => {
    const terminalRef = useRef(null);

    const {state} = useEnvironmentSetup();

    useEffect(() => {
        terminalRef.current.echo("Setting up environment");
        terminalRef.current.freeze();
    }, [])

    useEffect(() => {
        if (state.pyodideStatus === "idle") {
            terminalRef.current.echo(`Pyodide: ${state.pyodideStatus}`);
            terminalRef.current.echo(`Downloading bitbake: ${progress(state.bitbakeProgress, 80)}%`);
        }

        terminalRef.current.update(-1, `Pyodide: ${state.pyodideStatus}`);
        terminalRef.current.update(-2, `Downloading bitbake: ${progress(state.bitbakeProgress, 80)}%`);
    }, [state]);
    //
    // useEffect(() => {
    //     if (done && pyodide) {
    //         terminalRef.current.echo("Unpacking BitBake...");
    //         pyodide.unpackArchive(data, "zip", {
    //             extractDir: "bb"
    //         });
    //         terminalRef.current.echo("Done!");
    //     }
    // }, [data, done, pyodide]);

    const interpreter = (command, term) => {

    };

    return (<JQueryTerminal interpreter={interpreter} ref={terminalRef}/>)
}