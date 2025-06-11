'use client'

import NoteDetailEditor from "@/components/ui/NoteDetailEditor"
import { useRouter, useParams } from "next/navigation"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { ArrowLeft } from "lucide-react"

export default function MobileNotePage() {
    const router = useRouter()

    const {noteId} = useParams()

    const [title, setTitle] = useState<string>("")


    //手机 => 桌面 窗口 转换
    useEffect(() =>{
        function onResize() {
            if(window.innerWidth >= 768 && noteId){
                router.replace(`/explore?selected=${noteId}`)
            }
        }
        onResize()
        window.addEventListener('resize',onResize)
        return ()=> window.removeEventListener('resize',onResize)
    }, [noteId, router])

    useEffect(() => {
        if(!noteId) return
        supabase
            .from("notes")
            .select("title")
            .eq("id", noteId)
            .single()
            .then(({data}) => {
                if(data?.title) setTitle(data.title)
            })
    }, [noteId])

    const handleDelete = async (id: string) => {
        await supabase.from("notes").delete().eq("id", id)
        router.back()
    }

    function goToList(){
        router.replace("/explore")
    }

    if(!noteId){
    return(
        <div className="h-screen flex flex-col">
            <header className="flex items-center gap-2 px-4 py-3 border-b bg-white">
            <button
                onClick={() => router.back()}
                className="p-1 rounded hoaver:bg-gray-100 transition"
            >
                <ArrowLeft className="w-5 h-5 text-gray-700"/>
            </button>
            </header>
            <div className="flex-1 flex items-center justify-center text-gray-500">
                Loading...
            </div>
        </div>
        )
    }
    return(
        <div className="h-screen flex flex-col">
            <header className="flex items-center gap-3 px-4 py-3 border-b bg-white">
            <button
                onClick={goToList} 
                className="p-1 rounded hover:bg-gray-100 transition"
            >
                <ArrowLeft className="w-5 h-5 text-gray-700"/>
            </button>
            <h1 className="text-lg font-semibold truncate">{title || "Untitled"}</h1>
            </header>
            <div className="flex-1 overflow-y-auto">
                <NoteDetailEditor 
                    id={Array.isArray(noteId) ? noteId[0] : noteId}
                    onDelete={async id => {
                        await supabase.from("notes").delete().eq("id",id)
                        goToList()
                    }}
                    onUpdate={({title: newTitle}) => {
                        setTitle(newTitle)
                    }}
                />
            </div>
        </div>
    )
}