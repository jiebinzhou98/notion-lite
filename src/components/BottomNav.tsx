'use client'

import { useParams, usePathname, useRouter } from "next/navigation"
import {Home, PlusCircle, BookOpen} from 'lucide-react'
import { supabase } from "@/lib/supabase"
import { title } from "process"


export default function BottomNav() {
    const router = useRouter()
    const pathName = usePathname()

    const createNote = async () =>{
        const {data, error} = await supabase
            .from("notes")
            .insert({
                title: "",
                content: {type: "doc", content: []},
                is_pinned: false,
            })
            .select()
            .single()
        if(error){
            console.error("Create note failed", error)
            return
        }
        router.replace(`/explore/${data!.id}`)
    }

    return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/90 border-t backdrop-blur-md flex justify-around items-center h-16 md:hidden">
      <button
        onClick={() => router.push("/explore")}
        className={`flex flex-col items-center text-xs ${
          pathName.startsWith("/explore") ? "text-blue-600 font-semibold" : "text-gray-500"
        }`}
      >
        <Home className="w-6 h-6" />
        <span>Explore</span>
      </button>

      <button
        onClick={createNote}
        className="flex flex-col items-center text-xs text-gray-500"
      >
        <PlusCircle className="w-6 h-6" />
        <span>Create</span>
      </button>
    </nav>
  )
}