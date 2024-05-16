import React, {useEffect, useMemo, useRef} from "react";

import {AppShell, Burger, createTheme, MantineColorsTuple, MantineProvider} from '@mantine/core';
import {useDisclosure} from "@mantine/hooks";
import {PlaygroundTerminal} from "./PlaygroundTerminal";
import AceEditor from "react-ace";
import BitBakeMode from "../BitBakeMode";
import {createWorkerFactory, useWorker} from "@shopify/react-web-worker";

const myColor: MantineColorsTuple = [
    '#e4f8ff',
    '#d3eafc',
    '#a9d1f1',
    '#7db7e6',
    '#58a1dd',
    '#3f94d8',
    '#2f8dd6',
    '#1e7abe',
    '#0c6cac',
    '#005e99'
];

const theme = createTheme({
    colors: {
        myColor,
    }
});

const createWorker = createWorkerFactory(() => import('../../pyodide-worker/worker'));

const wat = (str: string) => {
    console.error(str);
}

export const App: React.FC = () => {
    const [opened, {toggle}] = useDisclosure();

    const editor = useRef(null);

    useEffect(() => {
        editor.current.editor.getSession().setMode(new BitBakeMode());
    }, []);

    const worker = useWorker(createWorker);

    useEffect(() => {
        (async () => {
            await worker.setProgressCallback(wat);
            await worker.runPython("print(1 + 2)", new URL("../../../assets/bitbake-2.8.0.zip", import.meta.url).toString())
        })();
    }, [worker])

    return (
        <MantineProvider theme={theme}>
            <AppShell
                header={{height: 60}}
                navbar={{
                    width: 300,
                    breakpoint: 'sm',
                    collapsed: {mobile: !opened},
                }}
                padding="md"
            >
                <AppShell.Header>
                    <Burger
                        opened={opened}
                        onClick={toggle}
                        hiddenFrom="sm"
                        size="sm"
                    />
                    <div>Logo</div>
                </AppShell.Header>

                <AppShell.Navbar p="md">Navbar</AppShell.Navbar>

                <AppShell.Main>
                    {/*<PlaygroundTerminal/>*/}
                    <AceEditor
                        ref={editor}
                        mode="text"
                        theme="github"
                        editorProps={{ $blockScrolling: true }}
                    />,
                </AppShell.Main>
            </AppShell>

        </MantineProvider>
    );
};