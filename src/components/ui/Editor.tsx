'use client'

import {useEditor, EditorContent} from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import { useEffect } from "react";

export default function Editor({onChange}: {onChange?: (json:any) =>void}) {
    const editor = useEditor({
        extensions:[StarterKit],
        content: "",
        onUpdate: ({editor}) => {
            const json = editor.getJSON()
            onChange?.(json)
        },
    })

    useEffect(() => {
        return () =>{
            editor?.destroy()
        }
    },[editor])

    return(
        <div className="border rounded p-3 min-h-[200px]">
            <EditorContent editor={editor}/>
        </div>
    )
}