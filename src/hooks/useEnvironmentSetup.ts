import {useImmerReducer} from "use-immer";
import {usePyodide} from "./usePyodide";
import {useEffect} from "react";
import {useSWRProgress} from "./useSWRProgress";

const initialEnvironmentState = {
    pyodideStatus: "idle",
    bitbakeProgress: 0
};

function reducer(draft, action) {
    switch (action.type) {
        case "pyodideStatusChanged":
            draft.pyodideStatus = action.pyodideStatus;
            return;
        case "bitbakeProgressChanged":
            draft.bitbakeProgress = action.bitbakeProgress;
            return;
    }
}

export const useEnvironmentSetup = () => {
    const [state, dispatch] = useImmerReducer(reducer, initialEnvironmentState);

    const [{data}, {progress, done}] = useSWRProgress("assets/bitbake-2.8.0.zip");
    const {pyodide, status: pyodideStatus } = usePyodide();

    useEffect(() => {
        dispatch({type: "pyodideStatusChanged", pyodideStatus: pyodideStatus});
    }, [dispatch, pyodideStatus]);

    useEffect(() => {
        dispatch({type: "bitbakeProgressChanged", bitbakeProgress: progress});
    }, [progress, dispatch]);

    return {state};
};