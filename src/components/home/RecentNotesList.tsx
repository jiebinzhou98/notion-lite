'use client'

import Link from 'next/link'
import { NoteSummary } from '@/types/note'

type Props = {
  notes: NoteSummary[]
  loading?: boolean
  searchTerm?: string
}

export default function RecentNotesList({ notes, loading, searchTerm = ' ' }: Props) {
if (loading) {
  return (
    <div className="mt-14">
      {[1, 2, 3].map((item, index) => (
        <div
          key={item}
          className={`px-3 py-5 ${
            index !== 2 ? 'border-b border-zinc-200' : ''
          }`}
        >
          <div className="flex items-start justify-between gap-6">
            <div className="min-w-0 flex-1">
              <div className="h-8 w-64 rounded-md bg-zinc-200" />

              <div className="mt-4 space-y-2">
                <div className="h-5 w-full max-w-2xl rounded-md bg-zinc-100" />
                <div className="h-5 w-full max-w-xl rounded-md bg-zinc-100" />
              </div>
            </div>

            <div className="mt-1 h-4 w-14 rounded-md bg-zinc-100" />
          </div>
        </div>
      ))}
    </div>
  )
}

  if (notes.length === 0) {
    return (
      <div className="mt-14 rounded-2xl border border-zinc-200 bg-white/60 px-6 py-8">
        <p className="text-sm uppercase tracking-[0.18em] text-zinc-400">
          No recent notes
        </p>
        <p className="mt-3 text-zinc-500">
          Your latest writing will appear here once you create a note.
        </p>
      </div>
    )
  }

  return (
    <div className="mt-14">
      {notes.map((note, index) => (
        <Link
          key={note.id}
          href={`/explore?selected=${note.id}`}
          className="group block rounded-2xl transition"
        >
          <div
            className={`flex items-start justify-between gap-6 rounded-2xl px-3 py-5 transition hover:bg-white/70 ${
              index !== notes.length - 1 ? 'border-b border-zinc-200' : ''
            }`}
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-3">
                <h3 className="text-2xl font-medium tracking-tight text-zinc-900 transition group-hover:text-zinc-600">
                  {note.title || 'Untitled Note'}
                </h3>

                {note.is_pinned && (
                  <span className="text-[11px] uppercase tracking-[0.18em] text-zinc-400">
                    Pinned
                  </span>
                )}
              </div>

              {note.excerpt ? (
                <p className="mt-4 max-w-3xl text-lg leading-8 text-zinc-500 line-clamp-2">
                  {note.excerpt}
                </p>
              ) : (
                <p className="mt-4 text-base italic text-zinc-300">
                  No preview available
                </p>
              )}
            </div>

            <div className="shrink-0 pt-1 text-[11px] uppercase tracking-[0.18em] text-zinc-400">
              {new Date(note.created_at).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              })}
            </div>
          </div>
        </Link>
      ))}
    </div>
  )
}