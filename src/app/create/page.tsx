'use client'

import Editor from "@/components/ui/Editor";
import { supabase } from "@/lib/supabase";
import dynamic from "next/dynamic";

export default function CreatePage() {
  return (
    <main className="p-4 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Create a New Note</h1>
      <Editor />
    </main>
  )
}

