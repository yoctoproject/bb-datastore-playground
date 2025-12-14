import { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useSearchParams } from "react-router-dom";
import { useDebounce } from "use-debounce";
import { addNotification } from "../api/slices/notifications";
import { selectEditorText, setText } from "../api/slices/editor";

const QUERY_KEY = "code";

const encodeText = (text: string) => encodeURIComponent(text);
const decodeText = (value: string) => decodeURIComponent(value);

export const useEditorUrlSync = (debounceMs = 1000) => {
    const dispatch = useDispatch();
    const text = useSelector(selectEditorText);
    const [searchParams, setSearchParams] = useSearchParams();
    const [debouncedText] = useDebounce(text, debounceMs);

    const lastUrlValueRef = useRef<string | null>(null);
    const hydratingRef = useRef(false);

    // URL -> store
    useEffect(() => {
        const raw = searchParams.get(QUERY_KEY);

        // If URL param is absent, just record that fact
        if (!raw) {
            lastUrlValueRef.current = null;
            return;
        }

        // Avoid loops when we were the one who wrote this value
        if (raw === lastUrlValueRef.current) {
            return;
        }

        try {
            const decoded = decodeText(raw);

            // Mark that we're hydrating so store -> URL doesn't immediately fire
            hydratingRef.current = true;
            lastUrlValueRef.current = raw;

            dispatch(setText(decoded));
        } catch {
            dispatch(
                addNotification({
                    id: Date.now(),
                    type: "error",
                    message: "Failed to load editor content from the URL.",
                })
            );
        }
    }, [dispatch, searchParams]);

    // store -> URL (debounced)
    useEffect(() => {
        // If we're currently applying URL -> store, wait until debounced store matches it
        if (hydratingRef.current) {
            const raw = searchParams.get(QUERY_KEY);
            const decoded = raw
                ? (() => {
                      try {
                          return decodeText(raw);
                      } catch {
                          return null;
                      }
                  })()
                : "";

            if (decoded !== debouncedText) {
                return;
            }

            hydratingRef.current = false;
        }

        const nextRaw = debouncedText ? encodeText(debouncedText) : null;

        if (nextRaw === lastUrlValueRef.current) {
            return;
        }

        const currentRaw = searchParams.get(QUERY_KEY);

        // Avoid setSearchParams unless the param actually changes
        if ((currentRaw ?? null) === nextRaw) {
            lastUrlValueRef.current = nextRaw;
            return;
        }

        const next = new URLSearchParams(searchParams);

        if (nextRaw) {
            next.set(QUERY_KEY, nextRaw);
        } else {
            next.delete(QUERY_KEY);
        }

        setSearchParams(next, { replace: true });
        lastUrlValueRef.current = nextRaw;
    }, [debouncedText, searchParams, setSearchParams]);
};
