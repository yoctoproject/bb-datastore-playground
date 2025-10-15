import {createAsyncThunk} from '@reduxjs/toolkit';
import * as Comlink from 'comlink';
import {v4 as uuidv4} from 'uuid';
import {MyWorker} from "../../../pyodide-worker/worker";

interface WorkerData {
    instance: Worker;
    api: Comlink.Remote<MyWorker>;
}

const workers: {[uuid: string]: WorkerData} = {};

export const createWorker = createAsyncThunk('data/createWorker', async () => {
    const worker = new Worker(new URL("../../../pyodide-worker/worker.ts", import.meta.url));
    const wrapped = Comlink.wrap<typeof MyWorker>(worker);
    const res = await new wrapped();
    const uuid = uuidv4();
    workers[uuid] = {
        instance: worker,
        api: res
    };
    return uuid;
});

export const fetchDataFromWorker = createAsyncThunk(
    'data/fetchDataFromWorker',
    async (uuid: string, { rejectWithValue }) => {
        try {
            const workerApi = workers[uuid]?.api;
            console.log("API: " + uuid);
            if (!workerApi) {
                throw new Error('Worker not found');
            }
            return await workerApi.test();
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

export const terminateWorker = createAsyncThunk('data/terminateWorker', async (uuid: string, { rejectWithValue }) => {
    try {
        if (workers[uuid]) {
            workers[uuid].instance.terminate();
            delete workers[uuid];
        } else {
            throw new Error('Worker not found');
        }
    } catch (error) {
        return rejectWithValue(error.message);
    }
});
