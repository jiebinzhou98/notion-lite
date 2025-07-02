// src/app/explore/ClientExplore.tsx
'use client';

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import ExploreDesktop from './ExploreDesktop'
import MobileList from './MobileList';

export default function ClientExplore() {
  const [isMobile, setIsMobile] = useState(false)
  const searchParams = useSearchParams()
  const router       = useRouter()
  const selected     = searchParams.get('selected')

  useEffect(() => {
    const fn = () => setIsMobile(window.innerWidth < 768)
    fn()
    window.addEventListener('resize', fn)
    return () => window.removeEventListener('resize', fn)
  }, [])

  if (isMobile && selected) {
    router.replace(`/explore/${selected}`)
    return null
  }
    
  if (isMobile && !selected){
    return <MobileList />
  }

  // 其它情况都渲染桌面版
  return <ExploreDesktop />
}
