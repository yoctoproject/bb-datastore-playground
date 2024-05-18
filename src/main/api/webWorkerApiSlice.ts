// workerSlice.ts

import {createSlice, PayloadAction} from '@reduxjs/toolkit';

interface WorkerState {
    worker: any,
}

const initialState: WorkerState = {
    worker: null,
};

const workerSlice = createSlice({
    name: 'worker',
    initialState,
    reducers: {
        setWorker(state, action: PayloadAction<Worker | null>) {
            state.worker = action.payload;
        },
    },
});

export const {setWorker} = workerSlice.actions;
export default workerSlice.reducer;
