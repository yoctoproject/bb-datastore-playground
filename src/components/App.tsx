import React, {useEffect, useState} from "react";


import {AppShell, Burger, createTheme, MantineColorsTuple, MantineProvider} from '@mantine/core';
import FetchWithProgress from "./FetchWithProgress";
import {usePyodide} from "../hooks/usePyodide";
import {useDisclosure} from "@mantine/hooks";
import {useImmer} from "use-immer";
import {PlaygroundTerminal} from "./PlaygroundTerminal";

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

const Inner: React.FC = () => {
    const [data, setData] = useState<ArrayBuffer | null>(null);

    const {pyodide, status: pyodideStatus } = usePyodide();

    const [ran, setRan] = useState<boolean>(false);

    const [output, setOutput] = useImmer<string[]>([]);

    useEffect(() => {
        const go = async () => {
            if (data && !ran) {

                console.warn("LOADING SQLITE");


            } else {
                console.warn(`data = ${!!data}, p = ${!!pyodide}`);
            }
        }

        go();
    }, [data, pyodide, ran, setRan]);

    return <>
        {/*{pyodide && data && ran && <TerminalComponent pyodide={pyodide}/>}*/}

        <FetchWithProgress url={"assets/bitbake-2.8.0.zip"} data={data} setData={setData}/>
        <p>pyodide: {pyodideStatus}</p>
        <ul>
            {output.map(e => <li>{e}</li>)}
        </ul>
    </>;
}

export const App: React.FC = () => {
    const [opened, { toggle }] = useDisclosure();

    return (
        <MantineProvider theme={theme}>
            <AppShell
                header={{ height: 60 }}
                navbar={{
                    width: 300,
                    breakpoint: 'sm',
                    collapsed: { mobile: !opened },
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
                    <PlaygroundTerminal />

                </AppShell.Main>
            </AppShell>

        </MantineProvider>
    );
};