// src/app/explore/MobileList.tsx
'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import NoteCard, { NoteSummary } from '@/components/ui/NoteCard'
import { supabase } from '@/lib/supabase'
import { Menu, Plus, Trash2 } from 'lucide-react'

export default function MobileList() {
  const router = useRouter()

  // 文件夹状态
  const [folders, setFolders] = useState<{ id: string; name: string }[]>([])
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null)
  const [showFolderMenu, setShowFolderMenu] = useState(false)
  const [creatingFolder, setCreatingFolder] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  // 笔记列表状态
  const [notes, setNotes] = useState<NoteSummary[]>([])
  const [loading, setLoading] = useState(true)

  // 拉取文件夹
  useEffect(() => {
    supabase
      .from('folders')
      .select('id, name')
      .order('created_at', { ascending: true })
      .then(({ data, error }) => {
        if (error) console.error(error)
        else {
          setFolders(data || [])
          if (!selectedFolder) {
            setSelectedFolder(data?.[0]?.id ?? null)
          }
        }
      })
  }, [])

  // 拉取笔记
  useEffect(() => {
    setLoading(true)
    supabase
      .from('notes')
      .select('id,title,content,created_at,is_pinned,folder_id')
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) console.error(error)
        else if (data) {
          const list = data
            .filter((n) => selectedFolder === null || n.folder_id === selectedFolder)
            .map((item) => {
              let excerpt = ''
              try {
                excerpt = item.content.content?.[0]?.content?.[0]?.text || ''
              } catch {}
              return {
                id: item.id,
                title: item.title,
                excerpt,
                is_pinned: item.is_pinned,
                created_at: item.created_at,
              }
            })
          setNotes(list)
        }
        setLoading(false)
      })
  }, [selectedFolder])

  // 新建文件夹
  const confirmCreateFolder = async () => {
    const name = newFolderName.trim()
    if (!name) return setCreatingFolder(false)
    const { data, error } = await supabase
      .from('folders')
      .insert({ name })
      .select()
      .single()
    if (!error && data) {
      setFolders((f) => [...f, data])
      setSelectedFolder(data.id)
      setNewFolderName('')
    }
    setCreatingFolder(false)
  }

  // 删除当前文件夹
  const handleDeleteFolder = async (id: string) => {
    if (!confirm('删除此文件夹？其中笔记将归到 All')) return
    await supabase.from('notes').update({ folder_id: null }).eq('folder_id', id)
    await supabase.from('folders').delete().eq('id', id)
    setFolders((f) => f.filter((x) => x.id !== id))
    setSelectedFolder(null) // 跳回 All
    setShowFolderMenu(false)
  }

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        Loading…
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* 顶栏：返回 + 文件夹下拉 */}
      <header className="flex items-center justify-between px-4 py-3 bg-white border-b">
        <button
          onClick={() => router.push('/explore')}
          className="p-1 rounded hover:bg-gray-100"
        >
          ←
        </button>
        <div className="relative">
          <button
            onClick={() => setShowFolderMenu((v) => !v)}
            className="p-2 border rounded hover:bg-gray-100"
            aria-label='Choose folder'
          >
            <Menu className="w-5 h-5 text-gray-600" />
          </button>
          {showFolderMenu && (
            <div className="absolute right-0 mt-1 w-48 bg-white border rounded shadow-lg z-10">
              <ul className="divide-y">
                <li>
                  <button
                    onClick={() => {
                      setSelectedFolder(null)
                      setShowFolderMenu(false)
                    }}
                    className={`w-full text-left px-3 py-2 ${selectedFolder === null ? 'bg-indigo-100' : ''}`}
                  >
                    All
                  </button>
                </li>
                {folders.map((f) => (
                  <li key={f.id} className="flex">
                    <button
                      onClick={() => {
                        setSelectedFolder(f.id)
                        setShowFolderMenu(false)
                      }}
                      className={`flex-1 text-left px-3 py-2 ${selectedFolder === f.id ? 'bg-indigo-100' : ''}`}
                    >
                      {f.name}
                    </button>
                    <button
                      onClick={() => handleDeleteFolder(f.id)}
                      className="px-2 py-2 text-red-500 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </li>
                ))}
                <li className='px-3 py-2'>
                    <button
                        onClick={async () => {
                            const name = window.prompt("Enter new folder name:")
                            if(name && name.trim()){
                                try {
                                    const {data, error} = await supabase
                                        .from('folders')
                                        .insert({name: name.trim()})
                                        .select()
                                        .single()
                                    if(error) throw error
                                    setFolders((f) => [...f, data!])
                                    setSelectedFolder(data!.id)
                                    setShowFolderMenu(false)
                                }catch (err){
                                    console.error("Error creating folder:", err)
                                    alert("Failed to create folder. Please try again.")
                                }
                            }
                        }}
                        className='flex item-center space-x-1 text-indigo-600 hover:bg-gray-100 px-2 py-1 rounded'
                    >
                        <Plus className='w-4 h-4'/>
                        <span>New Folder</span>
                    </button>
                </li>
              </ul>
            </div>
          )}
        </div>
      </header>

      {/* 笔记列表 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {notes.length === 0 ? (
          <p className="text-center text-gray-500">No notes</p>
        ) : (
          notes.map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              onSelect={(id) => router.push(`/explore/${id}`)}
            />
          ))
        )}
      </div>
    </div>
  )
}
