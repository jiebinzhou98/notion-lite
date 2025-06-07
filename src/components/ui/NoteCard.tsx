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
      <div className="border rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer">
        <h2 className="text-lg font-semibold truncate">{note.title}</h2>
        {note.excerpt && (
            <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                {note.excerpt}
            </p>
        )}
        <div className="mt-3 flex justify-end text-xs text-gray-500">
            {new Date(note.created_at).toLocaleDateString()}
        </div>
      </div>
    </Link>
  )
}
