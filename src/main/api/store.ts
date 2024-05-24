// store.ts

import {configureStore} from '@reduxjs/toolkit';
import workerReducer from './webWorkerApiSlice';
import authSlice from "./authSlice";

const store = configureStore({
    reducer: {
        worker: workerReducer,
        auth: authSlice,
    },
});

export type RootState = ReturnType<typeof store.getState>;
export default store;
