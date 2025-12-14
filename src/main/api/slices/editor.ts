import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "../store";

export interface EditorState {
    text: string;
}

const initialState: EditorState = {
    text: "",
};

const editorSlice = createSlice({
    name: "editor",
    initialState,
    reducers: {
        setText(state, action: PayloadAction<string>) {
            state.text = action.payload;
        },
    },
});

export const { setText } = editorSlice.actions;
export const { reducer } = editorSlice;

export const selectEditorText = (state: RootState) => state.editor.text;
