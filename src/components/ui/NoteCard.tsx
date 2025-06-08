import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { useState } from "react"
import { PinIcon } from "lucide-react"
import { useRouter } from "next/navigation"

export type NoteSummary = {
  id: string
  title: string
  created_at: string
  excerpt?: string
  is_pinned?: boolean
}

export default function NoteCard({ note, onTogglePin }: { note: NoteSummary, onTogglePin?: ()=> void }) {

  const [pinned, setPinned] = useState(note.is_pinned ?? false)

  const togglePin = async (e:React.MouseEvent) =>{
    e.preventDefault()

    const newPinned = !pinned

    const {error} = await supabase
      .from("notes")
      .update({is_pinned: newPinned})
      .eq("id", note.id)

    if(!error){
      setPinned(newPinned)
      onTogglePin?.()
    }else{
      console.error("Failed to update pin:", error)
    }
  }

  return (
    <Link href={`/notes/${note.id}`}>
      <div className="relative rounded-2xl border bg-card text-card-foreground shadow-sm hover:shadow-md hover:scale-[1.01] transition-all duration-200 cursor-pointer p-4 space-y-2 hover:ring-1 hover:ring-muted">
        {/* 置顶按钮 */}
        <button
          onClick={togglePin}
          className="absolute top-2 right-2 text-xl"
        >
          {pinned ? "📌" : "📍"}
        </button>
        
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
