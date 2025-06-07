'use client'

import { supabase } from "@/lib/supabase"
import { useEffect, useState } from "react"

export default function TestPage() {
  const [status, setStatus] = useState("Testing...")

  useEffect(() => {
    const testInsert = async () => {
      const { data, error } = await supabase.from("notes").insert({
        title: "Test Note from App",
        content: { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "It works!" }] }] },
        user_key: "local"
      })

      if (error) {
        setStatus("❌ Insert failed: " + error.message)
      } else {
        setStatus("✅ Insert succeeded! Note ID: " + data?.[0])
      }
    }

    testInsert()
  }, [])

  return (
    <main className="p-4 text-center">
      <h1 className="text-2xl font-bold mb-4">Supabase Test</h1>
      <p>{status}</p>
    </main>
  )
}
