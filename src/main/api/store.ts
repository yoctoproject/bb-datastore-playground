// store.ts

import { configureStore } from "@reduxjs/toolkit";
import { reducer as notificationsReducer } from "./slices/notifications";
import { reducer as editorReducer } from "./slices/editor";

const store = configureStore({
    reducer: {
        notifications: notificationsReducer,
        editor: editorReducer,
    },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export default store;
