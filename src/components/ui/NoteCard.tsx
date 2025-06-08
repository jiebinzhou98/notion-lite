import Link from "next/link"

export type NoteSummary = {
  id: string
  title: string
  created_at: string
  excerpt?: string
}

export default function NoteCard({ note }: { note: NoteSummary }) {
  return (
    <Link href={`/notes/${note.id}`}>
      <div className="rounded-xl border bg-card text-card-foreground shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer p-4">
        <h2 className="text-lg font-semibold truncate mb-1">{note.title}</h2>
        {note.excerpt && (
            <p className="text-sm text-muted-foreground line-clamp-2">
                {note.excerpt}
            </p>
        )}
        <div className="mt-2 text-xs text-muted-foreground text-right">
            {new Date(note.created_at).toLocaleDateString()}
        </div>
      </div>
    </Link>
  )
}
