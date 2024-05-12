import React, {useEffect, useState} from 'react';
import axios from "axios";


interface FetchProgressProps {
    url: string;
    data: ArrayBuffer | null;
    setData: (value: ArrayBuffer) => void,
}

const FetchWithProgress: React.FC<FetchProgressProps> = (props: FetchProgressProps) => {
    const [progress, setProgress] = useState<number>(0);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const fetchData = () => {
        async function work() {
            setLoading(true);
            const ret = await axios.get(props.url, {
                onDownloadProgress: progressEvent => {
                    const percentage = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    console.log(percentage);
                    setProgress(percentage);
                },
                responseType: "arraybuffer"
            });
            setLoading(false);

            props.setData(ret.data);
        }

        work();
    };

    return (
        <div>
            <h4>Download Progress</h4>
            {loading && <p>Progress: {progress}%</p>}
            {error && <p>Error: {error}</p>}
            {props.data && <p>Download complete!</p>}
            <button onClick={fetchData} disabled={loading}>
                {loading ? 'Downloading...' : 'Start Download'}
            </button>
        </div>
    );
};

export default FetchWithProgress;
