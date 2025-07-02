// src/app/explore/[noteId]/page.tsx
'use client'

import NoteDetailEditor from "@/components/ui/NoteDetailEditor"
import { useRouter, useParams } from "next/navigation"
import { useEffect, useState, useRef } from "react"
import { supabase } from "@/lib/supabase"
import { ArrowLeft, Plus, Trash2, Menu } from "lucide-react"

export default function ExploreMobile() {
  const router = useRouter()
  const { noteId } = useParams() ?? {}

  // ——— 1. 基本状态 —————————————————————————————————
  const [title, setTitle] = useState<string>("")
  const [folders, setFolders] = useState<{ id: string; name: string }[]>([])
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  // 抽屉开关
  const [drawerOpen, setDrawerOpen] = useState(false)
  // 新建 folder UI
  const [creatingFolder, setCreatingFolder] = useState(false)
  const [newFolderName, setNewFolderName] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  // ——— 2. 桌面切换保护 ———————————————————————
  useEffect(() => {
    function onResize() {
      if (window.innerWidth >= 768 && noteId) {
        router.replace(`/explore?selected=${noteId}`)
      }
    }
    onResize()
    window.addEventListener("resize", onResize)
    return () => window.removeEventListener("resize", onResize)
  }, [noteId, router])

  // ——— 3. 拉取文件夹列表 ——————————————————————
  useEffect(() => {
    supabase
      .from("folders")
      .select("id,name")
      .order("created_at", { ascending: true })
      .then(({ data, error }) => {
        if (error) console.error(error)
        else setFolders(data ?? [])
      })
  }, [])

  // ——— 4. 拉取笔记标题 + folder_id —————————————————
  useEffect(() => {
    if (!noteId) return
    supabase
      .from("notes")
      .select("title,folder_id")
      .eq("id", noteId)
      .single()
      .then(({ data, error }) => {
        if (error) console.error(error)
        else if (data) {
          setTitle(data.title)
          setSelectedFolder(data.folder_id)
        }
        setLoading(false)
      })
  }, [noteId])

  // ——— 删除笔记 —————————————————————————————————
  const handleDelete = async (id: string) => {
    await supabase.from("notes").delete().eq("id", id)
    router.replace("/explore")
  }

  // ——— 移动笔记到新文件夹 —————————————————————
  const handleMoveFolder = async (newId: string | null) => {
    if (!noteId) return
    const { error } = await supabase
      .from("notes")
      .update({ folder_id: newId })
      .eq("id", noteId)
    if (error) console.error(error)
    else setSelectedFolder(newId)
  }

  // ——— 新建文件夹 ——————————————————————————
  const confirmCreateFolder = async () => {
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
    if (!error && data) {
      setFolders([...folders, data])
      setCreatingFolder(false)
      setNewFolderName("")
      setSelectedFolder(data.id)
      // 同步笔记到新 folder
      await handleMoveFolder(data.id)
    }
  }

  // ——— 删除文件夹 ——————————————————————————
  const handleDeleteFolder = async (fid: string) => {
    if (!confirm("真的要删除这个文件夹吗？其中的笔记会被归到 All。")) return
    const { error } = await supabase.from("folders").delete().eq("id", fid)
    if (error) console.error(error)
    else {
      setFolders(folders.filter(f => f.id !== fid))
      // 如果当前笔记在此 folder，则切回 All
      if (selectedFolder === fid) {
        await handleMoveFolder(null)
      }
    }
  }

  // ——— 渲染 —————————————————————————————————————
  // 1) 还在 loading 的时候，显示 Loading
  if (loading) {
    return (
      <div className="h-screen flex flex-col">
        <header className="flex items-center gap-2 px-4 py-3 border-b bg-white">
          <button onClick={() => router.back()} className="p-1 rounded hover:bg-gray-100">
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
        </header>
        <div className="flex-1 flex items-center justify-center text-gray-500">
          Loading...
        </div>
      </div>
    )
  }

  // 2) 加载完了但没有 noteId，就回到列表
  if (!noteId) {
    router.replace("/explore")
    return null
  }


  return (
    <div className="h-screen flex flex-col">
      {/* —— 顶部 Bar —— */}
<header className="flex items-center justify-between px-3 py-2 border-b bg-white">
       {/* ← 返回列表 */}
        <button
          onClick={() => router.replace("/explore")}
          className="p-1 rounded hover:bg-gray-100"
        >
          <ArrowLeft className="w-6 h-6 text-gray-700" />
        </button>

        {/* 标题 */}
        <h1 className="text-lg font-semibold truncate">{title || "Untitled"}</h1>

        {/* 抽屉按钮（可选：打开文件夹面板） */}
        <button
          onClick={() => setDrawerOpen(o => !o)}
          className="p-1 rounded hover:bg-gray-100"
        >
          <Menu className="w-6 h-6 text-gray-700" />
       </button>
     </header>






      <div className="flex-1 flex overflow-hidden">
        {/* —— 左侧抽屉：文件夹管理 —— */}
        {drawerOpen && (
          <aside className="w-64 bg-white border-r overflow-y-auto p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-medium">Folders</h2>
              {creatingFolder ? (
                <div className="flex items-center space-x-1">
                  <input
                    ref={inputRef}
                    value={newFolderName}
                    onChange={e => setNewFolderName(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && confirmCreateFolder()}
                    className="border px-2 py-1 rounded text-sm flex-1"
                    placeholder="New folder..."
                  />
                  <button onClick={confirmCreateFolder} className="text-green-600">
                    ✔️
                  </button>
                  <button onClick={() => setCreatingFolder(false)} className="text-red-600">
                    ✖️
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setCreatingFolder(true)
                    setTimeout(() => inputRef.current?.focus(), 50)
                  }}
                  className="p-1 rounded hover:bg-gray-100"
                >
                  <Plus className="w-5 h-5 text-gray-600" />
                </button>
              )}
            </div>
            <ul className="space-y-2">
              <li>
                <button
                  onClick={() => handleMoveFolder(null)}
                  className={`w-full text-left px-3 py-2 rounded ${selectedFolder === null ? "bg-indigo-600 text-white" : "hover:bg-gray-100"}`}
                >
                  All
                </button>
              </li>
              {folders.map(f => (
                <li key={f.id} className="flex items-center justify-between">
                  <button
                    onClick={() => handleMoveFolder(f.id)}
                    className={`flex-1 text-left px-3 py-2 rounded ${selectedFolder === f.id ? "bg-indigo-600 text-white" : "hover:bg-gray-100"}`}
                  >
                    {f.name}
                  </button>
                  <button onClick={() => handleDeleteFolder(f.id)} className="p-1 text-red-500 hover:bg-red-50 rounded">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </li>
              ))}
            </ul>
          </aside>
        )}

        {/* —— 右侧编辑区 —— */}
        <main className="flex-1 overflow-y-auto p-4 bg-gray-50">
          <NoteDetailEditor
            id={Array.isArray(noteId) ? noteId[0] : noteId}
            folders={folders}
            selectedFolder={selectedFolder}
            onMoveFolder={handleMoveFolder}
            onUpdate={({ title: newTitle }) => setTitle(newTitle)}
            onDelete={handleDelete}
          />
        </main>
      </div>
    </div>
  )
}
