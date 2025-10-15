import { createSlice } from '@reduxjs/toolkit';

export interface NotificationMessage {
    id: number;
    type: 'success' | 'error' | 'info';
    message: string;
}

interface NotificationsState {
    messages: NotificationMessage[],
}

const initialState: NotificationsState = {
    messages: [],
};

const notificationsSlice = createSlice({
    name: 'notifications',
    initialState,
    reducers: {
        addNotification(state, action) {
            state.messages.push(action.payload);
        },
        clearNotifications(state) {
            state.messages = [];
        },
    },
});

export const { addNotification, clearNotifications } = notificationsSlice.actions;
export const { reducer } = notificationsSlice;