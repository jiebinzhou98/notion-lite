'use client'

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { useEditor, EditorContent, JSONContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import { useDebounce } from "@/lib/useDebounce"
import { Trash2, Bold, Italic, Download } from "lucide-react"
// Import the type augmentation for setLineHeight command
import { LineHeight } from "@/lib/tiptap-extensions/LineHeight"
import type { Editor } from "@tiptap/react"

// Augment the Editor interface to include setLineHeight for TypeScript
declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    setLineHeight: {
      setLineHeight: (lineHeight: string) => ReturnType
    }
  }
}

export default function NoteDetailEditor({ id, onUpdate, onDelete }:
    {
        id: string
        onUpdate?: (payload: { title: string; excerpt: string }) => void
        onDelete?: (id: string) => void
    }
) {
    const [title, setTitle] = useState("")
    const [initialContent, setInitialContent] = useState<JSONContent | null>(null)
    const [savingStatus, setSavingStatus] = useState("")
    const [latestContent, setLatestContent] = useState<JSONContent | null>(null)
    const extractExcerpt = (json: JSONContent | null) => json?.content?.[0]?.content?.[0]?.text || ""

    const fallbackDoc: JSONContent = {
        type: "doc",
        content: [{ type: "paragraph", content: [{ type: "text", text: "" }] }],
    }

    const isValidDoc = initialContent?.type === "doc"
    const shouldShowEditor = isValidDoc || initialContent === null


    const editor = useEditor(
        {
            extensions: [
                StarterKit,
                LineHeight,
            ],
            content: isValidDoc ? initialContent : fallbackDoc,
            editable: true,
            onUpdate({ editor }) {
                const json = editor.getJSON()
                setLatestContent(json)
                setSavingStatus("Saving...")
            },
        },
        [initialContent]
    )

    function handleDownloadAsHtml() {
        if (!editor) return;
        const html = editor.getHTML();
        const full = `
<!doctype html>
<html>
  <head>
    <meta charset="utf-8">
    <title>${title || "note"}</title>
    <style>
      body { font-family: sans-serif; padding: 24px; }
      h1 { font-size: 1.8em; margin-bottom: .5em; }
    </style>
  </head>
  <body>
    <h1>${title || "Untitled"}</h1>
    ${html}
  </body>
</html>
`;
        const blob = new Blob([full], { type: "text/html" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${(title || "note").replace(/\s+/g, "_")}.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }


    useDebounce(
        () => {
            if (!id || !title.trim()) return
            supabase.from("notes").update({ title }).eq("id", id)
                .then(() => setSavingStatus("Saved!"))
        },
        1000,
        [title]
    )

    useDebounce(
        () => {
            if (!id || !latestContent) return
            supabase.from("notes").update({ content: latestContent }).eq("id", id)
                .then(() => setSavingStatus("Saved!"))
        },
        1500,
        [latestContent]
    )

    useDebounce(
        () => {
            if (latestContent && title && onUpdate) {
                onUpdate({ title, excerpt: extractExcerpt(latestContent) })
            }
        },
        1000,
        [title, latestContent]
    )

    useEffect(() => {
        const fetchNote = async () => {
            const { data, error } = await supabase.from("notes").select("title, content").eq("id", id).single()
            if (data) {
                setTitle(data.title)
                setInitialContent(data.content)
            } else {
                console.error("Failed to fetch note:", error)
            }
        }
        fetchNote()
    }, [id])

    return (
        <main className="flex-1 overflow-y-auto p-6 bg-white/90 backdrop-blur-sm space-y-4 rounded-2xl">
            {shouldShowEditor && editor ? (
                <>
                    {/* Title and delete */}
                    <div className="flex items-baseline justify-between border-b border-gray-200 pb-2">
                        <input
                            value={title}
                            onChange={e => { setTitle(e.target.value); setSavingStatus("Saving...") }}
                            placeholder="Untitled"
                            className="flex-1 text-4xl font-semibold focus:border-black outline-none bg-transparent"
                        />
                        <button
                            onClick={() => onDelete?.(id)}
                            className="ml-4 p-1 rounded hover:bg-red-100 transition"
                            aria-label="Delete note"
                        >
                            <Trash2 className="w-5 h-5 text-red-500" />
                        </button>
                    </div>

                    {/* Toolbar + Save Status */}
                    <div className="flex items-center justify-between gap-3 border-b pb-2">
                        <div className="flex gap-3">
                            <button
                                onClick={() => editor.chain().focus().toggleBold().run()}
                                disabled={!editor}
                                className={`p-1 rounded ${editor.isActive("bold") ? "bg-gray-200" : ""}`}
                            >
                                <Bold className="w-5 h-5" />
                            </button>

                            <button
                                onClick={() => editor.chain().focus().toggleItalic().run()}
                                disabled={!editor}
                                className={`p-1 rounded ${editor.isActive("italic") ? "bg-gray-200" : ""}`}
                            >
                                <Italic className="w-5 h-5" />
                            </button>

                            <button
                                onClick={handleDownloadAsHtml}
                                disabled={!editor}
                                className="p-1 rounded hover:bg-gray-200 transition"
                                title="Download note"
                            >
                                <Download className="w-5 h-5" />
                            </button>
                            <button
                                onClick={() => editor.chain().focus().insertContent('    ').run()}
                                className="p-1 rounded hover:bg-gray-200"
                                title="Tab"
                            >
                                Tab
                            </button>

                            <button
                                onClick={() => editor.chain().focus().setLineHeight('1').run()}
                                className={`p-1 rounded ${editor.getAttributes('paragraph').lineHeight === '1' ? 'bg-gray-200' : ''}`}
                            >
                                1.0
                            </button>

                            <button
                                onClick={() => editor.chain().focus().setLineHeight('1.5').run()}
                                className={`p-1 rounded ${editor.getAttributes('paragraph').lineHeight === '1.5' ? 'bg-gray-200' : ''}`}
                            >
                                1.5
                            </button>

                            <button
                                onClick={() => editor.chain().focus().setLineHeight('2').run()}
                                className={`p-1 rounded ${editor.getAttributes('paragraph').lineHeight === '2' ? 'bg-gray-200' : ''}`}
                            >
                                2.0
                            </button>
                        </div>
                        {/* Moved Save Status into the toolbar row */}
                        <p className="text-xs text-gray-500">
                            {savingStatus}
                        </p>
                    </div>

                    {/* Editor content */}
                    <div className="pt-4 prose prose-lg min-h-[60vh] focus-within:outline-none">
                        <EditorContent editor={editor} />
                    </div>


                </>
            ) : (
                <p className="text-gray-400">Loading...</p>
            )}
        </main>
    )
}
