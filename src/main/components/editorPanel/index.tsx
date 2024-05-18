import React, {useEffect, useRef} from "react";
import BitBakeMode from "../../BitBakeMode";
import AceEditor from "react-ace";

export const EditorWrapper = () => {
    const editor = useRef(null);

    useEffect(() => {
        editor.current.editor.getSession().setMode(new BitBakeMode());
    }, []);

    return (
        <div>
            <AceEditor
                ref={editor}
                mode="text"
                theme="github"
                editorProps={{$blockScrolling: true}}
            />
        </div>
    );
}
