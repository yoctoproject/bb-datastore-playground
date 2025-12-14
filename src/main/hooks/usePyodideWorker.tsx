import React, {
    createContext,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import { wrap, Remote } from "comlink";
import { MyWorker } from "../../pyodide-worker/worker";

type PyodideWorkerStatus =
    | "idle"
    | "starting"
    | "preparing"
    | "ready"
    | "error";

export type BitbakeSpec = {
    version: string;
    url?: string;
};

type PyodideWorkerContextValue = {
    status: PyodideWorkerStatus;
    client: Remote<MyWorker> | null;
    error: Error | null;
    bitbakeSpec: BitbakeSpec;
    bitbakeZipUrl: string;
    prepared: boolean;
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

    const [status, setStatus] = useState<PyodideWorkerStatus>("idle");
    const [error, setError] = useState<Error | null>(null);
    const [prepared, setPrepared] = useState<boolean>(false);

    const workerRef = useRef<Worker | null>(null);
    const clientRef = useRef<Remote<MyWorker> | null>(null);

    useEffect(() => {
        let cancelled = false;

        setStatus("starting");
        setError(null);

        const worker = new Worker(
            new URL("../../pyodide-worker/worker.ts", import.meta.url),
            { type: "module" }
        );
        workerRef.current = worker;

        const setup = async () => {
            try {
                const WrappedWorker = wrap<typeof MyWorker>(worker);
                const api = await new WrappedWorker();
                if (cancelled) {
                    worker.terminate();
                    return;
                }
                clientRef.current = api;
                setStatus("preparing");
                setPrepared(false);

                await api.prepareBitbake(bitbakeZipUrl, normalizedSpec.version);

                if (cancelled) {
                    worker.terminate();
                    return;
                }
                setPrepared(true);
                setStatus("ready");
            } catch (err) {
                if (cancelled) {
                    return;
                }
                setError(err as Error);
                setStatus("error");
            }
        };

        void setup();

        return () => {
            cancelled = true;
            workerRef.current?.terminate();
            workerRef.current = null;
            clientRef.current = null;
            setPrepared(false);
        };
    }, [bitbakeZipUrl]);

    const value = useMemo<PyodideWorkerContextValue>(
        () => ({
            status,
            client: clientRef.current,
            error,
            bitbakeSpec: normalizedSpec,
            bitbakeZipUrl,
            prepared,
        }),
        [bitbakeZipUrl, error, normalizedSpec, prepared, status]
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
