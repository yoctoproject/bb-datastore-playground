// store.ts

import {configureStore, createListenerMiddleware} from '@reduxjs/toolkit';
import {githubApi} from "./services/github";
import {reducer as authReducer} from "./slices/auth";
import {addNotification, NotificationMessage, reducer as notificationsReducer} from "./slices/notifications";

const listenerMiddleware = createListenerMiddleware();

const store = configureStore({
    reducer: {
        [githubApi.reducerPath]: githubApi.reducer,
        auth: authReducer,
        notifications: notificationsReducer,
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware().prepend(listenerMiddleware.middleware).concat(githubApi.middleware),
});

listenerMiddleware.startListening({
    predicate: (action, currentState, previousState) =>
        previousState.auth.isLoggedIn === "no" && currentState.auth.isLoggedIn === "yes",
    effect: (action, listenerApi) => {
        const notification: NotificationMessage = {
            id: Date.now(),
            type: 'success',
            message: 'Login succeeded!'
        };
        listenerApi.dispatch(addNotification(notification));
    }
});

export type RootState = ReturnType<typeof store.getState>;
export default store;
