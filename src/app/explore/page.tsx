'use client'

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import Link from "next/link"
import NoteCard from "@/components/ui/NoteCard"

//setup note
type Note = {
    id: string
    title: string
    created_at: string
}

export default function ExplorePage(){

    //查询supabase的notes
    const [notes, setNotes] = useState<Note[]>([])
    //控制加载
    const [loading, setLoading] = useState(true)


    //触发
    useEffect(() =>{

        //从supabase的notes取得note的内容
        const fetchNotes = async () =>{
            const {data, error} = await supabase
                .from('notes')
                .select('id, title, created_at')
                .order('created_at', {ascending: false})

            //如果有报错
            if(error){
                console.error("Failed to fetch notes: ",error)
            }else{
                setNotes(data || [])
            }
            //加载
            setLoading(false)
        }
        fetchNotes()
    }, [])

    return(
        <main className="p-4 max-w-2xl mx-auto space-y-4">
            <h1 className="text-2xl font-bold">This is the Explore page</h1>

            {loading &&<p className="text-sm text-gray-500">Loading ...</p>}

            {notes.length === 0 && !loading && (
                <p className="text-gray-500">No notes yet. Try creating one!</p>
            )}

            <ul className="space-y-3">
                {notes.map(note => (
                    <li key={note.id}>
                        <NoteCard note={note}/>
                    </li>
                ))}
            </ul>
        </main>
    )
}