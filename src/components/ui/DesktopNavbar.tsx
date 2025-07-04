'use client'

import { useState, useRef } from "react"
import { Plus, Menu, Search } from "lucide-react"
import AuthButton from "@/components/AuthButton"
import { useRouter } from "next/navigation"

interface DesktopNavbarProps {
    onToggleDrawer: () => void
    onCreateNote: () => void
    onSearch: (query: string) => void
    searchValue: string
    setSearchValue: (val: string) => void
    title: string
}

export default function DesktopNavbar({
    onToggleDrawer,
    onCreateNote,
    onSearch,
    searchValue,
    setSearchValue,
    title,
}:DesktopNavbarProps){
    const router = useRouter()
    const inputRef = useRef<HTMLInputElement>(null)

    return (
        <nav className="flex items-center px-6 py-3 border-b bg-white shadow-sm">
            <button
                onClick={onToggleDrawer}
                aria-label="Toggle folders"
                className="p-2 rounded hover:bg-gray-100"
            >
                <menu className="w-6 h-6 text-gray-700"/>
            </button>

            <h1 className="ml-4 text-xl font-semibold truncate max-w-xs">{title || 'My Notes'}</h1>
            <button
                onClick={onCreateNote}
                aria-label="Create new note"
                className="ml-4 p-2 rounded bg-indigo-600 hover:bg-indigo-500 text-white shadow-md flex items-center"
            >
                <Plus className="w-5 h-5"/>
            </button>

            <div className="ml-auto relative max-w-xs w-full">
                <input
                    ref={inputRef}
                    type="text"
                    placeholder="Search notes..."
                    value={searchValue}
                    onChange={(e) => {
                        setSearchValue(e.target.value)
                        onSearch(e.target.value)
                    }}
                    className="w-full pl-9 pr-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indogi-400"
                />
                <search className="absolute left-2 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"/>
            </div>

            <div className="ml-6">
                <AuthButton/>
            </div>
        </nav>
    )
}