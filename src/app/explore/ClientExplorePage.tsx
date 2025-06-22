'use client'
import { useEffect, useRef, useState } from "react"
import { supabase } from "@/lib/supabase"
import NoteCard, { NoteSummary } from "@/components/ui/NoteCard"
import NoteDetailEditor from "@/components/ui/NoteDetailEditor"
import { Plus, Edit, ChevronsLeft, ChevronsRight } from "lucide-react"
import { useRouter, useSearchParams, usePathname } from "next/navigation"

export default function ClientExplorePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const selectedFromUrl = searchParams.get("selected")

  // Extend NoteSummary to include folder_id
  interface NoteSummaryWithFolder extends NoteSummary {
    folder_id: string | null
  }

  // STATE ------------------------------------------------------
  const [notes, setNotes] = useState<NoteSummaryWithFolder[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null)

  const [folders, setFolders] = useState<{ id: string; name: string }[]>([])
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null)

  // Drawer & new‐folder UI
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [creatingFolder, setCreatingFolder] = useState(false)
  const [newFolderName, setNewFolderName] = useState("")
  const folderInputRef = useRef<HTMLInputElement>(null)

  // LIFECYCLE --------------------------------------------------
  // pick up URL‐selected note
  useEffect(() => {
    if (selectedFromUrl) {
      setSelectedNoteId(selectedFromUrl)
    }
  }, [selectedFromUrl])

  // redirect to single‐note view on mobile
  useEffect(() => {
    function onResize() {
      if (
        window.innerWidth < 768 &&
        selectedNoteId &&
        searchParams.get("selected")
      ) {
        router.replace(`/explore/${selectedNoteId}`)
      }
    }
    onResize()
    window.addEventListener("resize", onResize)
    return () => window.removeEventListener("resize", onResize)
  }, [selectedNoteId, router, searchParams])

  // fetch folders
  useEffect(() => {
    supabase
      .from("folders")
      .select("id, name")
      .order("created_at", { ascending: true })
      .then(({ data, error }) => {
        if (error) console.error(error)
        else {
          setFolders(data || [])
          if (!selectedFolder && data?.length) {
            setSelectedFolder(data[0].id)
          }
        }
      })
  }, [])

  // fetch notes
  useEffect(() => {
    supabase
      .from("notes")
      .select("id, title, created_at, content, is_pinned, folder_id")
      .order("is_pinned", { ascending: false })
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (error) {
          console.error(error)
        } else if (data) {
          const list = data.map((item) => {
            let excerpt = ""
            try {
              const para = item.content?.content?.find((b: any) => b.type === "paragraph")
              excerpt = para?.content?.[0]?.text || ""
            } catch {
              excerpt = ""
            }
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
          if (selectedFromUrl) setSelectedNoteId(selectedFromUrl)
          else if (list.length > 0) setSelectedNoteId(list[0].id)
        }
        setLoading(false)
      })
  }, [])

  // HELPERS ----------------------------------------------------
  // filter by selectedFolder + search term
  const filteredNotes = notes
    .filter((n) => selectedFolder === null || n.folder_id === selectedFolder)
    .filter((note) => {
      const q = searchTerm.toLowerCase()
      return (
        note.title.toLowerCase().includes(q) ||
        note.excerpt?.toLowerCase().includes(q)
      )
    })

  // create a new note in the current folder
  const handleCreateNote = async () => {
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
    if (error || !data) {
      console.error(error)
      return
    }
    const newNote: NoteSummaryWithFolder = {
      id: data.id,
      title: data.title,
      created_at: data.created_at,
      excerpt: "",
      is_pinned: data.is_pinned,
      folder_id: data.folder_id,
    }
    setNotes((p) => [newNote, ...p])
    setSelectedNoteId(data.id)
    router.replace(`/explore?selected=${data.id}`)
  }

  // delete a note
  const handleDelete = async (noteId: string) => {
    if (!confirm("Delete this note?")) return
    const { error } = await supabase.from("notes").delete().eq("id", noteId)
    if (error) {
      console.error(error)
      return
    }
    setNotes((p) => p.filter((n) => n.id !== noteId))
    if (noteId === selectedNoteId) {
      const next = filteredNotes.find((n) => n.id !== noteId)
      setSelectedNoteId(next?.id || null)
    }
  }

  // confirm creation of a new folder
  async function confirmCreateFolder() {
    const name = newFolderName.trim()
    if (!name) {
      setCreatingFolder(false)
      return
    }
    const { data, error } = await supabase
      .from("folders")
      .insert({ name })
      .select()
      .single()
    if (error || !data) {
      console.error(error)
    } else {
      setFolders((p) => [...p, data])
      setSelectedFolder(data.id)
    }
    setNewFolderName("")
    setCreatingFolder(false)
  }

  // RENDER -----------------------------------------------------
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-500">Loading…</p>
      </div>
    )
  }

