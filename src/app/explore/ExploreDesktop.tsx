'use client'
import { useEffect, useRef, useState } from "react"
import { supabase } from "@/lib/supabase"
import NoteCard, { NoteSummary } from "@/components/ui/NoteCard"
import NoteDetailEditor from "@/components/ui/NoteDetailEditor"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import DesktopNavbar from "@/components/ui/DesktopNavbar"

export default function ExploreDesktop() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const pathname = usePathname()
    const selectedFromUrl = searchParams.get("selected")

    interface NoteSummaryWithFolder extends NoteSummary {
        folder_id: string | null
    }

    const [notes, setNotes] = useState<NoteSummaryWithFolder[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")
    const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null)

    const [folders, setFolders] = useState<{ id: string; name: string }[]>([])
    const [selectedFolder, setSelectedFolder] = useState<string | null>(null)

    // Drawer & new-folder UI
    const [drawerOpen, setDrawerOpen] = useState(false)
    const [creatingFolder, setCreatingFolder] = useState(false)
    const [newFolderName, setNewFolderName] = useState("")
    const folderInputRef = useRef<HTMLInputElement>(null)

    // 右键菜单相关状态
    const [contextMenuVisible, setContextMenuVisible] = useState(false)
    const [contextMenuPosition, setContextMenuPosition] = useState<{ x: number, y: number }>({ x: 0, y: 0 })
    const [contextNoteId, setContextNoteId] = useState<string | null>(null)

    useEffect(() => {
        if (selectedFromUrl) {
            setSelectedNoteId(selectedFromUrl)
        }
    }, [selectedFromUrl])

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

    const filteredNotes = notes
        .filter((n) => selectedFolder === null || n.folder_id === selectedFolder)
        .filter((note) => {
            const q = searchTerm.toLowerCase()
            return (
                note.title.toLowerCase().includes(q) ||
                note.excerpt?.toLowerCase().includes(q)
            )
        })

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

    async function confirmCreateFolder(name: string) {
        const trimmedName = name.trim()
        if (!trimmedName) {
            setCreatingFolder(false)
            return
        }
        const { data, error } = await supabase
            .from("folders")
            .insert({ name: trimmedName})
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

    const handleDeleteFolder = async (folderId: string) => {
        if (!confirm("Delete this folder and all its notes?")) return
        await supabase
            .from("notes")
            .update({ folder_id: null })
            .eq("folder_id", folderId)
        const { error } = await supabase.from("folders").delete().eq("id", folderId)
        if (error) {
            console.error(error)
            return
        }
        setFolders(folders.filter(f => f.id !== folderId))
        if (selectedFolder === folderId) {
            setSelectedFolder(null)
        }
    }

    // 右键点击笔记
    const handleNoteContextMenu = (e: React.MouseEvent, noteId: string) => {
        e.preventDefault()
        setContextNoteId(noteId)
        setContextMenuPosition({ x: e.clientX, y: e.clientY })
        setContextMenuVisible(true)
    }

    // 移动笔记到指定文件夹
    const moveNoteToFolder = async (folderId: string | null) => {
        if (!contextNoteId) return
        const { error } = await supabase
            .from('notes')
            .update({ folder_id: folderId })
            .eq('id', contextNoteId)
        if (error) {
            console.error('Failed to move note', error)
            alert('Failed to move note')
        } else {
            // 更新本地状态
            setNotes((ns) =>
                ns.map((n) =>
                    n.id === contextNoteId ? { ...n, folder_id: folderId } : n
                )
            )
            // 如果移动的笔记是当前选中，更新 selectedFolder 以同步过滤
            if (contextNoteId === selectedNoteId) {
                setSelectedFolder(folderId)
            }
        }
        setContextMenuVisible(false)
    }

    // 关闭菜单，监听点击页面空白处
    useEffect(() => {
        const handleClickOutside = () => {
            if (contextMenuVisible) setContextMenuVisible(false)
        }
        window.addEventListener('click', handleClickOutside)
        window.addEventListener('scroll', handleClickOutside)
        return () => {
            window.removeEventListener('click', handleClickOutside)
            window.removeEventListener('scroll', handleClickOutside)
        }
    }, [contextMenuVisible])

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <p className="text-gray-500">Loading…</p>
            </div>
        )
    }

    return (
        <div className="flex flex-col h-screen">
            <DesktopNavbar
                folders={folders}
                selectedFolder={selectedFolder}
                onSelectFolder={setSelectedFolder}
                onDeleteFolder={handleDeleteFolder}
                onCreateFolder={confirmCreateFolder}
                onCreateNote={handleCreateNote}
                onSearch={(query) => setSearchTerm(query)}
                searchValue={searchTerm}
                setSearchValue={setSearchTerm}
                title="Explore Notes"
            />

            <div className="flex flex-1 mt-14">

                <aside
                    className="flex-shrink-0 w-64 p-4 bg-white overflow-y-auto border-r border-gray-200"
                    style={{ height: "calc(100vh - 56px)" }}
                >
                    {filteredNotes.length === 0 ? (
                        <p className="text-sm text-gray-500">No matching notes</p>
                    ) : (
                        filteredNotes.map((note) => (
                            <div
                                key={note.id}
                                className="mb-3"
                                onContextMenu={(e) => handleNoteContextMenu(e, note.id)}
                            >
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

                <main
                    className="flex-1 bg-white overflow-auto"
                    style={{ height: "calc(100vh - 56px)" }}
                >
                    {selectedNoteId ? (
                        <NoteDetailEditor
                            id={selectedNoteId}
                            folders={folders}
                            selectedFolder={selectedFolder}
                            onMoveFolder={(newId) => {
                                setNotes((ns) =>
                                    ns.map((n) =>
                                        n.id === selectedNoteId ? { ...n, folder_id: newId } : n
                                    )
                                )
                                setSelectedFolder(newId)
                                router.replace(`/explore?selected=${selectedNoteId}`)
                            }}
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

            {/* 右键菜单 */}
            {contextMenuVisible && (
                <ul
                    className="absolute bg-white shadow-md rounded border border-gray-300"
                    style={{ top: contextMenuPosition.y, left: contextMenuPosition.x, zIndex: 10000, width: 200 }}
                    onContextMenu={(e) => e.preventDefault()}
                >
                    <li
                        className="px-4 py-2 cursor-pointer hover:bg-gray-100"
                        onClick={() => moveNoteToFolder(null)}
                    >
                        No Folder
                    </li>
                    {folders.map((folder) => (
                        <li
                            key={folder.id}
                            className="px-4 py-2 cursor-pointer hover:bg-gray-100"
                            onClick={() => moveNoteToFolder(folder.id)}
                        >
                            {folder.name}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    )
}
