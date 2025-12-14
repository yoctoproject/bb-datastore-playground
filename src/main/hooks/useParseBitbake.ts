import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useDebounce } from "use-debounce";
import { selectEditorText } from "../api/slices/editor";
import {
    resetParse,
    selectParseError,
    selectParseStatus,
    selectParseValue,
    setParseError,
    setParseSuccess,
    startParse,
} from "../api/slices/parse";
import { usePyodideWorker } from "./usePyodideWorker";

const PARSE_DEBOUNCE_MS = 600;

export const useParseBitbake = () => {
    const dispatch = useDispatch();
    const text = useSelector(selectEditorText);
    const [debouncedText] = useDebounce(text, PARSE_DEBOUNCE_MS);
    const { workerState, getClient } = usePyodideWorker();

    const value = useSelector(selectParseValue);
    const status = useSelector(selectParseStatus);
    const error = useSelector(selectParseError);

    useEffect(() => {
        if (workerState.status === "error") {
            dispatch(
                setParseError(
                    workerState.error?.message ?? "Pyodide failed to start"
                )
            );
            return;
        }

        if (debouncedText.trim().length === 0) {
            dispatch(resetParse());
            return;
        }

        if (workerState.status !== "ready") {
            return;
        }

        const runParse = async () => {
            try {
                const client = getClient();
                if (!client) {
                    throw new Error("Pyodide client is not ready yet");
                }
                dispatch(startParse());
                const parseValue = await client.parse(debouncedText);
                dispatch(setParseSuccess({ value: String(parseValue) }));
            } catch (err) {
                const message =
                    err instanceof Error ? err.message : "Unknown parse error";
                dispatch(setParseError(message));
            }
        };

        void runParse();
    }, [debouncedText, dispatch, getClient, workerState]);

    return { value, status, error };
};
