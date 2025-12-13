// store.ts

import {configureStore} from '@reduxjs/toolkit';
import {reducer as notificationsReducer} from "./slices/notifications";

const store = configureStore({
    reducer: {
        notifications: notificationsReducer,
    },
});

export type RootState = ReturnType<typeof store.getState>;
export default store;
