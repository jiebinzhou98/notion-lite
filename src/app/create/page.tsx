'use client'

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import dynamic from "next/dynamic";

//Editor 已经是csr了，为了不跟next.js自带的dynamic rendering冲突
const Editor = dynamic (() => import ('@/components/ui/Editor'), {ssr: false})

export default function CreatePage() {
  const [title, setTitle] = useState("")
  const [editorContent, setEditorContent] = useState<any>(null)
  const [status, setStatus] = useState("")

  const handleSave = async () =>{
    setStatus("Saving...")

    const {data, error} = await supabase.from("notes").insert({
    title,
    content: editorContent,
    user_key: "local"
  })

  if(error){
    setStatus("Failed to save: " +error.message)
  }else{
    setStatus("Note Saved")
    setTitle("")
    setEditorContent(null)
  }
}

  return (
    <main className="p-4 max-w-2xl mx-auto space-y-4">
      <h1 className="text-2xl font-bold">Create a New Note</h1>
      <input
        type="text"
        value={title}
        onChange={(e) =>setTitle(e.target.value)}
        placeholder="Enter note title"
        className="w-full border rounded p-2 text-lg"
      />
      <Editor onChange={setEditorContent} />

      <button
        onClick={handleSave}
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition"
      >
        Save Note
      </button>
      <p className="text-sm text-gray-500">{status}</p>
    </main>
  )
}

