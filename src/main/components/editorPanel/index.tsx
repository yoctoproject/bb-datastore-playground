import React, { useEffect, useRef } from "react";
import BitBakeMode from "../../BitBakeMode";
import AceEditor from "react-ace";
import { useDispatch, useSelector } from "react-redux";
import { selectEditorText, setText } from "../../api/slices/editor";

export const EditorWrapper = () => {
    const dispatch = useDispatch();
    const text = useSelector(selectEditorText);
    const editor = useRef(null);

    useEffect(() => {
        editor.current.editor.getSession().setMode(new BitBakeMode());
    }, []);

    useEffect(() => {
        if (editor.current) {
            editor.current.editor.renderer.attachToShadowRoot();
        }
    });

    return (
        <div>
            <AceEditor
                ref={editor}
                fontSize={16}
                mode="text"
                theme="github"
                editorProps={{ $blockScrolling: true }}
                value={text}
                onChange={(value: string) => dispatch(setText(value))}
            />
        </div>
    );
};
