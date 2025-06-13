'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { NoteSummary } from '@/components/ui/NoteCard'

export default function HomePage() {
  const [notes, setNotes] = useState<NoteSummary[]>([])

  useEffect(() => {
    async function fetchRecent() {
      const { data, error } = await supabase
        .from('notes')
        .select('id, title, created_at, content, is_pinned')
        .order('created_at', { ascending: false })
        .limit(5)

      if (error) {
        console.error('Failed to load recent notes', error)
      } else if (data) {
        // 从 content 里提取一段摘录
        const list = data.map(item => {
          let excerpt = ''
          try {
            const p = item.content.content.find((b: any) => b.type === 'paragraph')
            excerpt = p.content[0]?.text || ''
          } catch {
            excerpt = ''
          }
          return {
            id: item.id,
            title: item.title,
            created_at: item.created_at,
            excerpt,
            is_pinned: item.is_pinned,
          }
        })
        setNotes(list)
      }
    }
    fetchRecent()
  }, [])

  return (
    <main className="min-h-screen p-6 bg-gradient-to-br from-amber-100 via-amber-50 to-stone-50">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-800 mb-6">Recent Notes</h1>
        <div className="space-y-4">
          {notes.map(note => (
            <Link
              key={note.id}
              href={`/explore?selected=${note.id}`}
              className="block p-4 bg-white/80 backdrop-blur-sm rounded-lg shadow hover:scale-[1.02] transition"
            >
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-900">
                  {note.title || 'Untitled'}
                </h2>
                <span className="text-sm text-gray-500">
                  {new Date(note.created_at).toLocaleDateString()}
                </span>
              </div>
              {note.excerpt && (
                <p className="mt-2 text-gray-700 line-clamp-2">{note.excerpt}</p>
              )}
            </Link>
          ))}
          {notes.length === 0 && (
            <p className="text-gray-600">No notes yet—create your first note!</p>
          )}
        </div>
      </div>
    </main>
  )
}
