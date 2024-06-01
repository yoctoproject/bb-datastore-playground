import {IJsonModel} from "flexlayout-react/src/model/IJsonModel";
import {Layout, Model, TabNode} from "flexlayout-react";
import React, {lazy, useRef, useState} from "react";
import {StatusPanel} from "./statusPanel";
import {JQueryTerminal} from "./JQueryTerminal";
import {RichTreeView, TreeViewBaseItem} from "@mui/x-tree-view";
import "allotment/dist/style.css";
import Frame from 'react-frame-component';
import {Split} from "@geoffcox/react-splitter";
import {EditorWrapper} from "./editorPanel";
import {Breadcrumb} from "react-bootstrap";
import {Allotment} from "allotment";

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

    const [isResizing, setIsResizing] = useState(false);

    const startResizing = () => {
        document.body.style.userSelect = 'none';
        setIsResizing(true);
    };

    const endResizing = () => {
        document.body.style.userSelect = '';
        setIsResizing(false);
    }

    return (
        <Allotment defaultSizes={[20, 80]} onDragStart={startResizing} onDragEnd={endResizing}>
            <BasicRichTreeView/>
            <div className="d-flex flex-column">
                <Breadcrumb>
                    <Breadcrumb.Item href="#">Home</Breadcrumb.Item>
                    <Breadcrumb.Item href="https://getbootstrap.com/docs/4.0/components/breadcrumb/">
                        Library
                    </Breadcrumb.Item>
                    <Breadcrumb.Item active>Data</Breadcrumb.Item>
                </Breadcrumb>
                <Frame className="vh-100" style={{pointerEvents: isResizing ? "none" : "auto"}}>
                    <link href="/main.css" rel="stylesheet"/>
                    <div className="position-relative vh-100 top-0 bottom-0">
                        <Layout
                            model={model}
                            factory={factory}
                        />
                    </div>
                </Frame>
            </div>
        </Allotment>
    );

}

