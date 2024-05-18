// store.ts

import {configureStore} from '@reduxjs/toolkit';
import workerReducer from './webWorkerApiSlice';

const store = configureStore({
    reducer: {
        worker: workerReducer,
    },
});

export type RootState = ReturnType<typeof store.getState>;
export default store;
