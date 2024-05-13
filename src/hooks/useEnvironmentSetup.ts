import {useImmerReducer} from "use-immer";
import {PyodideStatus, usePyodide} from "./usePyodide";
import {useEffect, useRef} from "react";
import {useSWRProgress} from "./useSWRProgress";

export enum EnvironmentStatus {
    WaitBitbakeOrPyodide,
    LoadingSqlite3,
    UnpackingBitbake,
    Configuring,
    ImportingBitbake,
    Ready,
}

enum InternalStatus {
    NotRun,
    Running,
    Done
}

const initialEnvironmentState = {
    environmentStatus: EnvironmentStatus.WaitBitbakeOrPyodide,
    pyodideStatus: PyodideStatus.Idle,
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
        case "environmentStatusChanged":
            draft.environmentStatus = action.environmentStatus;
            break;
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
    }, [dispatch, progress]);

    const effectStatus = useRef<InternalStatus>(InternalStatus.NotRun);

    useEffect(() => {
        if (pyodideStatus === PyodideStatus.Done && progress === 100 && effectStatus.current === InternalStatus.NotRun) {
            effectStatus.current = InternalStatus.Running;
            const f = async() => {
                dispatch({type: "environmentStatusChanged", environmentStatus: EnvironmentStatus.LoadingSqlite3});
                await pyodide.loadPackage("sqlite3");
                dispatch({type: "environmentStatusChanged", pyodideStatus: EnvironmentStatus.UnpackingBitbake});
                pyodide.unpackArchive(data, "zip", {
                    extractDir: "bb"
                });
                dispatch({type: "environmentStatusChanged", pyodideStatus: EnvironmentStatus.Configuring});

                pyodide.runPython(`
import os.path
import sys
from importlib.abc import Loader, MetaPathFinder
from importlib.util import spec_from_file_location, spec_from_loader

import _frozen_importlib
import _frozen_importlib_external


class MyMetaFinder(MetaPathFinder):
    def find_spec(self, fullname, path=None, target=None):
        print(f"importing {fullname}")

        if path is None or path == "":
            path = sys.path
        if "." in fullname:
            *parents, name = fullname.split(".")
        else:
            name = fullname
        for entry in path:
            if os.path.isdir(os.path.join(entry, name)):
                # this module has child modules
                filename = os.path.join(entry, name, "__init__.py")
                submodule_locations = [os.path.join(entry, name)]
            else:
                filename = os.path.join(entry, name + ".py")
                submodule_locations = None
            if not os.path.exists(filename):
                continue

            print(">> " + filename)

            return spec_from_file_location(fullname, filename, loader=MyLoader(filename),
                                           submodule_search_locations=submodule_locations)

        # we don't know how to import this
        return None


class MyLoader(Loader):
    def __init__(self, filename):
        self.filename = filename

    def create_module(self, spec):
        # Use default module creation semantics
        return None

    def exec_module(self, module):
        print("FILE NAME: " + self.filename)
        if self.filename.endswith("fcntl/__init__.py"):
            data = """
from unittest.mock import Mock
fcntl = Mock()
            """
        else:
            with open(self.filename) as f:
                data = f.read()

        try:
            exec(data, vars(module))
        except Exception as e:
            print(e)
            raise e


class BuiltinImporterShim(_frozen_importlib.BuiltinImporter):
    @classmethod
    def find_spec(cls, fullname, path=None, target=None):
        ret = super().find_spec(fullname, path, target)

        if ret:
            print(f"shim handling: {ret}")
        return ret


class FrozenImporterShim:
    _original_importer = None

    @classmethod
    def set_original_importer(cls, imp):
        cls._original_importer = imp

    @classmethod
    def find_spec(cls, fullname, path=None, target=None):
        if fullname == "fcntl":
            return spec_from_loader("fcntl", MyLoader("fcntl/__init__.py"))
        ret = cls._original_importer.find_spec(fullname, path, target)

        if ret:
            print(f"frozen shim handling: {ret}")
        return ret

print(sys.meta_path)
js_finder = sys.meta_path.pop()
path_finder = sys.meta_path.pop()
frozen_finder = sys.meta_path.pop()
builtin = sys.meta_path.pop()

#sys.meta_path.append(MyMetaFinder())
sys.meta_path.append(path_finder)

i = FrozenImporterShim()
i.set_original_importer(frozen_finder)
sys.meta_path.append(i)

sys.meta_path.append(BuiltinImporterShim())

print(sys.meta_path)
        `)
                // const file = pyodide.FS.readdir("./bb");
                // console.log(file);

                dispatch({type: "environmentStatusChanged", environmentStatus: EnvironmentStatus.ImportingBitbake});
                pyodide.runPython(`
                    import sys
                    sys.path.insert(0, "./bb/bitbake-2.8.0/lib/")
                    from bb.data_smart import DataSmart    
                `)

                dispatch({type: "environmentStatusChanged", environmentStatus: EnvironmentStatus.Ready});
                // const DataSmart = pyodide.globals.get('DataSmart');
                // const d = DataSmart();
                //
                // d.setVar("A", "B");
                // d.setVar("A:test", "C");
                // d.setVar("OVERRIDES", "test");
                // d.setVarFlag("A", "p", "OK");
                //
                // console.log(d.getVar("A"));
                //
                // DataSmart.destroy();
            }

            f();
            effectStatus.current = InternalStatus.Done;
        }
    }, [data, dispatch, progress, pyodide, pyodideStatus]);

    return {state, pyodide};
};