// src/app/explore/page.tsx
'use client'
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import NoteCard, { NoteSummary } from "@/components/ui/NoteCard"
import NoteDetailEditor from "@/components/ui/NoteDetailEditor"

export default function ExplorePage() {
  const [notes, setNotes] = useState<NoteSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null)

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

        if(!selectedNoteId && list.length > 0){
            setSelectedNoteId(list[0].id)
        }

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
    <div className="flex h-screen">
      {/* 左侧笔记列表 */}
      <aside className="w-[300px] border-r overflow-y-auto p-4 space-y-2">
        <div className="relative mb-4">
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search notes..."
            className="w-full pl-10 pr-4 py-2 rounded-full border text-sm shadow-sm"
          />
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
        </div>

        {filteredNotes.length === 0 && (
          <p className="text-sm text-muted-foreground">No matching notes</p>
        )}

        {filteredNotes.map(note => (
          <NoteCard
            key={note.id}
            note={note}
            isActive={note.id === selectedNoteId}
            onSelect={setSelectedNoteId}
          />
        ))}
      </aside>

      {/* 右侧编辑器区域 */}
      <main className="flex-1 overflow-y-auto p-4">
        {selectedNoteId ? (
          <NoteDetailEditor 
            id={selectedNoteId} 
            onUpdate={({title,excerpt}) =>{
                setNotes(prev =>
                    prev.map(note =>
                        note.id === selectedNoteId ? {...note, title,excerpt} : note
                    )
                )
            }}
            />
        ) : (
          <p className="text-muted-foreground">Select a note to view</p>
        )}
      </main>
    </div>
  )
}
