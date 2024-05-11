import React, { useState } from 'react';


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
        setLoading(true);
        setError(null);
        fetch(props.url)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const contentLength = response.headers.get('Content-Length');
                if (!contentLength) {
                    throw new Error("Missing Content-Length header.");
                }
                const total = parseInt(contentLength, 10);
                let loaded = 0;

                const reader = response.body!.getReader();
                const stream = new ReadableStream({
                    start(controller) {
                        function push() {
                            reader.read().then(({ done, value }) => {
                                if (done) {
                                    controller.close();
                                    return;
                                }
                                loaded += value!.length;
                                setProgress(Math.round((loaded / total) * 100));
                                controller.enqueue(value);
                                push();
                            }).catch(err => {
                                setError(`Error reading data: ${err.message}`);
                                controller.error(err);
                            });
                        }
                        push();
                    }
                });

                return new Response(stream, { headers: { "Content-Type": "application/octet-stream" } });
            })
            .then(response => response.arrayBuffer())
            .then(async buffer => {
                props.setData(buffer);
                setLoading(false);
            })
            .catch(err => {
                setError(err.message);
                console.error(err);
                setLoading(false);
            });
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
