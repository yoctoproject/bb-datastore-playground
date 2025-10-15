import React, {useEffect} from "react";
import 'flexlayout-react/style/light.css';
import {AppLayout} from "./layout";
import {useDispatch} from "react-redux";
import {useManagedWorker} from "../hooks/usePyodideWorker";
import {fetchDataFromWorker} from "../api/thunks/pyodide";
import ToastManager from "./ToastManager";

export const App: React.FC = () => {
    const workerUuid = useManagedWorker();
    const dispatch = useDispatch();

    useEffect(() => {
        (async () => {
            if (workerUuid) {
                console.log("invoking: " + workerUuid)
                dispatch(fetchDataFromWorker(workerUuid));
            }
        })();
    }, [dispatch, workerUuid])

    return (
        <>
            <ToastManager/>
            <AppLayout/>
        </>
    );
};