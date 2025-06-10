'use client'

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { useEditor, EditorContent, JSONContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import { useDebounce } from "@/lib/useDebounce"
import { Trash2 } from "lucide-react"

export default function NoteDetailEditor({ id, onUpdate, onDelete}:
    {
        id: string,
        onUpdate?: (payload: { title: string; excerpt: string }) => void
        onDelete?: (id:string) =>void
    }) {
    const [title, setTitle] = useState("")
    const [initialContent, setInitialContent] = useState<JSONContent | null>(null)
    const [savingStatus, setSavingStatus] = useState("")
    const [latestContent, setLatestContent] = useState<JSONContent | null>(null)
    const extractExcerpt = (json: JSONContent | null) => { return json?.content?.[0]?.content?.[0]?.text || "" }

    const fallbackDoc: JSONContent = {
        type: "doc",
        content: [
            {
                type: "paragraph",
                content: [
                    {
                        type: "text",
                        text: "",
                    }
                ],
            },
        ],
    }

    const isValidDoc = initialContent?.type === "doc"
    const shouldShowEditor = isValidDoc || initialContent === null

    const editor = useEditor({
        extensions: [StarterKit],
        content: isValidDoc ? initialContent : fallbackDoc,
        editable: true,
        onUpdate({ editor }) {
            const json = editor.getJSON()
            setLatestContent(json)
            setSavingStatus("Saving...")
        },
    }, [initialContent])

    useDebounce(() => {
        if (!id || !title.trim()) return
        supabase
            .from("notes")
            .update({ title })
            .eq("id", id)
            .then(() => setSavingStatus("Saved!"))
    }, 1000, [title])

    useDebounce(() => {
        if (!id || !latestContent) return
        supabase
            .from("notes")
            .update({ content: latestContent })
            .eq("id", id)
            .then(() => setSavingStatus("Saved!"))
    }, 1500, [latestContent])

    // 通知外部刷新（title 或内容变更后）
    useDebounce(() => {
        if (latestContent && title && onUpdate) {
            onUpdate({
                title,
                excerpt: extractExcerpt(latestContent),
            })
        }
    }, 1000, [title, latestContent])

    useEffect(() => {
        const fetchNote = async () => {
            const { data, error } = await supabase
                .from("notes")
                .select("*")
                .eq("id", id)
                .single()

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
        <main className="flex-1 overflow-y-auto p-6 bg-white max-w-4xl mx-auto">
            {shouldShowEditor && editor ? (
                //delete button on top right
                <div className="space-y-6">
                <div className="flex justify-end">
                    <button
                        onClick={() => onDelete?.(id)}
                        className="flex items-center justify-center w-9 h-9 rounded-full hover:bg-red-100 transition"
                        aria-label="Delete Note"
                    >
                        <Trash2 className="w-5 h-5 text-red-500 hover:text-red-600"/>
                    </button>
                </div>
                
                {/* title */}
                <input
                    value={title}
                    onChange={ e => {
                        setTitle(e.target.value)
                        setSavingStatus("Saving...")
                    }}
                    placeholder="You Title Here..."
                    className="w-full text-4xl font-semibold pb-2 border-b border-gray-200 focus:border-black outline-none bg-transparent"
                />
                
                {/* Edit text */}
                <div className="prose prose-lg min-h-[60vh] focus-within:outline-none">
                    <EditorContent editor={editor}/>
                </div>

                <p className="text-xs text-gray-500 text-right">
                    {savingStatus}
                </p>
                </div>
            ): (
                <p className="text-gray-400">Loading...</p>
            )}
        </main>
    )
}
