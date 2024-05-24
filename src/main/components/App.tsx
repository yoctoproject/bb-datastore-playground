import React, {useEffect, useMemo, useState} from "react";
import 'flexlayout-react/style/light.css';
import {Button, ButtonGroup, Dropdown, DropdownButton} from "react-bootstrap";
import ButtonToolbar from 'react-bootstrap/ButtonToolbar'
import {MainNavbar} from "./MainNavbar";
import {AppLayout} from "./layout";
import {MyWorker} from "../../pyodide-worker/worker";

import * as comlink from "comlink";
import {Remote} from "comlink";
import {setWorkerReducer} from "../api/webWorkerApiSlice";
import {useDispatch} from "react-redux";


const w = new Worker(new URL("../../pyodide-worker/worker.ts", import.meta.url));

export const App: React.FC = () => {
    const [worker, setWorker] = useState<Remote<MyWorker>>(null)

    useEffect(() => {
        let active = true;
        load();
        return () => { active = false };

        async function load() {
            const wrapped = comlink.wrap<typeof MyWorker>(w);
            const res = await new wrapped();
            if (!active) { return; }
            setWorker(() => res);
        }
    }, [])

    const dispatch = useDispatch();

    useEffect(() => {
        (async () => {
            if (worker) {
                await worker.test();
                //dispatch(setWorkerReducer(worker));
            }
        })();
    }, [dispatch, worker])

    return (
        <div>
            <ButtonToolbar>
                <ButtonGroup>
                    <Button>1</Button>
                    <Button>2</Button>

                    <DropdownButton as={ButtonGroup} title="Dropdown" id="bg-nested-dropdown">
                        <Dropdown.Item eventKey="1">Dropdown link</Dropdown.Item>
                        <Dropdown.Item eventKey="2">Dropdown link</Dropdown.Item>
                    </DropdownButton>
                </ButtonGroup>
            </ButtonToolbar>
            <AppLayout/>
        </div>
    );
};