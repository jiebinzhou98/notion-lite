import Link from "next/link"

type Note = {
  id: string
  title: string
  created_at: string
}

export default function NoteCard({ note }: { note: Note }) {
  return (
    <Link href={`/notes/${note.id}`}>
      <div className="border rounded-xl p-4 bg-white shadow-sm hover:shadow-md transition-all duration-200 hover:scale-[1.01]">
        <h2 className="text-lg font-semibold truncate">{note.title}</h2>
        <p className="text-xs text-gray-500 mt-1">
          {new Date(note.created_at).toLocaleDateString()}
        </p>
      </div>
    </Link>
  )
}
