'use client'

import Link from "next/link"
import { useParams, usePathname } from "next/navigation"

export default function TopNav(){
    const pathname = usePathname()
    const navItems = [
        {name: 'Explore', href: '/explore'},
        {name: 'Create', href: '/create'},

    ]

    return (
        <nav className="hidden md:flex bg-white border-b shadow-sm">
            <ul className="flex items-center space-x-6 p-4 mx-auto max-w-2xl">
                {navItems.map(item => {
                    const active = pathname === item.href
                    return (
                        <li key={item.href}>
                            <Link
                                href={item.href}
                                className={`text-sm ${active ? 'text-blue-600 font-semibold' : 'text-gray-600'}`}
                            >
                                {item.name}
                            </Link>
                        </li>
                    )
                })}
            </ul>
        </nav>
    )
}