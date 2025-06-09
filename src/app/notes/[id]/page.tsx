'use client'

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { useEditor, EditorContent, JSONContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import { useDebounce } from "@/lib/useDebounce"

export default function NoteDetailPage() {
    const { id } = useParams()
    const [title, setTitle] = useState("")
    const [initialContent, setInitialContent] = useState<JSONContent | null>(null)
    const [savingStatus, setSavingStatus] = useState("")
    const [latestContent, setLatestContent] = useState<JSONContent | null>(null)

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

    //自动保存
    useDebounce(() => {
        if (!id || !latestContent) return

        const save = async () => {
            await supabase
                .from("notes")
                .update({ content: latestContent })
                .eq("id", id)
            setSavingStatus("Saved!")
        }
        save()
    }, 1500, [latestContent])

    useDebounce(() => {
        if (!id || !title.trim()) return

        const saveTitle = async () => {
            await supabase
                .from("notes")
                .update({ title })
                .eq("id", id)
            setSavingStatus("Saved!")
        }
        saveTitle()
    }, 1000, [title])


    //获取初始数据
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
        <main className="p-4 py-6 md:px-8 max-w-3xl mx-auto space-y-4">
            <input
                value={title}
                onChange={(e) => {
                    setTitle(e.target.value)
                    setSavingStatus("Saving...")
                }}
                placeholder="Untitled"
                className="w-full text-3xl font-bold outline-none bg-transparent"
            />
            {shouldShowEditor && editor ? (
                <>
                    <div className="min-h-[60vh] border rounded-xl bg-background p-6 shadow-sm">
                        <EditorContent editor={editor} />
                    </div>
                    <p className="text-sm text-muted-foreground text-right">{savingStatus}</p>
                </>
            ) : (
                <p className="text-gray-500">Loading...</p>
            )}
        </main>
    )
}