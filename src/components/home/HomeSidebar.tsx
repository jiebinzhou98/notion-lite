'use client'

import Link from 'next/link'

export default function HomeSidebar() {
  return (
    <aside className="hidden w-60 border-r border-zinc-200 bg-[#f3f3f1] px-5 py-6 md:flex md:flex-col">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-zinc-900">
          The Curator
        </h1>
      </div>

      <nav className="mt-10 space-y-1">
        <Link
          href="/"
          className="flex items-center rounded-xl bg-white px-3 py-3 text-sm font-medium text-zinc-900 ring-1 ring-zinc-200 transition"
        >
          Home
        </Link>

        <Link
          href="/explore"
          className="flex items-center rounded-xl px-3 py-3 text-sm text-zinc-600 transition hover:bg-white/70 hover:text-zinc-900"
        >
          All Notes
        </Link>
      </nav>

      <div className="mt-auto border-t border-zinc-200 pt-5">
        <button className="text-sm text-zinc-500 transition hover:text-zinc-800">
          Settings
        </button>
      </div>
    </aside>
  )
}