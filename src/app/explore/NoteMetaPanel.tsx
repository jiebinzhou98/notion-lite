'use client'

import { NoteSummary } from "@/types/note"

type Folder = {
  id: string
  name: string
}

type NoteSummaryWithFolder = NoteSummary & {
  folder_id: string | null
}

type Props = {
  note: NoteSummaryWithFolder | null
  folders: Folder[]
}

function PropertyBlock({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-2 border-b border-zinc-200/80 pb-4 last:border-b-0 last:pb-0">
      <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-zinc-400">
        {label}
      </p>
      <div className="text-sm text-zinc-700">{children}</div>
    </div>
  )
}

export default function NoteMetaPanel({ note, folders }: Props) {
  const folderName =
    folders.find((folder) => folder.id === note?.folder_id)?.name || 'No Folder'

  return (
    <aside className="hidden w-[280px] shrink-0 border-l border-zinc-200 bg-[#f6f6f4] xl:block">
      <div className="h-full px-5 py-6">
        <div className="sticky top-0">
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.22em] text-zinc-400">
            Properties
          </h3>

          {!note ? (
            <div className="mt-6 rounded-xl border border-zinc-200 bg-white/70 px-4 py-5">
              <p className="text-sm text-zinc-500">No note selected</p>
            </div>
          ) : (
            <div className="mt-6 space-y-5">
              <PropertyBlock label="Title">
                <p className="line-clamp-2 font-medium text-zinc-900">
                  {note.title || 'Untitled'}
                </p>
              </PropertyBlock>

              <PropertyBlock label="Created">
                <p>
                  {new Date(note.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </p>
              </PropertyBlock>

              <PropertyBlock label="Folder">
                <p>{folderName}</p>
              </PropertyBlock>

              <PropertyBlock label="Pinned">
                <span
                  className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                    note.is_pinned
                      ? 'bg-zinc-900 text-white'
                      : 'bg-zinc-200 text-zinc-600'
                  }`}
                >
                  {note.is_pinned ? 'Pinned' : 'Not pinned'}
                </span>
              </PropertyBlock>

              <PropertyBlock label="Summary">
                <div className="rounded-xl bg-white/80 px-3 py-3 text-sm leading-6 text-zinc-500">
                  {note.excerpt || 'No preview available.'}
                </div>
              </PropertyBlock>
            </div>
          )}
        </div>
      </div>
    </aside>
  )
}