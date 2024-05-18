import React, {useEffect} from "react";
import {createWorkerFactory, useWorker} from "@shopify/react-web-worker";
import 'flexlayout-react/style/light.css';
import {Button, ButtonGroup, Dropdown, DropdownButton} from "react-bootstrap";
import ButtonToolbar from 'react-bootstrap/ButtonToolbar'
import {MainNavbar} from "./MainNavbar";
import {AppLayout} from "./layout";
import {useMountedRef} from "@shopify/react-hooks";
import {useDispatch} from "react-redux";
import {setWorker} from "../api/webWorkerApiSlice";


const createWorker = createWorkerFactory(() => import('../../pyodide-worker/worker'));

const wat = (str: string) => {
    console.error("P " + str);
}

export const App: React.FC = () => {
    const mounted = useMountedRef();
    const worker = useWorker(createWorker);

    useEffect(() => {
        (async () => {
            console.log(worker);
            if (mounted.current) {
                console.log("calling setProgressCallback");
               // await worker.setProgressCallback(wat);
            } else {
                console.log("avoided the call!");
            }

            if (mounted.current) {
                //await worker.runPython("print(1 + 2)", new URL("../../../assets/bitbake-2.8.0.zip", import.meta.url).toString())
            } else {
                console.log("avoided the call!")
            }
        })();

        return () => {
            console.log("cleanup")
        }
    }, [mounted, worker])

    const dispatch = useDispatch();

    useEffect(() => {
        dispatch(setWorker(worker)); // Dispatch an action to set the worker instance in Redux

        return () => {
            dispatch(setWorker(null));
        }
    }, [dispatch, worker]);

    return (
        <div>
            <MainNavbar/>
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