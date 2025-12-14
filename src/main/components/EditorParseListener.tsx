import React, {useEffect, useRef} from "react";
import {useSelector} from "react-redux";
import {selectEditorText} from "../api/slices/editor";
import {usePyodideWorker} from "../hooks/usePyodideWorker";

const PARSE_DEBOUNCE_MS = 600;

export const EditorParseListener: React.FC = () => {
    const text = useSelector(selectEditorText);
    const {client, status, prepared} = usePyodideWorker();
    const timeoutRef = useRef<number | null>(null);

    useEffect(() => {
        if (!client || status !== "ready" || !prepared || text.trim().length === 0) {
            return;
        }

        if (timeoutRef.current) {
            window.clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = window.setTimeout(async () => {
            try {
                const d = await client.parse(text);
                // For now just print to console
                console.error(d);
            } catch (err) {
                console.error("Failed to parse editor contents", err);
            }
        }, PARSE_DEBOUNCE_MS);

        return () => {
            if (timeoutRef.current) {
                window.clearTimeout(timeoutRef.current);
                timeoutRef.current = null;
            }
        };
    }, [client, prepared, status, text]);

    return null;
};
