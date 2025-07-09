'use client'

import { useState, useRef, useEffect } from "react"
import { Plus, Menu, Search, Trash2 } from "lucide-react"

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
  const [newFolderName, setNewFolderName] = useState("")

  function confirmCreateFolder() {
    const name = newFolderName.trim()
    if (!name) {
      setCreatingFolder(false)
      setNewFolderName("")
      return
    }
    onCreateFolder(name)
    setNewFolderName("")
    setCreatingFolder(false)
    if (!folderMenuOpen) setFolderMenuOpen(true)
  }

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      const target = e.target as HTMLElement
      if (!target.closest("#folder-menu") && !target.closest("#folder-input-wrapper")) {
        setFolderMenuOpen(false)
        setCreatingFolder(false)
        setNewFolderName("")
      }
    }
    if (folderMenuOpen || creatingFolder) {
      document.addEventListener("click", onClickOutside)
    }
    return () => document.removeEventListener("click", onClickOutside)
  }, [folderMenuOpen, creatingFolder])

  useEffect(() => {
    if (creatingFolder) {
      setFolderMenuOpen(true)
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [creatingFolder])

  return (
    <nav className="fixed top-0 left-0 right-0 h-14 flex items-center px-6 py-3 border-b bg-white shadow-sm z-50 select-none">
      {/* 文件夹菜单按钮 */}
      <button
        onClick={() => setFolderMenuOpen(open => !open)}
        aria-label="Toggle folders"
        className="p-2 rounded hover:bg-gray-100 relative"
      >
        <Menu className="w-6 h-6 text-gray-700" />
      </button>

      {folderMenuOpen && (
        <>
          <div
            id="folder-menu"
            className="absolute top-full mt-1 left-0 w-56 bg-white border rounded shadow-lg z-50"
          >
            <div className="max-h-72 overflow-y-auto">
              <button
                onClick={() => onSelectFolder(null)}
                className={`block w-full text-left px-3 py-2 rounded ${selectedFolder === null ? "bg-indigo-100" : "hover:bg-gray-100"}`}
              >
                All
              </button>
              {folders.map(folder => (
                <div key={folder.id} className="flex items-center justify-between">
                  <button
                    onClick={() => onSelectFolder(folder.id)}
                    className={`flex-1 text-left px-3 py-2 rounded ${selectedFolder === folder.id ? "bg-indigo-100" : "hover:bg-gray-100"}`}
                  >
                    {folder.name}
                  </button>
                  <button
                    onClick={() => onDeleteFolder(folder.id)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded"
                    title="Delete folder"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}

              {/* 新建文件夹按钮 */}
              {!creatingFolder && (
                <button
                  onClick={() => setCreatingFolder(true)}
                  className="block w-full text-left px-3 py-2 font-semibold text-indigo-700 hover:bg-indigo-100 border-t rounded-b"
                  style={{ letterSpacing: '0.05em' }}
                >
                  <Plus className="inline-block w-4 h-4 mr-1 -mt-0.5" />
                  New Folder
                </button>
              )}

            </div>
          </div>
          {/* 新建文件夹输入框（独立显示） */}
          {creatingFolder && (
            <div
              id="folder-input-wrapper"
              className="absolute top-full mt-1 left-0 w-64 bg-white border rounded shadow-lg z-50 p-4"
              style={{ marginLeft: '40px' }}
            >
              <label htmlFor="new-folder-input" className="block mb-1 font-semibold text-gray-700">
                New Folder Name
              </label>
              <input
                id="new-folder-input"
                ref={inputRef}
                autoFocus
                value={newFolderName}
                onChange={e => setNewFolderName(e.target.value)}
                onKeyDown={e => e.key === "Enter" && confirmCreateFolder()}
                placeholder="Enter folder name"
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
              <div className="mt-3 flex justify-end space-x-3">
                <button
                  onClick={confirmCreateFolder}
                  className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition"
                >
                  Create
                </button>
                <button
                  onClick={() => {
                    setCreatingFolder(false)
                    setNewFolderName("")
                  }}
                  className="px-4 py-2 border rounded hover:bg-gray-100 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* 标题 */}
      <h1 className="ml-4 text-xl font-semibold truncate max-w-xs">{title || 'My Notes'}</h1>

      {/* 新建笔记 */}
      <button
        onClick={onCreateNote}
        aria-label="Create new note"
        className="ml-4 p-2 rounded bg-indigo-600 hover:bg-indigo-500 text-white shadow-md flex items-center"
      >
        <Plus className="w-5 h-5" />
      </button>

      {/* 搜索框 */}
      <div className="ml-auto relative max-w-xs w-full">
        <input
          type="text"
          placeholder="Search notes..."
          value={searchValue}
          onChange={e => {
            setSearchValue(e.target.value)
            onSearch(e.target.value)
          }}
          className="w-full pl-9 pr-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />
        <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
      </div>
    </nav>
  )
}
