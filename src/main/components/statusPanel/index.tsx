import React, {useEffect} from "react";
import {useSelector} from "react-redux";
import {RootState} from "../../api/store";

import * as comlink from "comlink";

const wat = (str: string) => {
    console.error(str);
}

export const StatusPanel: React.FC = () => {
    // const worker = useSelector((state: RootState) => state.worker.worker);
    //
    // useEffect(() => {
    //     console.warn("STATUS PANEL");
    //     (async () => {
    //         if (worker) {
    //             console.error("INSTALLLLLLING");
    //             await worker.setProgressCallback(comlink.proxy(wat));
    //             console.error("installed");
    //             await worker.runPython("print(1 + 2)", new URL("../../../../assets/bitbake-2.8.0.zip", import.meta.url).toString());
    //             console.error("ran python");
    //         }
    //     })();
    // }, [worker]);

    return <div>
        Status!
    </div>;
};