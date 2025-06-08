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
      <div className="rounded-2xl border bg-card text-card-foreground shadow-sm hover:shadow-md hover:scale-[1.01] transition-all duration-200 cursor-pointer p-4 space-y-2 hover:ring-1 hover:ring-muted">
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
    </Link>
  )
}
