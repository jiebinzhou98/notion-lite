// src/app/explore/page.tsx
'use client'
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import NoteCard, { NoteSummary } from "@/components/ui/NoteCard"

export default function ExplorePage() {
  const [notes, setNotes] = useState<NoteSummary[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchNotes = async () => {
      const { data, error } = await supabase
        .from("notes")
        .select("id, title, created_at, content")
        .order("created_at", { ascending: false })

      if (data) {
        const list = data.map(item => ({
          id: item.id,
          title: item.title,
          created_at: item.created_at,
          excerpt: typeof item.content === "object"
            ? (item.content.content?.[0]?.content?.[0]?.text || "")
            : ""
        }))
        setNotes(list)
      } else {
        console.error(error)
      }
      setLoading(false)
    }

    fetchNotes()
  }, [])

  return (
    <main className="p-4 max-w-2xl mx-auto space-y-4">
      <h1 className="text-2xl font-bold">Explore Notes</h1>

      {loading && <p className="text-sm text-gray-500">Loading …</p>}
      {!loading && notes.length === 0 && (
        <p className="text-gray-500">No notes yet. Try creating one!</p>
      )}

      <div className="grid gap-4">
        {notes.map(note => (
          <NoteCard key={note.id} note={note} />
        ))}
      </div>
    </main>
  )
}
