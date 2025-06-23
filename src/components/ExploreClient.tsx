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

  // Extend NoteSummary with folder_id
  interface NoteSummaryWithFolder extends NoteSummary {
    folder_id: string | null
  }

  // Notes state
  const [notes, setNotes] = useState<NoteSummaryWithFolder[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null)

  // Folders state
  const [folders, setFolders] = useState<{ id: string; name: string }[]>([])
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null)

  // Sync URL → state
  useEffect(() => {
    if (selectedFromUrl) setSelectedNoteId(selectedFromUrl)
  }, [selectedFromUrl])

  // Mobile redirect
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

  // Fetch folders
  useEffect(() => {
    supabase
      .from("folders")
      .select("id, name")
      .order("created_at", { ascending: true })
      .then(({ data, error }) => {
        if (error) console.error("Fetch folders error:", error)
        else {
          setFolders(data || [])
          // Default to first folder (or null=All)
          if (!selectedFolder && data?.length) {
            setSelectedFolder(data[0].id)
          }
        }
      })
  }, [])

  // Fetch notes
  useEffect(() => {
    supabase
      .from("notes")
      .select("id, title, created_at, content, is_pinned, folder_id")
      .order("is_pinned", { ascending: false })
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (data) {
          const list = data.map(item => {
            let excerpt = ""
            try {
              const p = item.content?.content?.find((b: any) => b.type === "paragraph")
              excerpt = p?.content?.[0]?.text || ""
            } catch {}
            return {
              id: item.id,
              title: item.title,
              created_at: item.created_at,
              excerpt,
              is_pinned: item.is_pinned,
              folder_id: item.folder_id,
            }
          })
          setNotes(list)
          // select initial note
          if (selectedFromUrl) setSelectedNoteId(selectedFromUrl)
          else if (list.length > 0) setSelectedNoteId(list[0].id)
        }
        setLoading(false)
      })
  }, [selectedFromUrl])

  // Filter notes by folder + search
  const filtered = notes
    .filter(n => selectedFolder === null || n.folder_id === selectedFolder)
    .filter(n => {
      const q = searchTerm.toLowerCase()
      return (
        n.title.toLowerCase().includes(q) ||
        (n.excerpt || "").toLowerCase().includes(q)
      )
    })

  // Create note in current folder
  const createNote = async () => {
    const { data, error } = await supabase
      .from("notes")
      .insert({
        title: "",
        content: { type: "doc", content: [] },
        is_pinned: false,
        folder_id: selectedFolder,
      })
      .select()
      .single()
    if (data) {
      const newN: NoteSummaryWithFolder = {
        id: data.id,
        title: data.title,
        created_at: data.created_at,
        excerpt: "",
        is_pinned: data.is_pinned,
        folder_id: data.folder_id,
      }
      setNotes(prev => [newN, ...prev])
      setSelectedNoteId(data.id)
      router.replace(`/explore?selected=${data.id}`)
    }
  }

  // Delete note
  const deleteNote = async (id: string) => {
    if (!confirm("Delete?")) return
    await supabase.from("notes").delete().eq("id", id)
    setNotes(ns => ns.filter(n => n.id !== id))
    if (id === selectedNoteId) {
      setSelectedNoteId(notes.find(n => n.id !== id)?.id || null)
    }
  }

  // Handle new=1
  useEffect(() => {
    if (pathname === "/explore" && searchParams.get("new") === "1") {
      createNote()
    }
  }, [pathname, searchParams])

  if (loading) return <div>Loading…</div>

  return (
    <div className="flex h-screen">
      {/* Folders panel */}
      <aside className="w-full md:w-64 p-4 bg-white/90 border-r overflow-y-auto">
        <h3 className="mb-2 font-semibold">Folders</h3>
        <div className="space-y-1 mb-4">
          <button
            onClick={() => setSelectedFolder(null)}
            className={`block w-full text-left px-3 py-1 rounded ${
              selectedFolder === null ? "bg-indigo-600 text-white" : "hover:bg-gray-100"
            }`}
          >
            All
          </button>
          {folders.map(f => (
            <button
              key={f.id}
              onClick={() => setSelectedFolder(f.id)}
              className={`block w-full text-left px-3 py-1 rounded ${
                selectedFolder === f.id ? "bg-indigo-600 text-white" : "hover:bg-gray-100"
              }`}
            >
              {f.name}
            </button>
          ))}
        </div>

        {/* Search & New */}
        <div className="flex mb-4 space-x-2">
          <input
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search notes..."
            className="flex-1 px-3 py-2 border rounded"
          />
          <button
            onClick={createNote}
            className="w-10 h-10 bg-indigo-600 text-white rounded flex items-center justify-center"
            title="New note"
          >
            <Plus />
          </button>
        </div>

        {/* Note list */}
        {filtered.length === 0 ? (
          <p className="text-sm text-gray-500">No notes</p>
        ) : (
          filtered.map(n => (
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
          ))
        )}
      </aside>

      {/* Editor */}
      <main className="hidden md:flex-1 md:flex md:flex-col p-6 overflow-y-auto bg-white/40">
        {selectedNoteId ? (
          <NoteDetailEditor
            id={selectedNoteId}
            folders={folders}
            selectedFolder={selectedFolder}
            onMoveFolder={(newId) => {
              // update note locally
              setNotes(ns =>
                ns.map(x => x.id === selectedNoteId ? { ...x, folder_id: newId } : x)
              )
              // switch to that folder
              setSelectedFolder(newId)
              // update URL
              router.replace(`/explore?selected=${selectedNoteId}`)
            }}
            onDelete={deleteNote}
            onUpdate={({ title, excerpt }) =>
              setNotes(ns =>
                ns.map(x => x.id === selectedNoteId ? { ...x, title, excerpt } : x)
              )
            }
          />
        ) : (
          <p className="text-gray-500">Select a note</p>
        )}
      </main>
    </div>
  )
}
