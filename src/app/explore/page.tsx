'use client'
import React, { Suspense } from 'react'
import dynamic from 'next/dynamic'

// 用 suspense 模式动态加载客户端组件
const ClientExplorePage = dynamic(
  () => import('./ClientExplorePage'),
  { ssr: false }
)

export default function ExplorePage() {
  return (
    <Suspense fallback={<div className="p-4 text-center">Loading Note list…</div>}>
      <ClientExplorePage />
    </Suspense>
  )
}
