'use client'

import {useEditor, EditorContent} from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"

export default function Editor() {
    const editor = useEditor({
        extensions:[StarterKit],
        content: "<p>Start wrtiting your note here...",
    });

    return(
        <div className="border rounded-md shadow-sm p-4 min-h-[300px]">
            <EditorContent editor={editor}/>
        </div>
    )
}