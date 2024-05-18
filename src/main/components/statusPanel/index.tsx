import React, {useEffect} from "react";
import {useSelector} from "react-redux";
import {RootState} from "../../api/store";
import {useImmer} from "use-immer";

const wat = (str: string) => {
    console.error(str);
}

export const StatusPanel: React.FC = () => {
    const [p, setP] = useImmer([]);

    const worker = useSelector((state: RootState) => state.worker.worker);

    useEffect(() => {
        console.warn("STATUS PANEL");
        (async () => {
            if (worker) {
                console.error("INSTALLLLLLING");
                await worker.setProgressCallback((str) => {
                    console.log(`>>>>> ${str}`)
                    setP((t) => {
                        t.push(str);
                    })
                });
                console.error("installed");
                await worker.runPython("print(1 + 2)", new URL("../../../../assets/bitbake-2.8.0.zip", import.meta.url).toString());
                console.error("ran python");
            } else {
                console.warn("NOT WORKER")
            }
        })();
    }, [setP, worker]);

    return <div>
        Status!
        <ul>
            {p.map(i => <li>{i}</li>)}
        </ul>
    </div>;
};