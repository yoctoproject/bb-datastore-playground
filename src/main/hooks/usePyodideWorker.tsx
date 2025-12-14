import React, {
    createContext,
    useContext,
    useEffect,
    useMemo,
    useCallback,
    useRef,
    useState,
} from "react";
import { wrap, Remote } from "comlink";
import { MyWorker } from "../../pyodide-worker/worker";

type WorkerState =
    | { status: "idle" }
    | { status: "starting" }
    | { status: "preparing" }
    | { status: "ready" }
    | { status: "error"; error: Error };

export type BitbakeSpec = {
    version: string;
    url?: string;
};

type PyodideWorkerContextValue = {
    workerState: WorkerState;
    getClient: () => Remote<MyWorker> | null;
    bitbakeSpec: BitbakeSpec;
    bitbakeZipUrl: string;
};

const DEFAULT_BITBAKE_VERSION = "2.8.0";
const PyodideWorkerContext = createContext<PyodideWorkerContextValue | null>(
    null
);

const resolveBitbakeZipUrl = (spec: BitbakeSpec) => {
    const version = spec.version?.trim() || DEFAULT_BITBAKE_VERSION;
    if (spec.url && spec.url.trim().length > 0) {
        return spec.url;
    }
    const base = (import.meta.env.BASE_URL ?? "/").replace(/\/?$/, "/");
    return `${base}assets/bitbake-${version}.zip`;
};

export const PyodideWorkerProvider: React.FC<{
    children: React.ReactNode;
    bitbakeSpec?: BitbakeSpec;
}> = ({ children, bitbakeSpec }) => {
    const normalizedSpec = useMemo<BitbakeSpec>(
        () => ({
            version: bitbakeSpec?.version ?? DEFAULT_BITBAKE_VERSION,
            url: bitbakeSpec?.url,
        }),
        [bitbakeSpec?.url, bitbakeSpec?.version]
    );
    const bitbakeZipUrl = useMemo(
        () => resolveBitbakeZipUrl(normalizedSpec),
        [normalizedSpec]
    );

    const [workerState, setWorkerState] = useState<WorkerState>({
        status: "idle",
    });

    const workerRef = useRef<Worker | null>(null);
    const clientRef = useRef<Remote<MyWorker> | null>(null);

    useEffect(() => {
        let cancelled = false;

        const setup = async () => {
            setWorkerState({ status: "starting" });
            clientRef.current = null;

            const worker = new Worker(
                new URL("../../pyodide-worker/worker.ts", import.meta.url),
                { type: "module" }
            );
            workerRef.current = worker;

            try {
                const WrappedWorker = wrap<typeof MyWorker>(worker);
                const api = await new WrappedWorker();
                if (cancelled) {
                    worker.terminate();
                    return;
                }

                clientRef.current = api;
                setWorkerState({ status: "preparing" });

                await api.prepareBitbake(bitbakeZipUrl, normalizedSpec.version);

                if (cancelled) {
                    worker.terminate();
                    return;
                }
                setWorkerState({ status: "ready" });
            } catch (err) {
                if (cancelled) {
                    return;
                }
                clientRef.current = null;
                setWorkerState({ status: "error", error: err as Error });
            }
        };

        void setup();

        return () => {
            cancelled = true;
            workerRef.current?.terminate();
            workerRef.current = null;
            clientRef.current = null;
            setWorkerState({ status: "idle" });
        };
    }, [bitbakeZipUrl, normalizedSpec.version]);

    const getClient = useCallback(() => clientRef.current, []);

    const value = useMemo<PyodideWorkerContextValue>(
        () => ({
            workerState,
            getClient,
            bitbakeSpec: normalizedSpec,
            bitbakeZipUrl,
        }),
        [bitbakeZipUrl, getClient, normalizedSpec, workerState]
    );

    return (
        <PyodideWorkerContext.Provider value={value}>
            {children}
        </PyodideWorkerContext.Provider>
    );
};

export const usePyodideWorker = () => {
    const ctx = useContext(PyodideWorkerContext);
    if (!ctx) {
        throw new Error(
            "usePyodideWorker must be used within a PyodideWorkerProvider"
        );
    }
    return ctx;
};
