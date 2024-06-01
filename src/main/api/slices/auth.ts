import { createSlice } from '@reduxjs/toolkit';
import {githubApi} from "../services/github";

type IsLoggedInState = "unknown" | "yes" | "no";

interface AuthState {
    isLoggedIn: IsLoggedInState,
}

// Define an initial state
const initialState: AuthState = {
    isLoggedIn: "unknown",
};

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder.addMatcher(
            githubApi.endpoints.getUser.matchFulfilled,
            (state, action) => {
                state.isLoggedIn = action.payload ? "yes" : "no";
            }
        );

        builder.addMatcher(
            githubApi.endpoints.logout.matchFulfilled,
            (state) => {
                state.isLoggedIn = "no";
            }
        );
    },
});

export const { reducer } = authSlice;
