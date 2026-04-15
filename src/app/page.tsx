'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { NoteSummary } from '@/types/note'
import HomeSidebar from '@/components/home/HomeSidebar'
import HomeTopBar from '@/components/home/HomeTopBar'
import HomeHero from '@/components/home/HomeHero'
import RecentNotesList from '@/components/home/RecentNotesList'

export default function HomePage() {
  const [notes, setNotes] = useState<NoteSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    async function fetchRecent() {
      const { data, error } = await supabase
        .from('notes')
        .select('id, title, created_at, content, is_pinned')
        .order('created_at', { ascending: false })
        .limit(5)

      if (error) {
        console.error('Failed to load recent notes', error)
        setLoading(false)
        return
      }

      if (data) {
        const list: NoteSummary[] = data.map((item) => {
          let excerpt = ''

          try {
            const paragraph = item.content?.content?.find(
              (block: any) => block.type === 'paragraph'
            )
            excerpt = paragraph?.content?.[0]?.text || ''
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

      setLoading(false)
    }

    fetchRecent()
  }, [])

  const filteredNotes = notes.filter((note) => {
    const q = searchTerm.toLowerCase().trim()

    if(!q) return true

    return(
      note.title.toLowerCase().includes(q) ||
      note.excerpt?.toLowerCase().includes(q)
    )
  })

  return (
    <main className="flex min-h-screen bg-[#f7f7f5] text-zinc-900">
      <HomeSidebar />

      <section className="flex min-w-0 flex-1 flex-col">
        <HomeTopBar
          searchValue={searchTerm}
          onSearchChange={setSearchTerm}
        />

        <div className="flex-1 px-6 pb-12 pt-4 md:px-10 md:pb-14">
          <div className="mx-auto max-w-4xl">
            <HomeHero />

            <RecentNotesList 
              notes={filteredNotes} 
              loading={loading}
              searchTerm={searchTerm}
            />

            <div className="mt-20 border-t border-zinc-200 pt-8 text-center">
              <Link
                href="/explore"
                className="text-sm uppercase tracking-[0.22em] text-zinc-400 transition hover:text-zinc-700"
              >
                Start a new entry
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}