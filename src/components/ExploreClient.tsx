// components/ExploreClient.tsx
'use client'

import { useEffect, useState } from "react"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { supabase } from "@/lib/supabase"
import NoteCard, { NoteSummary } from "@/components/ui/NoteCard"
import NoteDetailEditor from "@/components/ui/NoteDetailEditor"
import { Plus } from "lucide-react"

export default function ExploreClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const selectedFromUrl = searchParams.get("selected")

  const [notes, setNotes] = useState<NoteSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null)

  // 同步 URL -> state
  useEffect(() => {
    if (selectedFromUrl) setSelectedNoteId(selectedFromUrl)
  }, [selectedFromUrl])

  // Resize -> 跳转 mobile
  useEffect(() => {
    function onResize() {
      if (window.innerWidth < 768 && selectedNoteId && selectedFromUrl) {
        router.replace(`/explore/${selectedNoteId}`)
      }
    }
    onResize()
    window.addEventListener("resize", onResize)
    return () => window.removeEventListener("resize", onResize)
  }, [selectedNoteId, router, selectedFromUrl])

  // 拉数据
  useEffect(() => {
    supabase
      .from("notes")
      .select("id, title, created_at, content, is_pinned")
      .order("is_pinned", { ascending: false })
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (data) {
          const list = data.map(item => {
            let excerpt = ""
            try {
              const p = item.content?.content?.find((b: any) => b.type === "paragraph")
              excerpt = p?.content?.[0]?.text || ""
            } catch { }
            return {
              id: item.id,
              title: item.title,
              created_at: item.created_at,
              excerpt,
              is_pinned: item.is_pinned,
            }
          })
          setNotes(list)
          if (selectedFromUrl) {
            setSelectedNoteId(selectedFromUrl)
          } else if (list.length > 0) {
            setSelectedNoteId(list[0].id)
          }
        }
        setLoading(false)
      })
  }, [selectedFromUrl])

  // 过滤
  const filtered = notes.filter(n => {
    const q = searchTerm.toLowerCase()
    return n.title.toLowerCase().includes(q)
      || (n.excerpt || "").toLowerCase().includes(q)
  })

  // 新建
  const createNote = async () => {
    const { data, error } = await supabase
      .from("notes")
      .insert({ title: "", content: { type: "doc", content: [] }, is_pinned: false })
      .select()
      .single()
    if (data) {
      const newN: NoteSummary = {
        id: data.id,
        title: data.title,
        created_at: data.created_at,
        excerpt: "",
        is_pinned: false,
      }
      setNotes(prev => [newN, ...prev])
      setSelectedNoteId(data.id)
      router.replace(`/explore?selected=${data.id}`)
    }
  }

  // 监听 ?new=1
  useEffect(() => {
    if (pathname === "/explore" && searchParams.get("new") === "1") {
      createNote()
    }
  }, [pathname, searchParams])

  // 删除
  const deleteNote = async (id: string) => {
    if (!confirm("Delete?")) return
    await supabase.from("notes").delete().eq("id", id)
    setNotes(ns => ns.filter(n => n.id !== id))
    if (id === selectedNoteId) {
      setSelectedNoteId(notes.find(n => n.id !== id)?.id || null)
    }
  }

  if (loading) return <div>Loading…</div>

  return (
    <div className="flex h-screen">
      <aside className="w-full md:w-[300px] p-4 overflow-y-auto border-r">
        <input
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          placeholder="Search..."
          className="w-full mb-4 p-2 border rounded"
        />
        {filtered.map(n => (
          <NoteCard
            key={n.id}
            note={n}
            isActive={n.id === selectedNoteId}
            onSelect={setSelectedNoteId}
            onTogglePin={() => {
              setNotes(prev =>
                prev
                  .map(x => x.id === n.id ? { ...x, is_pinned: !x.is_pinned } : x)
                  .sort((a, b) => (b.is_pinned ? 1 : 0) - (a.is_pinned ? 1 : 0))
              )
            }}
          />
        ))}
        <button onClick={createNote} className="mt-4 p-2 bg-indigo-600 text-white rounded">
          + New
        </button>
      </aside>
      <main className="hidden md:flex-1 md:flex md:flex-col md:overflow-y-auto p-6">
        {selectedNoteId
          ? <NoteDetailEditor id={selectedNoteId} onDelete={deleteNote} onUpdate={({ title, excerpt }) => {
              setNotes(ns => ns.map(x => x.id === selectedNoteId ? { ...x, title, excerpt } : x))
            }}
          />
          : <p>Select a note</p>
        }
      </main>
    </div>
  )
}
