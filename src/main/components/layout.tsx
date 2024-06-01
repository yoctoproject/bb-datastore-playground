import {IJsonModel} from "flexlayout-react/src/model/IJsonModel";
import {Layout, Model, TabNode} from "flexlayout-react";
import React from "react";
import {StatusPanel} from "./statusPanel";
import {EditorWrapper} from "./editorPanel";
import {JQueryTerminal} from "./JQueryTerminal";
import {RichTreeView, TreeViewBaseItem} from "@mui/x-tree-view";
import {Allotment} from "allotment";
import "allotment/dist/style.css";
import Frame, {useFrame} from 'react-frame-component';
import {Sizing} from "allotment/dist/types/src/split-view";
import {Split} from "@geoffcox/react-splitter";

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
                children: [
                    {
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


const MUI_X_PRODUCTS: TreeViewBaseItem[] = [
    {
        id: 'grid',
        label: 'Data Grid',
        children: [
            {id: 'grid-community', label: '@mui/x-data-grid'},
            {id: 'grid-pro', label: '@mui/x-data-grid-pro'},
            {id: 'grid-premium', label: '@mui/x-data-grid-premium'},
        ],
    },
    {
        id: 'pickers',
        label: 'Date and Time Pickers',
        children: [
            {id: 'pickers-community', label: '@mui/x-date-pickers'},
            {id: 'pickers-pro', label: '@mui/x-date-pickers-pro'},
        ],
    },
    {
        id: 'charts',
        label: 'Charts',
        children: [{id: 'charts-community', label: '@mui/x-charts'}],
    },
    {
        id: 'tree-view',
        label: 'Tree View',
        children: [{id: 'tree-view-community', label: '@mui/x-tree-view'}],
    },
];

function BasicRichTreeView() {
    return (
        <RichTreeView items={MUI_X_PRODUCTS}/>
    );
}

const InnerComponent = () => {
    // Hook returns iframe's window and document instances from Frame context
    const {document: doc, window} = useFrame();
    // query document of parent
    const styleTag = document.head.querySelector("style");
    const frameStyles = styleTag.cloneNode(true);

    // doc is reference to iframe document
    doc.head.append(frameStyles);
    return null;
};


export const AppLayout: React.FC = () => {
    const factory = (node: TabNode) => {
        const component = node.getComponent();

        if (component === "terminal") {
            return <JQueryTerminal/>;
        } else if (component === "test") {
            return <EditorWrapper/>;
        } else if (component === "status_panel") {
            return <StatusPanel/>;
        }
    }

    return (
        <Split initialPrimarySize="20%">
            <BasicRichTreeView/>
            <div className="d-flex flex-column">
                <h1>
                    OK buddy :)
                </h1>
                <Frame>
                    <Layout
                        model={model}
                        factory={factory}
                    />
                </Frame>
            </div>
        </Split>
    );
}

