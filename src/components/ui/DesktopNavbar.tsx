'use client'

import { useState, useRef, useEffect } from "react"
import { Plus, Menu, Search, Trash2 } from "lucide-react"
import AuthButton from "@/components/AuthButton"

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
}:DesktopNavbarProps) {
    const inputRef = useRef<HTMLInputElement>(null)
    const [folderMenuOpen, setFolderMenuOpen] = useState(false)
    const [creatingFolder, setCreatingFolder] = useState(false)
    const [newFolderName, setNewFolderName] = useState("")

    // 确认新建文件夹
    function confirmCreateFolder() {
      const name = newFolderName.trim()
      if (!name) return setCreatingFolder(false)
      onCreateFolder(name)
      setNewFolderName("")
      setCreatingFolder(false)
      setFolderMenuOpen(false)
    }

    // 点击外部关闭菜单（简单示意）
    useEffect(() => {
      function onClickOutside(e: MouseEvent) {
        if (!(e.target as HTMLElement).closest("#folder-menu")) {
          setFolderMenuOpen(false)
          setCreatingFolder(false)
          setNewFolderName("")
        }
      }
      if (folderMenuOpen) {
        document.addEventListener("click", onClickOutside)
      }
      return () => document.removeEventListener("click", onClickOutside)
    }, [folderMenuOpen])

    return (
        <nav className="fixed top-0 left-0 right-0 h-14 flex items-center px-6 py-3 border-b bg-white shadow-sm z-50 select-none">
          {/* folder 菜单按钮 */}
          <button
            onClick={() => setFolderMenuOpen(open => !open)}
            aria-label="Toggle folders"
            className="p-2 rounded hover:bg-gray-100 relative"
          >
            <Menu className="w-6 h-6 text-gray-700" />
            {folderMenuOpen && (
              <div
                id="folder-menu"
                className="absolute top-full mt-1 left-0 w-56 bg-white border rounded shadow-lg z-50"
              >
                {/* 文件夹列表 */}
                <div className="max-h-72 overflow-y-auto">
                  <button
                    onClick={() => { onSelectFolder(null); setFolderMenuOpen(false) }}
                    className={`block w-full text-left px-3 py-2 rounded ${selectedFolder === null ? "bg-indigo-100" : "hover:bg-gray-100"}`}
                  >
                    All
                  </button>
                  {folders.map(folder => (
                    <div key={folder.id} className="flex items-center justify-between">
                      <button
                        onClick={() => { onSelectFolder(folder.id); setFolderMenuOpen(false) }}
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
                </div>

                {/* 新建文件夹 */}
                <div className="border-t p-2">
                  {creatingFolder ? (
                    <div className="flex space-x-2">
                      <input
                        ref={inputRef}
                        autoFocus
                        value={newFolderName}
                        onChange={e => setNewFolderName(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && confirmCreateFolder()}
                        placeholder="New folder..."
                        className="flex-1 border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                      />
                      <button onClick={confirmCreateFolder} className="text-green-600 font-bold px-2">✔</button>
                      <button onClick={() => { setCreatingFolder(false); setNewFolderName("") }} className="text-gray-600 font-bold px-2">✖</button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setCreatingFolder(true)}
                      className="w-full text-indigo-600 text-left text-sm hover:underline"
                    >
                      + New Folder
                    </button>
                  )}
                </div>
              </div>
            )}
          </button>

          {/* 标题 */}
          <h1 className="ml-4 text-xl font-semibold truncate max-w-xs">{title || 'My Notes'}</h1>

          {/* 新建笔记 */}
          <button
            onClick={onCreateNote}
            aria-label="Create new note"
            className="ml-4 p-2 rounded bg-indigo-600 hover:bg-indigo-500 text-white shadow-md flex items-center"
          >
            <Plus className="w-5 h-5"/>
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
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"/>
          </div>

          {/* 登录按钮 */}
          <div className="ml-6">
            <AuthButton />
          </div>
        </nav>
    )
}
