import {useRef, useState} from "react";
import axios from "axios";
import useSWR from "swr";

export const useSWRProgress = (key, options?) => {
    const [progress, setProgress] = useState<number>(0);
    const [done, setDone] = useState<boolean>(false);

    return [useSWR(key, (url) => axios.get(url, {
            onDownloadProgress: progressEvent => {
                const percentage = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                console.log(percentage);
                setProgress(percentage);
            },
            responseType: "arraybuffer"
        }).then((res) => {
            setDone(true);
            return res.data;
        })
    ), {progress, done}]
}