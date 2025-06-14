'use client'
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { useState } from "react"
import { PinIcon } from "lucide-react"
import { useRouter } from "next/navigation"

export type NoteSummary = {
  id: string
  title: string
  created_at: string
  excerpt?: string
  is_pinned?: boolean
}

export default function NoteCard({ note, onTogglePin, isActive = false, onSelect, }: 
  { note: NoteSummary, onTogglePin?: () => void, isActive?: boolean, onSelect?:(id:string) => void }) 
  {
    const router = useRouter()

    const handleClick = () =>{
      if(window.innerWidth < 768){
        router.push(`/explore/${note.id}`)
      }else{
        onSelect?.(note.id)
      }
    }

  const togglePin = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    const newPinned = !note.is_pinned

    const { error } = await supabase
      .from("notes")
      .update({ is_pinned: newPinned })
      .eq("id", note.id)

    if (!error) {
      onTogglePin?.()
    } else {
      console.error("Failed to update pin:", error)
    }
  }

  return (
      <div
        onClick={handleClick}
        className={`relative rounded-2xl bg-card text-card-foreground shadow-sm
                  hover:shadow-md hover:scale-[1.01] transition-all duration-200
                  cursor-pointer p-4 space-y-2 hover:ring-1 hover:ring-muted
        ${isActive ? "ring-2 ring-primary bg-muted" : ""}
      `}
      >
        {/* 置顶按钮 */}
        <button
          onClick={togglePin}
          className="absolute top-2 right-2 text-xl"
          aria-label={note.is_pinned ? "Unpin note" : "Pin note"}
        >
          {note.is_pinned ? "📌" : "📍"}
        </button>

        <h2 className="text-base md:text-lg font-semibold truncate">
          {note.title || "Untitled"}
        </h2>
        {note.excerpt && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {note.excerpt}
          </p>
        )}
        <div className="text-xs text-muted-foreground text-right pt-1">
          {new Date(note.created_at).toLocaleDateString()}
        </div>
      </div>
  )
}
