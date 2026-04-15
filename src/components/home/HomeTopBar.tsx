'use client'

import { Search, X } from 'lucide-react'

type Props = {
  searchValue: string
  onSearchChange: (value: string) => void
}

export default function HomeTopBar({
  searchValue,
  onSearchChange,
}: Props) {
  return (
    <header className="flex items-center justify-between border-b border-zinc-200 bg-[#f7f7f5]/90 px-6 py-4 backdrop-blur md:px-10">
      <div className="relative w-full max-w-md">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />

        <input
          type="text"
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search your notes..."
          className="w-full rounded-full border border-zinc-200 bg-white/80 py-2.5 pl-10 pr-10 text-sm text-zinc-700 outline-none transition placeholder:text-zinc-400 focus:border-zinc-300 focus:ring-2 focus:ring-zinc-200"
        />

        {searchValue && (
          <button
            type="button"
            onClick={() => onSearchChange('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="ml-6 hidden items-center gap-5 text-sm md:flex">
        <button className="text-zinc-500 transition hover:text-zinc-800">
          Shared
        </button>

        <button className="font-medium text-zinc-900 transition hover:text-zinc-700">
          Recent
        </button>

        <button className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-zinc-700 transition hover:bg-zinc-100 hover:text-zinc-900">
          Share
        </button>
      </div>
    </header>
  )
}