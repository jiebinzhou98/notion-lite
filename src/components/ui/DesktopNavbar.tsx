'use client'

import { useState, useRef, useEffect } from 'react'
import { Search, Trash2, FolderPlus, CirclePlus, Plus } from 'lucide-react'

interface Folder {
  id: string
  name: string
}

interface DesktopNavbarProps {
  onCreateNote: () => void
  onSearch: (query: string) => void
  searchValue: string
  setSearchValue: (val: string) => void
  title: string
  folders: Folder[]
  selectedFolder: string | null
  onSelectFolder: (id: string | null) => void
  onDeleteFolder: (id: string) => void
  onCreateFolder: (name: string) => void
}

export default function DesktopNavbar({
  onCreateNote,
  onSearch,
  searchValue,
  setSearchValue,
  title,
  folders,
  selectedFolder,
  onSelectFolder,
  onDeleteFolder,
  onCreateFolder,
}: DesktopNavbarProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [folderMenuOpen, setFolderMenuOpen] = useState(false)
  const [creatingFolder, setCreatingFolder] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')

  function confirmCreateFolder() {
    const name = newFolderName.trim()

    if (!name) {
      setCreatingFolder(false)
      setNewFolderName('')
      return
    }

    onCreateFolder(name)
    setNewFolderName('')
    setCreatingFolder(false)
    setFolderMenuOpen(true)
  }

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      const target = e.target as HTMLElement

      if (
        !target.closest('#folder-menu') &&
        !target.closest('#folder-input-wrapper') &&
        !target.closest('#folder-trigger')
      ) {
        setFolderMenuOpen(false)
        setCreatingFolder(false)
        setNewFolderName('')
      }
    }

    if (folderMenuOpen || creatingFolder) {
      document.addEventListener('click', onClickOutside)
    }

    return () => document.removeEventListener('click', onClickOutside)
  }, [folderMenuOpen, creatingFolder])

  useEffect(() => {
    if (creatingFolder) {
      setFolderMenuOpen(true)
      setTimeout(() => inputRef.current?.focus(), 80)
    }
  }, [creatingFolder])

  return (
    <nav className="fixed left-0 right-0 top-0 z-50 flex h-14 items-center border-b border-zinc-200 bg-[#fcfcfb]/95 px-6 backdrop-blur">
      <div className="relative flex items-center gap-3">
        <button
          id="folder-trigger"
          onClick={() => setFolderMenuOpen((open) => !open)}
          aria-label="Toggle folders"
          className="rounded-md p-2 text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900"
        >
          <FolderPlus className="h-5 w-5" />
        </button>

        <h1 className="max-w-xs truncate text-base font-semibold tracking-tight text-zinc-900 md:text-lg">
          {title || 'My Notes'}
        </h1>

        {folderMenuOpen && (
          <>
            <div
              id="folder-menu"
              className="absolute left-0 top-full mt-2 w-64 rounded-xl border border-zinc-200 bg-white p-2 shadow-lg"
            >
              <div className="max-h-72 overflow-y-auto">
                <button
                  onClick={() => onSelectFolder(null)}
                  className={`mb-1 block w-full rounded-lg px-3 py-2 text-left text-sm transition ${
                    selectedFolder === null
                      ? 'bg-zinc-100 font-medium text-zinc-900'
                      : 'text-zinc-600 hover:bg-zinc-50'
                  }`}
                >
                  All notes
                </button>

                {folders.map((folder) => (
                  <div
                    key={folder.id}
                    className="mb-1 flex items-center justify-between gap-2 rounded-lg"
                  >
                    <button
                      onClick={() => onSelectFolder(folder.id)}
                      className={`flex-1 rounded-lg px-3 py-2 text-left text-sm transition ${
                        selectedFolder === folder.id
                          ? 'bg-zinc-100 font-medium text-zinc-900'
                          : 'text-zinc-600 hover:bg-zinc-50'
                      }`}
                    >
                      {folder.name}
                    </button>

                    <button
                      onClick={() => onDeleteFolder(folder.id)}
                      className="rounded-md p-2 text-zinc-400 transition hover:bg-red-50 hover:text-red-500"
                      title="Delete folder"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}

                {!creatingFolder && (
                  <button
                    onClick={() => setCreatingFolder(true)}
                    className="mt-2 flex w-full items-center gap-2 rounded-lg border-t border-zinc-200 px-3 py-3 text-left text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
                  >
                    <Plus className="h-4 w-4" />
                    New folder
                  </button>
                )}
              </div>
            </div>

            {creatingFolder && (
              <div
                id="folder-input-wrapper"
                className="absolute left-0 top-full mt-2 w-72 rounded-xl border border-zinc-200 bg-white p-4 shadow-lg"
                style={{ marginLeft: '44px' }}
              >
                <label
                  htmlFor="new-folder-input"
                  className="mb-2 block text-xs font-medium uppercase tracking-[0.18em] text-zinc-400"
                >
                  New Folder
                </label>

                <input
                  id="new-folder-input"
                  ref={inputRef}
                  autoFocus
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && confirmCreateFolder()}
                  placeholder="Enter folder name"
                  className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700 outline-none transition focus:border-zinc-300 focus:ring-2 focus:ring-zinc-200"
                />

                <div className="mt-4 flex justify-end gap-2">
                  <button
                    onClick={() => {
                      setCreatingFolder(false)
                      setNewFolderName('')
                    }}
                    className="rounded-lg px-3 py-2 text-sm text-zinc-600 transition hover:bg-zinc-100"
                  >
                    Cancel
                  </button>

                  <button
                    onClick={confirmCreateFolder}
                    className="rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-zinc-800"
                  >
                    Create
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <div className="ml-auto flex min-w-[320px] items-center gap-3">
        <button
          onClick={onCreateNote}
          aria-label="Create new note"
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-900"
        >
          <CirclePlus className="h-4 w-4" />
        </button>

        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search notes..."
            value={searchValue}
            onChange={(e) => {
              setSearchValue(e.target.value)
              onSearch(e.target.value)
            }}
            className="w-full rounded-lg border border-zinc-200 bg-white py-2 pl-9 pr-3 text-sm text-zinc-700 outline-none transition placeholder:text-zinc-400 focus:border-zinc-300 focus:ring-2 focus:ring-zinc-200"
          />
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
        </div>
      </div>
    </nav>
  )
}