import { createSlice } from '@reduxjs/toolkit';
import {githubApi} from "../services/github";

// Define an initial state
const initialState = {
    user: null,
    isLoggedIn: false,
};

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder.addMatcher(
            githubApi.endpoints.getUser.matchFulfilled,
            (state, action) => {
                state.user = action.payload;
                state.isLoggedIn = !!action.payload;
            }
        );
    },
});

export const { reducer } = authSlice;
