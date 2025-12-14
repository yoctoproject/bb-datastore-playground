import { IJsonModel } from "flexlayout-react/src/model/IJsonModel";
import { Layout, Model, TabNode } from "flexlayout-react";
import React from "react";
import { StatusPanel } from "./statusPanel";
import { EditorWrapper } from "./editorPanel";
import root from "react-shadow";
import { PlaygroundTerminal } from "./PlaygroundTerminal";
import { usePyodideWorker } from "../hooks/usePyodideWorker";

import bootstrapStylesheetUrl from "bootstrap/dist/css/bootstrap.min.css?url";
import mainStylesheetUrl from "../../styles/common.scss?url";
import jqueryTerminalStylesheetUrl from "jquery.terminal/css/jquery.terminal.min.css?url";
import flexLayoutStylesheetUrl from "flexlayout-react/style/light.css?url";

const json: IJsonModel = {
    global: {},
    borders: [],
    layout: {
        type: "row",
        weight: 100,
        children: [
            {
                type: "tabset",
                weight: 50,
                children: [
                    {
                        type: "tab",
                        name: "Editor",
                        component: "test",
                    },
                ],
            },
            {
                type: "row",
                weight: 50,
                children: [
                    {
                        type: "tabset",
                        weight: 60,
                        children: [
                            {
                                type: "tab",
                                name: "Terminal",
                                component: "terminal",
                            },
                        ],
                    },
                    {
                        type: "tabset",
                        weight: 40,
                        children: [
                            {
                                type: "tab",
                                name: "Status",
                                component: "status_panel",
                            },
                        ],
                    },
                ],
            },
        ],
    },
};

const model = Model.fromJson(json);

const LayoutWrapper = () => {
    const { workerState, getClient } = usePyodideWorker();

    const factory = (node: TabNode) => {
        const component = node.getComponent();
        const client = getClient();
        const status = workerState.status;
        if (component === "terminal") {
            if (!client || status === "error") {
                return <div className="p-3">Pyodide failed to start.</div>;
            }
            if (status !== "ready") {
                return <div className="p-3">Pyodide is starting...</div>;
            }
            return <PlaygroundTerminal client={client} />;
        } else if (component === "test") {
            return <EditorWrapper />;
        } else if (component === "status_panel") {
            return <StatusPanel />;
        }
    };

    return (
        <div className="d-flex flex-column ps-2">
            <root.div className="vh-100">
                <link href={bootstrapStylesheetUrl} rel="stylesheet" />
                <link href={mainStylesheetUrl} rel="stylesheet" />
                <link href={jqueryTerminalStylesheetUrl} rel="stylesheet" />
                <link href={flexLayoutStylesheetUrl} rel="stylesheet" />
                <div className="position-relative vh-100 top-0 bottom-0">
                    <Layout model={model} factory={factory} />
                </div>
            </root.div>
        </div>
    );
};

export const AppLayout: React.FC = () => {
    return (
        <>
            <LayoutWrapper />
        </>
    );
};
