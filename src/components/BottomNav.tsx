'use client'

import { useParams, usePathname, useRouter } from "next/navigation"
import {Home, PlusCircle, BookOpen} from 'lucide-react'

const navItems = [
    { name: 'Explore', href: '/explore', icon: <Home className="w-6 h-6"/>},
    { name: 'Create', href: '/create', icon: <PlusCircle className="w-6 h-6"/>},
]

export default function BottomNav() {
    const router = useRouter()
    const pathName = usePathname()

    return(
        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/90 border-t backdrop-blur-md flex justify-around items-center h-16 md:hidden">
            {navItems.map(item =>{
                const isActive = pathName === item.href
                return(
                    <button
                        key={item.name}
                        onClick={() => router.push(item.href)}
                        aria-label={item.name}
                        className={`flex flex-col items-center justify-center text-xs ${isActive ? 'text-blue-600 font-semibold' : 'text-gray-500'}`}
                    >
                        {item.icon}
                        <span>{item.name}</span>
                    </button>
                )
            })}
        </nav>
    )
}