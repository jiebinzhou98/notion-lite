// src/app/explore/page.tsx
'use client'
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import NoteCard, { NoteSummary } from "@/components/ui/NoteCard"
import NoteDetailEditor from "@/components/ui/NoteDetailEditor"
import { Plus, Edit } from "lucide-react"
import { useRouter, useSearchParams, usePathname } from "next/navigation"

export default function ClientExplorePage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const pathname = usePathname()
    const selectedFromUrl = searchParams.get("selected")

    const [notes, setNotes] = useState<NoteSummary[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")
    const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null)

    useEffect(() => {
        if (selectedFromUrl) {
            setSelectedNoteId(selectedFromUrl)
        }
    }, [selectedFromUrl])

    useEffect(() => {
        let redirected = false
        function onResize() {
            if (window.innerWidth < 768 && selectedNoteId
                && searchParams.get("selected")
            ) {
                redirected = true
                router.replace(`/explore/${selectedNoteId}`)
            }
        }
        onResize()
        window.addEventListener("resize", onResize)
        return () => window.removeEventListener("resize", onResize)
    }, [selectedNoteId, router, searchParams])

    useEffect(() => {
        const fetchNotes = async () => {
            const { data, error } = await supabase
                .from("notes")
                .select("id, title, created_at, content, is_pinned")
                .order("is_pinned", { ascending: false })
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

                if (selectedFromUrl) {
                    setSelectedNoteId(selectedFromUrl)
                } else if (list.length > 0) {
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
    const filteredNotes = notes.filter(note => {
        const query = searchTerm.toLocaleLowerCase()
        return (
            note.title.toLowerCase().includes(query) ||
            note.excerpt?.toLocaleLowerCase().includes(query)
        )
    })

    //添加note
    const handleCreateNote = async () => {
        const { data, error } = await supabase
            .from("notes")
            .insert({
                title: "",
                content: { type: "doc", content: [] },
                is_pinned: false,
            })
            .select()
            .single()

        if (data) {
            const newNote = {
                id: data.id,
                title: data.title,
                created_at: data.created_at,
                excerpt: "",
                is_pinned: false,
            }

            setNotes(prev => [newNote, ...prev])
            setSelectedNoteId(data.id)
            router.replace(`/explore?selected=${data.id}`)
        } else {
            console.error("Failed to create note", error)
            alert("Failed to created")
        }
    }

    // useEffect(() => {
    //     if (searchParams.get("new") === "1") {
    //         handleCreateNote()
    //     }
    // }, [searchParams])

    useEffect(() => {
        if (pathname === "/explore" && searchParams.get("new") === "1") {
            handleCreateNote()
        }
    }, [pathname, searchParams])

    //删除note
    const handleDelete = async (noteId: string) => {
        const confirmed = window.confirm("Confirmation to delete this note?")
        if (!confirmed) return
        const { error } = await supabase
            .from("notes")
            .delete()
            .eq("id", noteId)
        if (error) {
            console.error("Failed to delete", error)
            alert("Failed to delete")
            return
        }
        setNotes(prev => prev.filter(n => n.id !== noteId))

        if (noteId === selectedNoteId) {
            if (noteId.length > 1) {
                const nextNote = notes.find(n => n.id !== noteId)
                setSelectedNoteId(nextNote?.id || null)
            } else {
                setSelectedNoteId(null)
            }
        }
    }

    return (
        <div className="flex h-screen">
            {/* 左侧笔记列表 */}
            <aside className="w-full md:w-[300px] p-4 bg-white/80 backdrop-blur-sm rounded-tr-xl border-r border-white/30 overflow-y-auto space-y-2">
                <div className="flex items-center mb-4 space-x-2">
                    <div className="relative flex-1">
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
                        className="flex-none flex items-center justify-center w-10 h-10
                     bg-indigo-600 text-white rounded-full shadow-lg hover:bg-indigo-500
                     active:scale-95 transition"
                        aria-label="Create new note"
                        title="Create new note"
                    >
                        <Edit className="w-6 h-6" />
                    </button>
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
                        onTogglePin={() => {
                            setNotes(prev =>
                                [...prev]
                                    .map(n => n.id === note.id ? { ...n, is_pinned: !n.is_pinned } : n)
                                    .sort((a, b) => {
                                        if (a.is_pinned === b.is_pinned) {
                                            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                                        }
                                        return (b.is_pinned ? 1 : 0) - (a.is_pinned ? 1 : 0)
                                    })
                            )
                        }}
                    />
                ))}
            </aside>

            {/* 右侧编辑器区域 */}
            <main className="hidden md:flex-1 md:flex md:flex-col h-full overflow-hidden p-6
                            bg-white/40 backdrop-blur-sm rounded-tl-xl rounded-bl-xl shadow-inner">
                {selectedNoteId ? (
                    <NoteDetailEditor
                        id={selectedNoteId}
                        onUpdate={({ title, excerpt }) => {
                            setNotes(ns =>
                                ns.map(n => n.id === selectedNoteId ? { ...n, title, excerpt } : n)
                            )
                        }}
                        onDelete={handleDelete}
                    />
                ) : (
                    <p className="text-muted-foreground p-6">Select a note to view</p>
                )}

            </main>
        </div>
    )
}
