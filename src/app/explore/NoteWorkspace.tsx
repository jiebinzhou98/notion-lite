'use client'

import NoteDetailEditor from '@/components/ui/NoteDetailEditor'

type Props = {
  selectedNoteId: string | null
  onUpdate: (payload: { title: string; excerpt: string }) => void
  onDelete: (id: string) => void
}

export default function NoteWorkspace({
  selectedNoteId,
  onUpdate,
  onDelete,
}: Props) {
  return (
    <main className="flex-1 overflow-y-auto bg-[#f7f7f5]">
      <div className="mx-auto min-h-full w-full max-w-5xl px-10 py-12 xl:px-16">
        {selectedNoteId ? (
          <NoteDetailEditor
            id={selectedNoteId}
            onUpdate={onUpdate}
            onDelete={onDelete}
          />
        ) : (
          <div className="flex min-h-[70vh] items-center justify-center">
            <div className="rounded-2xl border border-zinc-200 bg-white/60 px-8 py-8 text-center">
              <p className="text-sm uppercase tracking-[0.18em] text-zinc-400">
                No note selected
              </p>
              <p className="mt-3 text-zinc-500">
                Choose a note from the left panel or create a new one.
              </p>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}