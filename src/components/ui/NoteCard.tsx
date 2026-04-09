'use client'

import { supabase } from "@/lib/supabase"
import { PinIcon } from "lucide-react"
import { useRouter } from "next/navigation"

export type NoteSummary = {
  id: string
  title: string
  created_at: string
  excerpt?: string
  is_pinned?: boolean
}

export default function NoteCard({
  note,
  onTogglePin,
  isActive = false,
  onSelect,
}: {
  note: NoteSummary
  onTogglePin?: () => void
  isActive?: boolean
  onSelect?: (id: string) => void
}) {
  const router = useRouter()

  const handleClick = () => {
    if (window.innerWidth < 768) {
      router.push(`/explore/${note.id}`)
    } else {
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
      className={`group relative cursor-pointer rounded-2xl border p-4 transition-all duration-200
        ${
          isActive
            ? "border-zinc-300 bg-zinc-100 shadow-none ring-1 ring-zinc-200"
            : "border-zinc-200 bg-white shadow-sm hover:border-zinc-300 hover:bg-zinc-50 hover:shadow-sm"
        }`}
    >
      <button
        onClick={togglePin}
        className="absolute right-3 top-3 rounded-md p-1 text-zinc-400 transition hover:bg-zinc-200/60 hover:text-zinc-700"
        aria-label={note.is_pinned ? "Unpin note" : "Pin note"}
      >
        <PinIcon
          className={`h-4 w-4 ${
            note.is_pinned
              ? "fill-red-500 text-red-500"
              : "fill-transparent text-zinc-400"
          }`}
        />
      </button>

      <div className="pr-8">
        <h2 className="truncate text-lg font-semibold text-zinc-900">
          {note.title || "Untitled"}
        </h2>

        <div className="mt-2 min-h-[40px]">
          {note.excerpt ? (
            <p className="line-clamp-2 text-sm leading-6 text-zinc-500">
              {note.excerpt}
            </p>
          ) : (
            <p className="text-sm text-zinc-300">No preview</p>
          )}
        </div>

        <div className="mt-4 text-right text-xs text-zinc-400">
          {new Date(note.created_at).toLocaleDateString()}
        </div>
      </div>
    </div>
  )
}