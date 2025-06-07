'use client'

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"

type Note = {
    id: string
    title: string
    content: any
}

export default function NoteDetailPage(){
    const { id } = useParams()
    const router = useRouter()
    const [note, setNote] = useState<Note | null>(null)
    const [loading, setLoading] = useState(true)

    const editor = useEditor({
        extensions: [StarterKit],
        editable: false,  //只读
        content: note?.content || "",
    })

    useEffect(() =>{
        const fetchNotes = async () =>{
            const {data, error} = await supabase
                .from("notes")
                .select("*")
                .eq("id", id)
                .single()

            if(error){
                console.error("Failed to fetch notes: ",error)
            }else{
                setNote(data)
            }
            setLoading(false)
        }
        fetchNotes()
    },[id])

    return(
        <main className="p-4 max-w-2xl mx-auto space-y-4">
            <button
                onClick={() => router.push("/explore")}
                className="text-sm text-blue-600 underline"
            >
                ← Back to Explore
            </button>
            {loading ? (
                <p className="text-gray-500">Loading...</p>
            ): note?(
                <>
                    <h1 className="text-2xl font-bold">{note.title}</h1>
                    <EditorContent editor={editor}/>
                </>
            ): (
                <p className="text-red-500">Note not found</p>
            )}
        </main>
    )
}