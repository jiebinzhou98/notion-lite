'use client'

import { supabase } from '@/lib/supabase'
import { PinIcon } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { NoteSummary } from '@/types/note'

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
      .from('notes')
      .update({ is_pinned: newPinned })
      .eq('id', note.id)

    if (!error) {
      onTogglePin?.()
    } else {
      console.error('Failed to update pin:', error)
    }
  }

  return (
    <div
      onClick={handleClick}
      className={`group relative cursor-pointer rounded-xl px-3 py-3 transition-all duration-150 ${
        isActive
          ? 'bg-white ring-1 ring-zinc-200'
          : 'bg-transparent hover:bg-white/80'
      }`}
    >
      <button
        onClick={togglePin}
        className="absolute right-2 top-2 rounded-md p-1 text-zinc-400 opacity-0 transition hover:bg-zinc-100 hover:text-zinc-700 group-hover:opacity-100"
        aria-label={note.is_pinned ? 'Unpin note' : 'Pin note'}
      >
        <PinIcon
          className={`h-4 w-4 ${
            note.is_pinned
              ? 'fill-zinc-700 text-zinc-700'
              : 'fill-transparent text-zinc-400'
          }`}
        />
      </button>

      <div className="pr-7">
        <div className="flex items-start justify-between gap-3">
          <h2
            className={`truncate text-[15px] leading-6 ${
              isActive ? 'font-semibold text-zinc-900' : 'font-medium text-zinc-800'
            }`}
          >
            {note.title || 'Untitled'}
          </h2>
        </div>

        <div className="mt-1 min-h-[38px]">
          {note.excerpt ? (
            <p className="line-clamp-2 text-sm leading-5 text-zinc-500">
              {note.excerpt}
            </p>
          ) : (
            <p className="text-sm text-zinc-300">No preview</p>
          )}
        </div>

        <div className="mt-3 flex items-center justify-between">
          <span className="text-[11px] uppercase tracking-wide text-zinc-400">
            {note.is_pinned ? 'Pinned' : ''}
          </span>

          <span className="text-[11px] text-zinc-400">
            {new Date(note.created_at).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
            })}
          </span>
        </div>
      </div>
    </div>
  )
}