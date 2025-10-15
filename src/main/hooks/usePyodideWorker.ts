import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import {createWorker, terminateWorker} from "../api/thunks/pyodide";

export const useManagedWorker = () => {
    const dispatch = useDispatch();
    const [workerUuid, setWorkerUuid] = useState(null);

    useEffect(() => {
        let isActive = true;

        const initWorker = async () => {
            const result = await dispatch(createWorker());
            console.log("result: " + result);
            if (result.payload && isActive) {
                setWorkerUuid(result.payload);
            }
        };

        if (workerUuid === null) {
            void initWorker();
        }

        return () => {
            if (workerUuid) {
                dispatch(terminateWorker(workerUuid));
            }
            isActive = false;
        };
    }, [dispatch, workerUuid]);

    return workerUuid;
};
