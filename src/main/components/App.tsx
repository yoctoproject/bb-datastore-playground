import React, {useEffect} from "react";
import 'flexlayout-react/style/light.css';
import {Button, ButtonGroup, Dropdown, DropdownButton} from "react-bootstrap";
import ButtonToolbar from 'react-bootstrap/ButtonToolbar'
import {AppLayout} from "./layout";
import {useDispatch} from "react-redux";
import {useManagedWorker} from "../hooks/usePyodideWorker";
import {fetchDataFromWorker} from "../api/thunks/pyodide";

export const App: React.FC = () => {
    const workerUuid = useManagedWorker();
    const dispatch = useDispatch();

    useEffect(() => {
        (async () => {
            if (workerUuid) {
                console.log("invoking: " + workerUuid)
                dispatch(fetchDataFromWorker(workerUuid));
                //dispatch(setWorkerReducer(worker));
            }
        })();
    }, [dispatch, workerUuid])

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