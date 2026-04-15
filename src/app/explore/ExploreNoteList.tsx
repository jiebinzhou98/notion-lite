'use client'

import NoteCard from '@/components/ui/NoteCard'
import { NoteSummaryWithFolder } from '@/types/note'

type Props = {
  notes: NoteSummaryWithFolder[]
  selectedNoteId: string | null
  onSelectNote: (id: string) => void
  onNoteContextMenu: (e: React.MouseEvent, noteId: string) => void
  onTogglePin: (noteId: string) => void
}

export default function ExploreNoteList({
  notes,
  selectedNoteId,
  onSelectNote,
  onNoteContextMenu,
  onTogglePin,
}: Props) {
  return (
    <aside className="w-[272px] shrink-0 overflow-y-auto overscroll-contain border-r border-zinc-200 bg-zinc-50">
      <div className="min-h-full px-3 py-4">
        {notes.length === 0 ? (
          <div className="rounded-2xl border border-zinc-200 bg-white/60 px-4 py-6">
            <p className="text-xs uppercase tracking-[0.18em] text-zinc-400">
              No matching notes
            </p>
            <p className="mt-3 text-sm leading-6 text-zinc-500">
              Try a different search or switch folders to find your notes.
            </p>
          </div>
        ) : (
          notes.map((note) => (
            <div
              key={note.id}
              className="mb-3"
              onContextMenu={(e) => onNoteContextMenu(e, note.id)}
            >
              <NoteCard
                note={note}
                isActive={note.id === selectedNoteId}
                onSelect={onSelectNote}
                onTogglePin={() => onTogglePin(note.id)}
              />
            </div>
          ))
        )}
      </div>
    </aside>
  )
}