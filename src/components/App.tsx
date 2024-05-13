import React from "react";

import {AppShell, Burger, createTheme, MantineColorsTuple, MantineProvider} from '@mantine/core';
import {useDisclosure} from "@mantine/hooks";
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

export const App: React.FC = () => {
    const [opened, {toggle}] = useDisclosure();

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
                    <PlaygroundTerminal/>
                </AppShell.Main>
            </AppShell>

        </MantineProvider>
    );
};