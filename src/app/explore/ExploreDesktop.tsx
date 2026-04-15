'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { NoteSummaryWithFolder } from '@/types/note'
import { useRouter, useSearchParams } from 'next/navigation'
import DesktopNavbar from '@/components/ui/DesktopNavbar'
import ExploreNoteList from './ExploreNoteList'
import NoteWorkspace from './NoteWorkspace'

type Folder = {
  id: string
  name: string
}

function sortNotesByPinnedAndDate(notes: NoteSummaryWithFolder[]) {
  return [...notes].sort((a, b) =>
    a.is_pinned === b.is_pinned
      ? new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      : b.is_pinned
        ? 1
        : -1
  )
}

export default function ExploreDesktop() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const selectedFromUrl = searchParams.get('selected')

  const [notes, setNotes] = useState<NoteSummaryWithFolder[]>([])
  const [folders, setFolders] = useState<Folder[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null)
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null)

  const [contextMenuVisible, setContextMenuVisible] = useState(false)
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 })
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
        searchParams.get('selected')
      ) {
        router.replace(`/explore/${selectedNoteId}`)
      }
    }

    onResize()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [selectedNoteId, router, searchParams])

  useEffect(() => {
    async function fetchFolders() {
      const { data, error } = await supabase
        .from('folders')
        .select('id, name')
        .order('created_at', { ascending: true })

      if (error) {
        console.error(error)
        return
      }

      const folderList = data || []
      setFolders(folderList)

      if (folderList.length > 0) {
        setSelectedFolder((prev) => prev ?? folderList[0].id)
      }
    }

    fetchFolders()
  }, [])

  useEffect(() => {
    async function fetchNotes() {
      const { data, error } = await supabase
        .from('notes')
        .select('id, title, created_at, content, is_pinned, folder_id')
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false })

      if (error) {
        console.error(error)
        setLoading(false)
        return
      }

      if (data) {
        const list: NoteSummaryWithFolder[] = data.map((item) => {
          let excerpt = ''

          try {
            const para = item.content?.content?.find(
              (b: any) => b.type === 'paragraph'
            )
            excerpt = para?.content?.[0]?.text || ''
          } catch {
            excerpt = ''
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

        if (selectedFromUrl) {
          setSelectedNoteId(selectedFromUrl)
        } else if (list.length > 0) {
          setSelectedNoteId(list[0].id)
        }
      }

      setLoading(false)
    }

    fetchNotes()
  }, [selectedFromUrl])

  const filteredNotes = notes
    .filter((note) => selectedFolder === null || note.folder_id === selectedFolder)
    .filter((note) => {
      const q = searchTerm.toLowerCase().trim()

      if (!q) return true

      return (
        note.title.toLowerCase().includes(q) ||
        note.excerpt?.toLowerCase().includes(q)
      )
    })

  const handleCreateNote = async () => {
    const { data, error } = await supabase
      .from('notes')
      .insert({
        title: '',
        content: { type: 'doc', content: [{ type: 'paragraph' }] },
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
      excerpt: '',
      is_pinned: data.is_pinned,
      folder_id: data.folder_id,
    }

    setNotes((prev) => sortNotesByPinnedAndDate([newNote, ...prev]))
    setSelectedNoteId(data.id)
    router.replace(`/explore?selected=${data.id}`)
  }

  const handleDelete = async (noteId: string) => {
    if (!confirm('Delete this note?')) return

    const { error } = await supabase.from('notes').delete().eq('id', noteId)

    if (error) {
      console.error(error)
      return
    }

    setNotes((prev) => prev.filter((note) => note.id !== noteId))

    if (noteId === selectedNoteId) {
      const next = filteredNotes.find((note) => note.id !== noteId)
      setSelectedNoteId(next?.id || null)
    }
  }

  const confirmCreateFolder = async (name: string) => {
    const trimmedName = name.trim()
    if (!trimmedName) return

    const { data, error } = await supabase
      .from('folders')
      .insert({ name: trimmedName })
      .select()
      .single()

    if (error || !data) {
      console.error(error)
      return
    }

    setFolders((prev) => [...prev, data])
    setSelectedFolder(data.id)
  }

  const handleDeleteFolder = async (folderId: string) => {
    if (!confirm('Delete this folder and all its notes?')) return

    await supabase
      .from('notes')
      .update({ folder_id: null })
      .eq('folder_id', folderId)

    const { error } = await supabase.from('folders').delete().eq('id', folderId)

    if (error) {
      console.error(error)
      return
    }

    setFolders((prev) => prev.filter((folder) => folder.id !== folderId))

    if (selectedFolder === folderId) {
      setSelectedFolder(null)
    }
  }

  const handleNoteContextMenu = (e: React.MouseEvent, noteId: string) => {
    e.preventDefault()
    setContextNoteId(noteId)
    setContextMenuPosition({ x: e.clientX, y: e.clientY })
    setContextMenuVisible(true)
  }

  const moveNoteToFolder = async (folderId: string | null) => {
    if (!contextNoteId) return

    const { error } = await supabase
      .from('notes')
      .update({ folder_id: folderId })
      .eq('id', contextNoteId)

    if (error) {
      console.error('Failed to move note', error)
      alert('Failed to move note')
      return
    }

    setNotes((prev) =>
      prev.map((note) =>
        note.id === contextNoteId ? { ...note, folder_id: folderId } : note
      )
    )

    if (contextNoteId === selectedNoteId) {
      setSelectedFolder(folderId)
    }

    setContextMenuVisible(false)
  }

  useEffect(() => {
    const handleClickOutside = () => {
      if (contextMenuVisible) {
        setContextMenuVisible(false)
      }
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
      <div className="h-screen space-y-3 bg-zinc-50 p-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="animate-pulse rounded-xl border border-zinc-200 bg-white p-4 shadow-sm"
          >
            <div className="mb-2 h-5 w-1/2 rounded bg-zinc-200" />
            <div className="mb-2 h-4 w-3/4 rounded bg-zinc-100" />
            <div className="h-3 w-1/3 rounded bg-zinc-100" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="flex h-screen flex-col">
      <DesktopNavbar
        folders={folders}
        selectedFolder={selectedFolder}
        onSelectFolder={setSelectedFolder}
        onDeleteFolder={handleDeleteFolder}
        onCreateFolder={confirmCreateFolder}
        onCreateNote={handleCreateNote}
        onSearch={setSearchTerm}
        searchValue={searchTerm}
        setSearchValue={setSearchTerm}
        title="Editor"
      />

      <div className="mt-14 flex flex-1 overflow-hidden bg-zinc-50">
        <ExploreNoteList
          notes={filteredNotes}
          selectedNoteId={selectedNoteId}
          onSelectNote={setSelectedNoteId}
          onNoteContextMenu={handleNoteContextMenu}
          onTogglePin={(noteId) => {
            setNotes((prev) =>
              sortNotesByPinnedAndDate(
                prev.map((note) =>
                  note.id === noteId
                    ? { ...note, is_pinned: !note.is_pinned }
                    : note
                )
              )
            )
          }}
        />

        <NoteWorkspace
          selectedNoteId={selectedNoteId}
          onUpdate={({ title, excerpt }) =>
            setNotes((prev) =>
              prev.map((note) =>
                note.id === selectedNoteId ? { ...note, title, excerpt } : note
              )
            )
          }
          onDelete={handleDelete}
        />
      </div>

      {contextMenuVisible && (
        <ul
          className="absolute w-[200px] rounded-xl border border-zinc-200 bg-white p-1 shadow-lg"
          style={{
            top: contextMenuPosition.y,
            left: contextMenuPosition.x,
            zIndex: 10000,
          }}
          onContextMenu={(e) => e.preventDefault()}
        >
          <li
            className="cursor-pointer rounded-md px-3 py-2 text-sm text-zinc-700 transition hover:bg-zinc-100"
            onClick={() => moveNoteToFolder(null)}
          >
            No Folder
          </li>

          {folders.map((folder) => (
            <li
              key={folder.id}
              className="cursor-pointer rounded-md px-3 py-2 text-sm text-zinc-700 transition hover:bg-zinc-100"
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