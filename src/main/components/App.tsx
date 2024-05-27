import React, {useContext, useEffect} from "react";
import 'flexlayout-react/style/light.css';
import {Button, ButtonGroup, Dropdown, DropdownButton} from "react-bootstrap";
import ButtonToolbar from 'react-bootstrap/ButtonToolbar'
import {AppLayout} from "./layout";
import {useDispatch} from "react-redux";
import {useManagedWorker} from "../hooks/usePyodideWorker";
import {fetchDataFromWorker} from "../api/thunks/pyodide";
import {useServiceWorkerStore} from "../store";

export const App: React.FC = () => {
    const workerUuid = useManagedWorker();
    const dispatch = useDispatch();

    const serviceWorkerProxy = useServiceWorkerStore((state) => state.serviceWorker);

    useEffect(() => {
        (async () => {
            if (workerUuid) {
                console.log("invoking: " + workerUuid)
                dispatch(fetchDataFromWorker(workerUuid));
                //dispatch(setWorkerReducer(worker));
            }
        })();
    }, [dispatch, workerUuid])

    useEffect(() => {
        (async () => {
            const getUserResponse = await fetch("https://api.github.com/user", {
                headers: {
                    accept: "application/vnd.github.v3+json",
                }
            });
            const p = await getUserResponse.json();
            console.log("LOGIN: " + JSON.stringify(p));
        })();
    }, []);

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