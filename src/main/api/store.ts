// store.ts

import {configureStore} from '@reduxjs/toolkit';
import workerReducer from './webWorkerApiSlice';
import authSlice from "./authSlice";
import {api} from "./services/auth";

const store = configureStore({
    reducer: {
        worker: workerReducer,
        [api.reducerPath]: api.reducer,
        auth: authSlice,
    },
});

export type RootState = ReturnType<typeof store.getState>;
export default store;
