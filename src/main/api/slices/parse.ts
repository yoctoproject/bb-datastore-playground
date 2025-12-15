import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "../store";

type ParseStatus =
    | { kind: "idle" }
    | { kind: "parsing" }
    | { kind: "succeeded" }
    | { kind: "failed"; error: string };

export type ParseResultEntry = [code: string, output: string];
export type ParseResult = ParseResultEntry[];

type ParseState = {
    status: ParseStatus;
    value: ParseResult | null;
};

const initialState: ParseState = {
    status: { kind: "idle" },
    value: null,
};

const parseSlice = createSlice({
    name: "parse",
    initialState,
    reducers: {
        startParse(state) {
            state.status = { kind: "parsing" };
            state.value = null;
        },
        setParseSuccess(state, action: PayloadAction<{ value: ParseResult }>) {
            state.status = { kind: "succeeded" };
            state.value = action.payload.value;
        },
        setParseError(state, action: PayloadAction<string>) {
            state.status = { kind: "failed", error: action.payload };
            state.value = null;
        },
        resetParse(state) {
            return initialState;
        },
    },
});

export const { startParse, setParseSuccess, setParseError, resetParse } =
    parseSlice.actions;
export const { reducer } = parseSlice;

export const selectParseValue = (state: RootState) => state.parse.value;
export const selectParseStatus = (state: RootState) => state.parse.status.kind;
export const selectParseError = (state: RootState) =>
    state.parse.status.kind === "failed" ? state.parse.status.error : null;
