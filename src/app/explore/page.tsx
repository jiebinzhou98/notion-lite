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

  //添加note
  const handleCreateNote = async () =>{
    const {data, error} = await supabase
        .from("notes")
        .insert({
            title:"Enter your title here...",
            content: {type: "doc", content: []},
            is_pinned: false,
        })
        .select()
        .single()

    if(data){
        const newNote = {
            id: data.id,
            title: data.title,
            created_at: data.create_at,
            excerpt: "",
            is_pinned: false,
        }

        setNotes(prev => [newNote, ...prev])
        setSelectedNoteId(data.id)
    }else{
        console.error("Failed to create note", error)
        alert("Failed to created")
    }
  }

  //删除note
  const handleDelete = async (noteId: string)=>{
    const confirmed = window.confirm("Confirmation to delete this note?")
    if(confirmed) return 
    const {error} = await supabase
        .from("notes")
        .delete()
        .eq("id", noteId)
    if(error){
        console.error("Failed to delete", error)
        alert("Failed to delete")
        return
    }
    setNotes(prev => prev.filter(n => n.id !== noteId))

    if(noteId === selectedNoteId){
        if(noteId.length > 1){
            const nextNote = notes.find(n => n.id !== noteId)
            setSelectedNoteId(nextNote?.id || null)
        }else{
            setSelectedNoteId(null)
        }
    }
  }

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

        <button
            onClick={handleCreateNote}
            className="w-full text-center bg-black text-white rounded-full py-2 text-sm hover:bg-gray-800 transition mb-4"
        >
            ➕ 
        </button>

        {filteredNotes.length === 0 && (
          <p className="text-sm text-muted-foreground">No matching notes</p>
        )}

        {filteredNotes.map(note => (
          <NoteCard
            key={note.id}
            note={note}
            isActive={note.id === selectedNoteId}
            onSelect={setSelectedNoteId}
            onTogglePin={() =>{
                setNotes(prev =>
                [...prev]
                    .map(n => n.id === note.id ? {...n, is_pinned: !n.is_pinned} : n)
                    .sort((a, b) => {
                        if(a.is_pinned === b.is_pinned){
                            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                        }
                        return (b.is_pinned ? 1 : 0) - (a.is_pinned ? 1: 0)
                    })
                )
            }}
          />
        ))}
      </aside>

      {/* 右侧编辑器区域 */}
      <main className="flex-1 overflow-y-auto p-8">
        {selectedNoteId ? (
        <div className="bg-white border rounded-2xl shadow-sm p-6 max-w-4xl mx-auto">
            <div className="flex justify-between items-center">
                <button
                    onClick={() => handleDelete(selectedNoteId)}
                    className="text-red-600 text-sm hover:underline"
                >
                    delete
                </button>
            </div>
          <NoteDetailEditor 
            id={selectedNoteId} 
            onUpdate={({title,excerpt}) =>{
                setNotes(prev =>
                    [...prev].map(n =>
                        n.id === selectedNoteId ? {...n, title,excerpt} : n
                    )
                )
            }}
            />
            </div>
        ) : (
          <p className="text-muted-foreground">Select a note to view</p>
        )}
      </main>
    </div>
  )
}
