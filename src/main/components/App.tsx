import React, {useEffect, useMemo, useRef} from "react";

import {PlaygroundTerminal} from "./PlaygroundTerminal";
import AceEditor from "react-ace";
import BitBakeMode from "../BitBakeMode";
import {createWorkerFactory, useWorker} from "@shopify/react-web-worker";
import {Layout, Model} from 'flexlayout-react';
import 'flexlayout-react/style/light.css';
import {Button, ButtonGroup, Container, Dropdown, DropdownButton, Navbar} from "react-bootstrap";
import ButtonToolbar from 'react-bootstrap/ButtonToolbar'
import {IJsonModel} from "flexlayout-react/src/model/IJsonModel";


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
                type: "tabset",
                weight: 50,
                children: [
                    {
                        type: "tab",
                        name: "Terminal",
                        component: "button",
                    }
                ]
            },
        ]
    }
};

const model = Model.fromJson(json);

const EditorWrapper = () => {

    const editor = useRef(null);

    useEffect(() => {
        editor.current.editor.getSession().setMode(new BitBakeMode());
    }, []);

    return (
        <div>
            {/*<ButtonToolbar>*/}
            {/*    <ButtonGroup>*/}
            {/*        <Button>1</Button>*/}
            {/*        <Button>2</Button>*/}

            {/*        <DropdownButton as={ButtonGroup} title="Dropdown" id="bg-nested-dropdown">*/}
            {/*            <Dropdown.Item eventKey="1">Dropdown link</Dropdown.Item>*/}
            {/*            <Dropdown.Item eventKey="2">Dropdown link</Dropdown.Item>*/}
            {/*        </DropdownButton>*/}
            {/*    </ButtonGroup>*/}
            {/*</ButtonToolbar>*/}
            <AceEditor
                ref={editor}
                mode="text"
                theme="github"
                editorProps={{$blockScrolling: true}}
            />
        </div>
    );
}

function Wat2() {

    const factory = (node) => {
        const component = node.getComponent();

        if (component === "button") {
            return <PlaygroundTerminal/>;
        } else if (component === "test") {
            return <EditorWrapper/>
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


const createWorker = createWorkerFactory(() => import('../../pyodide-worker/worker'));

const wat = (str: string) => {
    console.error(str);
}

export const App: React.FC = () => {
    const worker = useWorker(createWorker);

    useEffect(() => {
        (async () => {
            await worker.setProgressCallback(wat);
            await worker.runPython("print(1 + 2)", new URL("../../../assets/bitbake-2.8.0.zip", import.meta.url).toString())
        })();
    }, [worker])

    return (
        <div>
            <Navbar className="bg-body-tertiary">
                <Container fluid>
                    <Navbar.Brand href="#home" className="align-items-center d-flex">
                        <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" fill="currentColor"
                             className="bi bi-play-fill" viewBox="0 0 16 16">
                            <path
                                d="m11.596 8.697-6.363 3.692c-.54.313-1.233-.066-1.233-.697V4.308c0-.63.692-1.01 1.233-.696l6.363 3.692a.802.802 0 0 1 0 1.393"/>
                        </svg>
                        {' '}
                        BB Datastore Playground
                    </Navbar.Brand>
                </Container>
            </Navbar>
            <Wat2/>
        </div>
    );
};