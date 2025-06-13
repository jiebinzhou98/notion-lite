'use client'

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { useEditor, EditorContent, JSONContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import { useDebounce } from "@/lib/useDebounce"
import { Trash2, Bold, Italic } from "lucide-react"


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
        <main className="flex-1 overflow-y-auto p-6 bg-white max-w-4xl mx-auto space-y-4">
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
