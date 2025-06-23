// src/app/explore/[noteId]/page.tsx  （或你放 MobileNotePage 的路径）
'use client'

import NoteDetailEditor from "@/components/ui/NoteDetailEditor"
import { useRouter, useParams } from "next/navigation"
import { useEffect, useState, useRef } from "react"
import { supabase } from "@/lib/supabase"
import { ArrowLeft } from "lucide-react"

export default function MobileNotePage() {
  const router = useRouter()
  const { noteId } = useParams() ?? {}

  // --------- 状态 ----------
  const [title, setTitle] = useState<string>("")
  const [folders, setFolders] = useState<{ id: string; name: string }[]>([])
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  // --------- 1. 桌面切换保护 ----------
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

  // --------- 2. 拉取文件夹列表 ----------
  useEffect(() => {
    supabase
      .from("folders")
      .select("id, name")
      .order("created_at", { ascending: true })
      .then(({ data, error }) => {
        if (error) console.error("Fetch folders error:", error)
        else setFolders(data || [])
      })
  }, [])

  // --------- 3. 拉取当前笔记标题 + 所属文件夹 ----------
  useEffect(() => {
    if (!noteId) return
    supabase
      .from("notes")
      .select("title, folder_id")
      .eq("id", noteId)
      .single()
      .then(({ data, error }) => {
        if (error) {
          console.error("Fetch note error:", error)
        } else if (data) {
          setTitle(data.title)
          setSelectedFolder(data.folder_id)
        }
        setLoading(false)
      })
  }, [noteId])

  // --------- 删除笔记 ----------
  const handleDelete = async (id: string) => {
    await supabase.from("notes").delete().eq("id", id)
    router.replace("/explore")
  }

  // --------- 移动笔记到新文件夹 ----------
  const handleMoveFolder = async (newId: string | null) => {
    if (!noteId) return
    const { error } = await supabase
      .from("notes")
      .update({ folder_id: newId })
      .eq("id", noteId)
    if (error) {
      console.error("Move folder failed", error)
      return
    }
    setSelectedFolder(newId)
  }

  // --------- 渲染 ----------
  if (loading || !noteId) {
    return (
      <div className="h-screen flex flex-col">
        <header className="flex items-center gap-2 px-4 py-3 border-b bg-white">
          <button
            onClick={() => router.back()}
            className="p-1 rounded hover:bg-gray-100 transition"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
        </header>
        <div className="flex-1 flex items-center justify-center text-gray-500">
          Loading...
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col">
      <header className="flex items-center justify-between px-3 py-2 border-b bg-white">
        <button
          onClick={() => router.replace("/explore")}
          className="p-1 rounded hover:bg-gray-100 transition"
        >
          <ArrowLeft className="w-5 h-5 text-gray-700" />
        </button>
        <h1 className="text-lg font-semibold truncate">{title || "Untitled"}</h1>
        <div className="w-6" /> {/* 占位，保持左右对齐 */}
      </header>
      <div className="flex-1 overflow-y-auto pt-4">
        <NoteDetailEditor
          id={Array.isArray(noteId) ? noteId[0] : noteId}
          folders={folders}
          selectedFolder={selectedFolder}
          onMoveFolder={handleMoveFolder}
          onUpdate={({ title: newTitle }) => {
            setTitle(newTitle)
          }}
          onDelete={handleDelete}
        />
      </div>
    </div>
  )
}
