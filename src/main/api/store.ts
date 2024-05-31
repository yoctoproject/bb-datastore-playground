// store.ts

import {configureStore} from '@reduxjs/toolkit';
import {githubApi} from "./services/github";
import {reducer as authReducer} from "./slices/auth";

const store = configureStore({
    reducer: {
        [githubApi.reducerPath]: githubApi.reducer,
        auth: authReducer,
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware().concat(githubApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export default store;
