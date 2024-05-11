import React from "react";


import { MantineProvider, createTheme, MantineColorsTuple } from '@mantine/core';
import FetchWithProgress from "./FetchWithProgress";

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

export const App: React.FC = () => {
    return (
        <MantineProvider theme={theme}>
            <FetchWithProgress url={"/assets/yocto-3.1.33.zip"}/>
        </MantineProvider>
    );
};