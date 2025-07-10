// src/components/ui/NoteDetailEditor.tsx
'use client'

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { useEditor, EditorContent, JSONContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import { useDebounce } from "@/lib/useDebounce"
import { Trash2, Bold, Italic, Download } from "lucide-react"
import { LineHeight } from "@/lib/tiptap-extensions/LineHeight"
import Highlight from '@tiptap/extension-highlight'
import { Eraser, List } from "lucide-react"
import { TextStyleExtended } from "@/lib/tiptap-extensions/FontSize"
import clsx from "clsx"
// 扩展 Commands 接口，支持 setLineHeight
declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    setLineHeight: {
      setLineHeight: (lineHeight: string) => ReturnType
    }
    fontSize: {
      setFontSize: (size: string) => ReturnType
      unsetFontSize: () => ReturnType
    }
  }
}


export default function NoteDetailEditor({
  id,
  folders,
  selectedFolder,
  onMoveFolder,
  onUpdate,
  onDelete,
}: {
  id: string
  folders: { id: string; name: string }[]
  selectedFolder: string | null
  onMoveFolder: (newFolderId: string | null) => void
  onUpdate?: (payload: { title: string; excerpt: string }) => void
  onDelete?: (id: string) => void
}) {
  const [title, setTitle] = useState("")
  const [initialContent, setInitialContent] = useState<JSONContent | null>(null)
  const [latestContent, setLatestContent] = useState<JSONContent | null>(null)
  const [savingStatus, setSavingStatus] = useState("")
  const extractExcerpt = (json: JSONContent | null) =>
    json?.content?.[0]?.content?.[0]?.text || ""

  const fallbackDoc: JSONContent = {
    type: "doc",
    content: [{ type: "paragraph", content: [{ type: "text", text: "" }] }],
  }

  const fontSizes = [12, 14, 16, 18, 20, 22, 24]

  const isValidDoc = initialContent?.type === "doc"
  const editor = useEditor(
    {
      extensions: [
        StarterKit.configure({
          bulletList: {
            HTMLAttributes: {
              class: 'list-disc pl-4'
            }
          },
        }),
        LineHeight,
        Highlight.configure({
          multicolor:true,
        }),
        TextStyleExtended,
      ],
      content: isValidDoc ? initialContent : fallbackDoc,
      editable: true,
      onUpdate({ editor }) {
        const json = editor.getJSON()
        setLatestContent(json)
        setSavingStatus("Saving...")
      },

    },
    [initialContent]
  )
  const currentFontSize = editor?.getAttributes('textStyle').fontSize || ''




  // 移动文件夹
  const handleFolderChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newId = e.target.value || null
    const { error } = await supabase
      .from("notes")
      .update({ folder_id: newId })
      .eq("id", id)
    if (error) {
      console.error("Move folder failed", error)
      return
    }
    onMoveFolder(newId)
  }

  // 导出 HTML
  function handleDownloadAsHtml() {
    if (!editor) return
    const html = editor.getHTML()
    const full = `
<!doctype html>
<html><head><meta charset="utf-8"><title>${title || "note"}</title></head>
<body><h1>${title || "Untitled"}</h1>${html}</body></html>`
    const blob = new Blob([full], { type: "text/html" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${(title || "note").replace(/\s+/g, "_")}.html`
    a.click()
    URL.revokeObjectURL(url)
  }

  // 自动保存标题
  useDebounce(
    () => {
      if (!title.trim()) return
      ;(async () => {
        try {
          const { error } = await supabase
            .from("notes")
            .update({ title })
            .eq("id", id)
          if (error) throw error
          setSavingStatus("Saved!")
        } catch (e) {
          console.error("Failed saving title", e)
        }
      })()
    },
    1000,
    [title]
  )

  // 自动保存内容（带空节点过滤 + 日志 + 错误捕获）
  useDebounce(
    () => {
      if (!latestContent) return

      // 跳过完全空文档
      const paras = latestContent.content?.[0]?.content
      if (!paras || paras.length === 0) {
        console.warn("Skip saving empty document")
        return
      }

      ;(async () => {
        console.log("Saving content to Supabase:", latestContent)
        try {
          const { error } = await supabase
            .from("notes")
            .update({ content: latestContent })
            .eq("id", id)
          if (error) throw error
          setSavingStatus("Saved!")
        } catch (e) {
          console.error("Failed saving content", e)
        }
      })()
    },
    1500,
    [latestContent]
  )

  // 通知父组件更新 title/excerpt
  useDebounce(
    () => {
      if (latestContent && title && onUpdate) {
        onUpdate({ title, excerpt: extractExcerpt(latestContent) })
      }
    },
    1000,
    [title, latestContent]
  )

  // 初始载入
  useEffect(() => {
    supabase
      .from("notes")
      .select("title, content")
      .eq("id", id)
      .single()
      .then(({ data, error }) => {
        if (data) {
          setTitle(data.title)
          setInitialContent(data.content)
        } else {
          console.error("Failed fetching note:", error)
        }
      })
  }, [id])

  return (
    <main className="flex-1 overflow-y-auto p-6 bg-white/90 backdrop-blur-sm space-y-4 rounded-2xl">
      {!editor ? (
        <p className="text-gray-400">Loading editor...</p>
      ) : (
        <>
          {/* 标题 + 下拉 + 删除 */}
          <div className="flex items-center justify-between border-b pb-2">
            <input
              value={title}
              onChange={(e) => {
                setTitle(e.target.value)
                setSavingStatus("Saving...")
              }}
              placeholder="Untitled"
              className="flex-1 text-4xl font-semibold outline-none bg-transparent"
            />

            {/* Folder 下拉 */}
            <div className="flex items-center space-x-2 mr-4">
              <label className="text-sm font-medium text-gray-600 whitespace-nowrap">
                Folder:
              </label>
              <select
                value={selectedFolder ?? ""}
                onChange={handleFolderChange}
                className="border border-gray-300 px-2 py-1 rounded text-sm focus:ring-1 focus:ring-indigo-200"
              >
                <option value="">All</option>
                {folders.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Delete */}
            <button
              onClick={() => onDelete?.(id)}
              className="p-1 text-red-500 hover:bg-red-50 rounded transition"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>

          {/* 工具栏 + 保存状态 */}
          <div className="flex items-center justify-between gap-3 border-b pb-2">
            <div className="flex gap-3">
              <button
                onClick={() => editor.chain().focus().toggleBold().run()}
                className={`p-1 rounded ${editor.isActive("bold") ? "bg-gray-200" : ""}`}
              >
                <Bold className="w-5 h-5" />
              </button>
              <button
                onClick={() => editor.chain().focus().toggleItalic().run()}
                className={`p-1 rounded ${editor.isActive("italic") ? "bg-gray-200" : ""}`}
              >
                <Italic className="w-5 h-5" />
              </button>
              <button
                onClick={handleDownloadAsHtml}
                className="p-1 rounded hover:bg-gray-200 transition"
              >
                <Download className="w-5 h-5" />
              </button>
              <button
                onClick={() => editor.chain().focus().insertContent("    ").run()}
                className="p-1 rounded hover:bg-gray-200"
              >
                Tab
              </button>
              {["1", "1.5", "2"].map((lh) => (
                <button
                  key={lh}
                  onClick={() => editor.chain().focus().setLineHeight(lh).run()}
                  className={`p-1 rounded ${
                    editor.getAttributes("paragraph").lineHeight === lh ? "bg-gray-200" : ""
                  }`}
                >
                  {lh}
                </button>
              ))}
              {/* 黄色highligh */}
              <button
                onClick={() =>editor.chain().focus().toggleHighlight({color: '#fff59d'}).run()}
                className={`p-1 rounded ${editor.isActive('highligh',{color: '#fff59d'}) ? 'bg-gray-200' : ''}`}
                title="Yellow highlight"
              >
                <span className="inline-block w-4 h-1 bg-yellow-300"/>
              </button>
              {/* 红色highlight */}
              <button
                onClick={() => editor.chain().focus().toggleHighlight({color: '#ef9a9a'}).run()}
                className={`p-1 rounded ${editor.isActive('highligh', {color: '#ef9a9a'}) ? 'bg-gray-200': ''}`}
                title="Red highlight"
              >
                <span className="inline-block w-4 h-1 bg-red-300"/>
              </button>
              {/* 移除highligh */}
              <button
                onClick={() => editor.chain().focus().unsetHighlight().run()}
                className="p-1 rounded hover:bg-gray-200"
                title="Remove highlight"
              >
                <Eraser className="w-5 h-5 text-gray-500"/>
              </button>
            
              {/*字体大小*/}
              <select
                value={currentFontSize}
                onChange={(e) => {
                  const size = e.target.value
                  editor?.chain().focus().setFontSize(size).run()
                }}
                className="border rounded px-2 py-1"
              >
                <option value="">Defalt Size</option>
                {fontSizes.map((size) =>(
                  <option key={size} value={size.toString()}>
                    {size}px
                  </option>
                ))}
              </select>
                      <button
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={editor.isActive('bulletList') ? 'is-active' : ''}
          >
            <List className="w-5 h-5"/>
          </button>


            </div>
            <p className="text-xs text-gray-500">{savingStatus}</p>
          </div>

          {/* 编辑区 */}
          <div className="pt-4 prose prose-lg min-h-[60vh] focus-within:outline-none">
            <EditorContent 
              editor={editor}
              onKeyDown={(e) => {
                if(e.key === "Tab" && editor){
                  e.preventDefault()
                  editor.chain().focus().insertContent("    ").run()
                }
              }}
            />
          </div>
        </>
      )}
    </main>
  )
}
