import type {loadPyodide, PyodideInterface} from "pyodide";
import {retain} from "@shopify/react-web-worker";
import axios from "axios";

console.error("WORKER!")

declare let self: DedicatedWorkerGlobalScope & {
    pyodide: PyodideInterface,
}

importScripts("https://cdn.jsdelivr.net/pyodide/v0.25.1/full/pyodide.js");

async function loadPyodideAndPackages() {
    console.log("loading pyodide");
    // @ts-expect-error Method imported by importScripts
    self.pyodide = await loadPyodide();
    console.log("loading packages!");
    await self.pyodide.loadPackage(["sqlite3"]);
}

let the_func = [
    async (str) => {
        console.log(str);
    }
];

export const setProgressCallback = async (func) => {
    the_func.push(func);
    retain(func);
    console.log(the_func);
}

const printAll = async (str) => {
    await Promise.all(the_func.map(f => f(str)));
}

let bitbake_data = false;

const download_bitbake = async (u) => {
    await fetch(u);
};

export const runPython = async (python: string, u: string) => {
    const bitbakePromise = axios({
        method: 'get',
        url: u,
        responseType: 'arraybuffer',
        onDownloadProgress: async function (progressEvent) {
            // Calculate the download progress percentage
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            // Send the progress percentage back to the main thread
            await printAll(`progress: ${percentCompleted}`);
        }
    })
        .then(response => {
            return response.data;
            // Send the downloaded data back to the main thread
            //self.postMessage({ type: 'success', data: response.data });
        });

    const pyodidePromise = async () => {
        await printAll("starting!");

        // make sure loading is done
        await loadPyodideAndPackages();
        await printAll("done starting!");

        await self.pyodide.loadPackagesFromImports(python);
    };

    const [bitbakeData, r] = await Promise.all([bitbakePromise, pyodidePromise()]);

    console.log("unpacling...")
    self.pyodide.unpackArchive(bitbakeData, "zip", {
        extractDir: "bb"
    });

    console.log("done");


    self.pyodide.runPython(`
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

    self.pyodide.runPython(`
                    import sys
                    sys.path.insert(0, "./bb/bitbake-2.8.0/lib/")
                    from bb.data_smart import DataSmart    
                `)

    const results = await self.pyodide.runPythonAsync(python);
    return `${results}`;
}
