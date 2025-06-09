'use client'

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { NoteSummary } from "@/components/ui/NoteCard"
import NoteCard from "@/components/ui/NoteCard"
import NoteDetailEditor from "@/components/ui/NoteDetailEditor"
import { useSearchParams } from "next/navigation"

export default function EditorPage(){
    const [notes, setNotes] = useState<NoteSummary[]>([])
    const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null)
    const searchParams = useSearchParams()
    const initialId = searchParams.get("id")

    useEffect(() =>{
        const fetchNotes = async () =>{
            const {data} = await supabase
                .from('notes')
                .select('id, title, created_at, content, is_pinned')
                .order('is_pinned', {ascending:false})
                .order('created_at', {ascending: false})

            if(data){
                setNotes(data)
                if(!selectedNoteId && data.length > 0){
                    setSelectedNoteId(initialId || data[0].id)
                }
            }
        }
        fetchNotes()
    }, [])

    return (
        <div className="flex h-screen">
            <aside className="w-[300px] border-r overflow-y-auto p-4 space-y-2">
                {notes.map(note =>(
                    <NoteCard 
                        key={note.id}
                        note={note} 
                        isActive={note.id === selectedNoteId} 
                        onSelect={setSelectedNoteId}
                    />
                ))}
            </aside>
            <main className="flex-1 overflow-y-auto p-4">
                {selectedNoteId ? (
                    <NoteDetailEditor id = {selectedNoteId}/>
                ): (
                    <p className="text-muted-foreground">Select a note to view</p>
                )}
            </main>
        </div>
    )
}