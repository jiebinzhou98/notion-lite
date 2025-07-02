'use client'
// src/app/explore/page.tsx

import dynamic from 'next/dynamic'

// ensure this route is never statically prerendered
// export const dynamicMode = 'force-dynamic'

// load your client‐only explorer UI
const ClientExplore = dynamic(
  () => import('./ClientExplore'),
  { ssr: false }
)

export default function ExplorePage() {
  // server component simply hands off to the client bundle
  return <ClientExplore />
}
