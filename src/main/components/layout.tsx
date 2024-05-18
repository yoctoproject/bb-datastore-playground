import {IJsonModel} from "flexlayout-react/src/model/IJsonModel";
import {Layout, Model, TabNode} from "flexlayout-react";
import {PlaygroundTerminal} from "./PlaygroundTerminal";
import React from "react";
import {StatusPanel} from "./statusPanel";
import {EditorWrapper} from "./editorPanel";
import {JQueryTerminal} from "./JQueryTerminal";

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
                    }
                ]
            },
            {
                type: "row",
                weight: 50,
                children: [{
                    type: "tabset",
                    weight: 60,
                    children: [
                        {
                            type: "tab",
                            name: "Terminal",
                            component: "terminal",
                        }
                    ]
                },
                    {
                        type: "tabset",
                        weight: 40,
                        children: [
                            {
                                type: "tab",
                                name: "Status",
                                component: "status_panel",
                            }
                        ]
                    }
                ]
            },
        ]
    }
};

const model = Model.fromJson(json);

export const AppLayout: React.FC = () => {
    const factory = (node: TabNode) => {
        const component = node.getComponent();

        if (component === "terminal") {
            return <JQueryTerminal/>;
        } else if (component === "test") {
            return <EditorWrapper/>
        } else if (component === "status_panel") {
            return <StatusPanel/>
        }
    }

    return (
        <div style={{position: "relative", height: "calc(100vh - 56px)"}}>
            <Layout
                model={model}
                factory={factory}
            />
        </div>
    );
}