return (
    <div className="flex h-screen">
      {/* —— 抽屉：Folders —— */}
      {drawerOpen && (
        <aside className="w-64 p-4 bg-white/90 border-r border-gray-200 overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold">Folders</h3>
            {creatingFolder ? (
              <div className="flex items-center space-x-1">
                <input
                  ref={folderInputRef}
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && confirmCreateFolder()}
                  className="border px-2 py-1 rounded text-sm"
                  placeholder="Name"
                />
                <button onClick={confirmCreateFolder} className="text-green-600">
                  ✔️
                </button>
                <button
                  onClick={() => setCreatingFolder(false)}
                  className="text-red-600"
                >
                  ✖️
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  setCreatingFolder(true)
                  setTimeout(() => folderInputRef.current?.focus(), 0)
                }}
                className="p-1 rounded hover:bg-gray-100"
                title="New folder"
              >
                <Plus />
              </button>
            )}
          </div>
          <div className="space-y-2">
            <button
              onClick={() => setSelectedFolder(null)}
              className={`block w-full text-left px-3 py-1 rounded ${
                selectedFolder === null
                  ? "bg-indigo-600 text-white"
                  : "hover:bg-gray-100"
              }`}
            >
              All
            </button>
            {folders.map((f) => (
              <button
                key={f.id}
                onClick={() => setSelectedFolder(f.id)}
                className={`block w-full text-left px-3 py-1 rounded ${
                  selectedFolder === f.id
                    ? "bg-indigo-600 text-white"
                    : "hover:bg-gray-100"
                }`}
              >
                {f.name}
              </button>
            ))}
          </div>
        </aside>
      )}

      {/* —— Toggle 按钮 —— */}
      <div
        onClick={() => setDrawerOpen((o) => !o)}
        className="flex items-center justify-center cursor-pointer select-none
                   bg-white/90 border-gray-200 border-y border-l
                   px-2 hover:bg-gray-100 transition"
        title={drawerOpen ? "Hide folders" : "Show folders"}
      >
        {drawerOpen ? <ChevronsLeft /> : <ChevronsRight />}
      </div>

      {/* —— 笔记列表 —— */}
      <aside className="flex-shrink-0 w-full md:w-80 p-4 bg-white/80 overflow-y-auto">
        <div className="flex items-center mb-4 space-x-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search notes..."
              className="w-full pl-10 pr-4 py-2 rounded-full border text-sm shadow-sm"
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              🔍
            </span>
          </div>
          <button
            onClick={handleCreateNote}
            className="w-10 h-10 bg-indigo-600 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-indigo-500"
            title="New note"
          >
            <Edit className="w-5 h-5" />
          </button>
        </div>

        {filteredNotes.length === 0 ? (
          <p className="text-sm text-gray-500">No matching notes</p>
        ) : (
          filteredNotes.map((note) => (
            <div key={note.id} className="mb-3">
              <NoteCard
                note={note}
                isActive={note.id === selectedNoteId}
                onSelect={setSelectedNoteId}
                onTogglePin={() => {
                  setNotes((p) =>
                    [...p]
                      .map((n) =>
                        n.id === note.id ? { ...n, is_pinned: !n.is_pinned } : n
                      )
                      .sort((a, b) =>
                        a.is_pinned === b.is_pinned
                          ? new Date(b.created_at).getTime() -
                            new Date(a.created_at).getTime()
                          : b.is_pinned
                          ? 1
                          : -1
                      )
                  )
                }}
              />
            </div>
          ))
        )}
      </aside>

      {/* —— 编辑器 区 —— */}
      <main className="flex-1 p-6 bg-white/40 overflow-auto">
        {selectedNoteId ? (
          <NoteDetailEditor
            id={selectedNoteId}
            onUpdate={({ title, excerpt }) =>
              setNotes((ns) =>
                ns.map((n) =>
                  n.id === selectedNoteId ? { ...n, title, excerpt } : n
                )
              )
            }
            onDelete={handleDelete}
          />
        ) : (
          <p className="text-gray-500">Select or create a note</p>
        )}
      </main>
    </div>
  )
}