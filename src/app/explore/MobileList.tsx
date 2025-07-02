// src/app/explore/MobileList.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import NoteCard, { NoteSummary } from '@/components/ui/NoteCard'
import { supabase } from '@/lib/supabase'

export default function MobileList() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const selected = searchParams.get('selected')

  const [notes, setNotes] = useState<NoteSummary[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('notes')
      .select('id,title,content,created_at,is_pinned')
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (data) {
          const list = data.map(item => {
            let excerpt = ''
            try {
              excerpt = item.content.content?.[0]?.content?.[0]?.text || ''
            } catch {}
            return {
              id: item.id,
              title: item.title,
              excerpt,
              is_pinned: item.is_pinned,
              created_at: item.created_at,
            }
          })
          setNotes(list)
        }
        setLoading(false)
      })
  }, [])

  if (loading) {
    return <div className="h-screen flex items-center justify-center">Loading…</div>
  }

  return (
    <div className="h-screen flex flex-col">
      {/* 顶栏同 Detail 保持一致 */}
      <header className="flex items-center px-4 py-3 border-b bg-white">
        {/* 可把抽屉按钮换成菜单 */}
        <div className="text-lg font-semibold">My Notes</div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
        {notes.map((note) => (
          <NoteCard
            key={note.id}
            note={note}
            onSelect={(id) => router.push(`/explore/${id}`)}
          />
        ))}
      </div>
    </div>
  )
}
