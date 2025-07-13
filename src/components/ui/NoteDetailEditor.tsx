// src/components/ui/NoteDetailEditor.tsx
'use client'

import { useEffect, useRef, useState } from "react"
import { supabase } from "@/lib/supabase"
import { useEditor, EditorContent, JSONContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import { useDebounce } from "@/lib/useDebounce"
import { Trash2, Bold, Italic, Download } from "lucide-react"
import { LineHeight } from "@/lib/tiptap-extensions/LineHeight"
import OrderedList from '@tiptap/extension-ordered-list';
import Highlight from '@tiptap/extension-highlight'
import { Eraser, List, Type, AlignJustify, Highlighter, ChevronDown } from "lucide-react"
import { TextStyleExtended } from "@/lib/tiptap-extensions/FontSize"
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
  const lineHeights = ['1', '1.5', '2']
  const highlightColors = [
    { color: '#fff59d', label: 'Yellow' },
    { color: '#ef9a9a', label: 'Red' },
    { color: '#a5d6a7', label: 'Green' },
  ]

  const [highlightDropdownOpen, setHighlightDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutSide(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setHighlightDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutSide);
    return () => {
      document.removeEventListener("mousedown", handleClickOutSide)
    }
  }, [])

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
          orderedList: {
            HTMLAttributes: {
              class: 'list-decimal ml-4'
            }
          }
        }),

        LineHeight,
        Highlight.configure({
          multicolor: true,
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
  const currentLineHeight = editor?.getAttributes('paragraph').lineHeight || ''
  const currentHighlightColor = editor?.getAttributes('highligh').color || null;




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
        ; (async () => {
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

      ; (async () => {
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
              <div className="flex items-center space-x-1 bg-gray-50 rounded px-3 py-1 border border-gray-200">
                <label className="text-xs font-medium text-gray-500 whitespace-nowrap">
                  Folder:
                </label>
                <select
                  value={selectedFolder ?? ""}
                  onChange={handleFolderChange}
                  className="border-none bg-transparent text-sm focus:ring-1 focus:ring-indigo-400 outline-none cursor-pointer"
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
                className="p-1 text-red-500 hover:bg-red-50 rounded transition ml-2"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
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

              <div className="flex items-center space-x-1 border border-gray-300 rounded px-2 py-1 hover:border-indigo-400 cursor-pointer">
                <AlignJustify className="w-4 h-4 text-gray-600" />
                <select
                  value={currentLineHeight}
                  onChange={(e) => editor?.chain().focus().setLineHeight(e.target.value).run()}
                  className="bg-transparent border-none outline-none text-sm cursor-pointer"
                >
                  <option value="">Line Height</option>
                  {lineHeights.map((lh) => (
                    <option key={lh} value={lh}>
                      {lh}
                    </option>
                  ))}
                </select>
              </div>
              {/* 高亮颜色 Dropdown */}
              <div ref={dropdownRef} className="relative inline-block text-left">
                <button
                  onClick={() => setHighlightDropdownOpen(!highlightDropdownOpen)}
                  className={`inline-flex items-center gap-1 px-2 py-1 rounded border border-gray-300 hover:border-indigo-400 ${currentHighlightColor ? "bg-gray-200" : "bg-white"
                    }`}
                  title={currentHighlightColor ? `Highlight color: ${currentHighlightColor}` : "Highlight"}
                >
                  <Highlighter className="w-5 h-5" style={{ color: currentHighlightColor || "black" }} />
                  <ChevronDown className="w-4 h-4" />
                </button>

                {highlightDropdownOpen && (
                  <div className="absolute mt-1 w-32 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50">
                    <div className="py-1">
                      {highlightColors.map(({ color, label }) => (
                        <button
                          key={color}
                          onClick={() => {
                            editor.chain().focus().toggleHighlight({ color }).run()
                            setHighlightDropdownOpen(false)
                          }}
                          className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-gray-100"
                        >
                          <Highlighter className="w-5 h-5" style={{ color }} />
                          <span>{label}</span>
                        </button>
                      ))}

                      <button
                        onClick={() => {
                          editor.chain().focus().unsetHighlight().run()
                          setHighlightDropdownOpen(false)
                        }}
                        className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-gray-100"
                      >
                        <Highlighter className="w-5 h-5 text-red-600" />
                        <span>Remove Highlight</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>


              {/* 橡皮擦按钮，清除高亮 */}
              <button
                onClick={() => editor.chain().focus().unsetHighlight().run()}
                title="Remove highlight"
                className="p-1 rounded hover:bg-gray-200"
              >
                <Eraser className="w-5 h-5 text-gray-500" />
              </button>

              {/*字体大小*/}

              <div className="flex items-center space-x-1 border border-gray-300 rounded px-2 py-1 hover:border-indigo-400 cursor-pointer">
                <Type className="w-4 h-4 text-gray-600" />
                <select
                  value={currentFontSize}
                  onChange={(e) => editor?.chain().focus().setFontSize(e.target.value).run()}
                  className="bg-transparent border-none outline-none text-sm cursor-pointer"
                >
                  <option value="">Size</option>
                  {fontSizes.map((size) => (
                    <option key={size} value={size.toString()} style={{ fontSize: `${size}px` }}>
                      {size}px
                    </option>
                  ))}
                </select>
              </div>
              <button
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                className={editor.isActive('bulletList') ? 'is-active' : ''}
              >
                <List className="w-5 h-5" />
              </button>
              <button
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
                className={editor.isActive('orderedList') ? 'is-active' : ''}
                title="Toggle Ordered List"
              >
                1.
              </button>


            </div>
            <p className="text-xs text-gray-500">{savingStatus}</p>
          </div>

          {/* 编辑区 */}
          <div className="pt-4 prose prose-lg min-h-[60vh] focus-within:outline-none">
            <EditorContent
              editor={editor}
              onKeyDown={(e) => {
                if (e.key === "Tab" && editor) {
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
