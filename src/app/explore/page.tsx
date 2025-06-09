// src/app/explore/page.tsx
'use client'
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import NoteCard, { NoteSummary } from "@/components/ui/NoteCard"

export default function ExplorePage() {
  const [notes, setNotes] = useState<NoteSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    const fetchNotes = async () => {
      const { data, error } = await supabase
        .from("notes")
        .select("id, title, created_at, content, is_pinned")
        .order("is_pinned", {ascending: false})
        .order("created_at", { ascending: false })

      if (data) {
        const list = data.map(item => {
          let excerpt = ""
          try {
            const paragraph = item.content?.content?.find((b: any) => b.type === "paragraph")
            excerpt = paragraph?.content?.[0]?.text || ""
          } catch (err) {
            excerpt = ""
          }

          return {
            id: item.id,
            title: item.title,
            created_at: item.created_at,
            excerpt,
            is_pinned: item.is_pinned,
          }
        })
        setNotes(list)
      } else {
        console.error(error)
      }
      setLoading(false)
    }

    fetchNotes()
  }, [])

  //过滤器
  const filteredNotes = notes.filter(note =>{
    const query = searchTerm.toLocaleLowerCase()
    return (
        note.title.toLowerCase().includes(query) || 
        note.excerpt?.toLocaleLowerCase().includes(query)
    )
  })


  return (
    <main className="p-4 max-w-2xl mx-auto space-y-4">
      <h1 className="text-2xl font-bold">Explore Notes</h1>
        <div className="relative">
        <input
        type="text"
        value={searchTerm}
        onChange = {e => setSearchTerm(e.target.value)}
        placeholder="Search notes..."
        className="w-full pl-10 pr-4 py-2 rounded-full border border-gray-300 text-sm sm:text-base shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
        />
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-base pointer-events-none select-none">🔍</span>
        </div>
      {loading && <p className="text-sm text-gray-500">Loading …</p>}
      {!loading && notes.length === 0 && (
        <p className="text-gray-500">No notes yet. Try creating one!</p>
      )}

      {/* 如果没有要查找的notes */}
      {!loading && filteredNotes.length === 0 && searchTerm &&(
        <p className="text-sm text-muted-foreground">No matching notes found</p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {filteredNotes.map(note => (
          <NoteCard 
            key={note.id} 
            note={note} 
            onTogglePin={()=>{
                setNotes(prev =>
                [...prev].map(n =>
                    n.id === note.id ? {...n, is_pinned: !n.is_pinned} : n
                ).sort((a, b) => {
                    if (a.is_pinned === b.is_pinned){
                        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                    }
                    return (b.is_pinned ? 1: 0) - (a.is_pinned ? 1: 0)
                })
                )
            }}
          />
        ))}
      </div>
    </main>
  )
}
