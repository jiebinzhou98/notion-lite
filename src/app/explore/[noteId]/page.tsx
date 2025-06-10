'use client'

import NoteDetailEditor from "@/components/ui/NoteDetailEditor"
import { useRouter, useParams } from "next/navigation"

export default function MobileNotePage() {
    const router = useRouter()

    const {noteId} = useParams()

    if(!noteId){
    return(
        <div className="h-screen flex flex-col">
            <button
                onClick={() => router.back()}
                className="flex items-center gap-2 px-4 py-2 text-sm
                            font-medium text-gray-700 hover:text-gray-900
                            hover:bg-gray-100 rounded-lg transition"
            >
                ← Back
            </button>
            <div className="flex-1 flex items-center justify-center text-gray-500">
                Loading...
            </div>
        </div>
        )
    }
    return(
        <div className="h-screen flex flex-col">
            <button
                onClick={() =>router.back()}
                className="flex items-center gap-2 px-4 py-2 text-sm
                            font-medium text-gray-700 hover:text-gray-900
                            hover:bg-gray-100 rounded-lg transition"   
            >
                ← Back
            </button>
            <div className="flex-1 overflow-y-auto">
                <NoteDetailEditor id={Array.isArray(noteId) ? noteId[0] : noteId}/>
            </div>
        </div>
    )
}