'use client'

import { useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useEditor, EditorContent, JSONContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { useDebounce } from '@/lib/useDebounce'
import Placeholder from '@tiptap/extension-placeholder'
import Highlight from '@tiptap/extension-highlight'
import { LineHeight } from '@/lib/tiptap-extensions/LineHeight'
import { TextStyleExtended } from '@/lib/tiptap-extensions/FontSize'
import {
  Trash2,
  Bold,
  Italic,
  Download,
  Eraser,
  List,
  Type,
  AlignJustify,
  Highlighter,
  ChevronDown,
  ListOrdered,
} from 'lucide-react'

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

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    function check() {
      setIsMobile(window.innerWidth <= 768)
    }

    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  return isMobile
}

export default function NoteDetailEditor({
  id,
  onUpdate,
  onDelete,
}: {
  id: string
  onUpdate?: (payload: { title: string; excerpt: string }) => void
  onDelete?: (id: string) => void
}) {
  const [title, setTitle] = useState('')
  const [initialContent, setInitialContent] = useState<JSONContent | null>(null)
  const [latestContent, setLatestContent] = useState<JSONContent | null>(null)
  const [savingStatus, setSavingStatus] = useState('')
  const [highlightDropdownOpen, setHighlightDropdownOpen] = useState(false)

  const dropdownRef = useRef<HTMLDivElement>(null)
  const isMobile = useIsMobile()

  const extractExcerpt = (json: JSONContent | null) =>
    json?.content?.[0]?.content?.[0]?.text || ''

  const fallbackDoc: JSONContent = {
    type: 'doc',
    content: [{ type: 'paragraph' }],
  }

  const fontSizes = [12, 14, 16, 18, 20, 22, 24]
  const lineHeights = ['1', '1.5', '2']
  const highlightColors = [
    { color: '#fff59d', label: 'Yellow' },
    { color: '#ef9a9a', label: 'Red' },
    { color: '#a5d6a7', label: 'Green' },
  ]

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setHighlightDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const isValidDoc =
    initialContent?.type === 'doc' &&
    Array.isArray(initialContent.content) &&
    initialContent.content.length > 0

  const editor = useEditor(
    {
      extensions: [
        StarterKit.configure({
          bulletList: {
            HTMLAttributes: {
              class: 'list-disc pl-4',
            },
          },
          orderedList: {
            HTMLAttributes: {
              class: 'list-decimal ml-4',
            },
          },
        }),
        LineHeight,
        Highlight.configure({
          multicolor: true,
        }),
        TextStyleExtended,
        Placeholder.configure({
          placeholder: 'Start writing...',
          emptyEditorClass: 'is-editor-empty',
        }),
      ],
      content: isValidDoc ? initialContent : fallbackDoc,
      editable: true,
      autofocus: false,
      onUpdate({ editor }) {
        const json = editor.getJSON()
        setLatestContent(json)
        setSavingStatus('Saving...')
      },
    },
    [initialContent]
  )

  const currentFontSize = editor?.getAttributes('textStyle').fontSize || ''
  const currentLineHeight = editor?.getAttributes('paragraph').lineHeight || ''
  const currentHighlightColor = editor?.getAttributes('highlight').color || null

  function handleDownloadAsHtml() {
    if (!editor) return

    const html = editor.getHTML()
    const full = `
<!doctype html>
<html>
  <head>
    <meta charset="utf-8">
    <title>${title || 'note'}</title>
  </head>
  <body>
    <h1>${title || 'Untitled'}</h1>
    ${html}
  </body>
</html>`

    const blob = new Blob([full], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${(title || 'note').replace(/\s+/g, '_')}.html`
    a.click()
    URL.revokeObjectURL(url)
  }

  useDebounce(
    () => {
      if (!title.trim()) return

        ; (async () => {
          try {
            const { error } = await supabase
              .from('notes')
              .update({ title })
              .eq('id', id)

            if (error) throw error
            setSavingStatus('Saved')
          } catch (e) {
            console.error('Failed saving title', e)
          }
        })()
    },
    1000,
    [title, id]
  )

  useDebounce(
    () => {
      if (!latestContent) return

        ; (async () => {
          try {
            const { error } = await supabase
              .from('notes')
              .update({ content: latestContent })
              .eq('id', id)

            if (error) throw error
            setSavingStatus('Saved')
          } catch (e) {
            console.error('Failed saving content', e)
          }
        })()
    },
    1500,
    [latestContent, id]
  )

  useDebounce(
    () => {
      if (latestContent && onUpdate) {
        onUpdate({
          title,
          excerpt: extractExcerpt(latestContent),
        })
      }
    },
    1000,
    [title, latestContent, onUpdate]
  )

  useEffect(() => {
    if (!id) return

    let isCancelled = false

    async function fetchNote() {
      const { data, error } = await supabase
        .from('notes')
        .select('title, content, created_at')
        .eq('id', id)
        .maybeSingle()

      if (isCancelled) return

      if (error) {
        console.error('Failed fetching note:', error)
        return
      }

      if (!data) return

      setTitle(data.title ?? '')
      setInitialContent(data.content ?? null)
    }

    fetchNote()

    return () => {
      isCancelled = true
    }
  }, [id])

  return (
    <main className="relative flex min-h-full flex-col bg-transparent">
      {!editor ? (
        <div className="py-16 text-xs text-zinc-400">Loading editor...</div>
      ) : (
        <>
          <div className="mx-auto w-full max-w-4xl">
            <div className="flex items-center justify-between text-[11px] text-zinc-400">
              <span>
                {savingStatus === 'Saved' ? 'Saved just now' : savingStatus || 'Not saved yet'}
              </span>

              <button
                onClick={() => onDelete?.(id)}
                className="rounded-md p-1 text-zinc-400 transition hover:bg-red-50 hover:text-red-500"
                aria-label="Delete note"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-3">
              <input
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value)
                  setSavingStatus('Saving...')
                }}
                placeholder="Untitled"
                className="w-full bg-transparent text-[28px] font-medium tracking-tight text-zinc-900 outline-none placeholder:text-zinc-300 md:text-[32px]"
              />
            </div>

            <div className="mt-4 min-h-[70vh] pb-32">
              <EditorContent
                editor={editor}
                className="prose prose-zinc max-w-none text-[17px] leading-8 focus-within:outline-none"
                onKeyDown={(e) => {
                  if (e.key === 'Tab' && editor) {
                    e.preventDefault()
                    editor.chain().focus().insertContent('    ').run()
                  }
                }}
              />
            </div>
          </div>

          {!isMobile && (
            <div
              className="pointer-events-none fixed bottom-8 z-30"
              style={{
                left: 'calc(272px + ((100vw - 272px) / 2))',
                transform: 'translateX(-50%)',
              }}
            >
              <div className="pointer-events-auto flex items-center gap-2 rounded-2xl border border-zinc-200 bg-white/95 px-3 py-2 shadow-lg backdrop-blur">
                <button
                  onClick={() => editor.chain().focus().toggleBold().run()}
                  className={`rounded-md p-2 transition hover:bg-zinc-100 ${editor.isActive('bold')
                      ? 'bg-zinc-100 text-zinc-900'
                      : 'text-zinc-500'
                    }`}
                >
                  <Bold className="h-4 w-4" />
                </button>

                <button
                  onClick={() => editor.chain().focus().toggleItalic().run()}
                  className={`rounded-md p-2 transition hover:bg-zinc-100 ${editor.isActive('italic')
                      ? 'bg-zinc-100 text-zinc-900'
                      : 'text-zinc-500'
                    }`}
                >
                  <Italic className="h-4 w-4" />
                </button>

                <button
                  onClick={handleDownloadAsHtml}
                  className="rounded-md p-2 text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900"
                >
                  <Download className="h-4 w-4" />
                </button>

                <div className="h-6 w-px bg-zinc-200" />

                <div className="flex items-center gap-1 rounded-md px-2 py-1">
                  <AlignJustify className="h-4 w-4 text-zinc-500" />
                  <select
                    value={currentLineHeight}
                    onChange={(e) =>
                      editor?.chain().focus().setLineHeight(e.target.value).run()
                    }
                    className="bg-transparent text-sm text-zinc-600 outline-none"
                  >
                    <option value="">Line</option>
                    {lineHeights.map((lh) => (
                      <option key={lh} value={lh}>
                        {lh}
                      </option>
                    ))}
                  </select>
                </div>

                <div ref={dropdownRef} className="relative">
                  <button
                    onClick={() => setHighlightDropdownOpen((prev) => !prev)}
                    className="inline-flex items-center gap-1 rounded-md p-2 text-zinc-600 transition hover:bg-zinc-100"
                    title="Highlight"
                  >
                    <Highlighter
                      className="h-4 w-4"
                      style={{ color: currentHighlightColor || 'currentColor' }}
                    />
                    <ChevronDown className="h-4 w-4" />
                  </button>

                  {highlightDropdownOpen && (
                    <div className="absolute bottom-full left-0 z-50 mb-2 w-36 rounded-lg border border-zinc-200 bg-white p-1 shadow-lg">
                      {highlightColors.map(({ color, label }) => (
                        <button
                          key={color}
                          onClick={() => {
                            editor.chain().focus().toggleHighlight({ color }).run()
                            setHighlightDropdownOpen(false)
                          }}
                          className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-100"
                        >
                          <Highlighter className="h-4 w-4" style={{ color }} />
                          <span>{label}</span>
                        </button>
                      ))}

                      <button
                        onClick={() => {
                          editor.chain().focus().unsetHighlight().run()
                          setHighlightDropdownOpen(false)
                        }}
                        className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-red-600 hover:bg-zinc-100"
                      >
                        <Highlighter className="h-4 w-4" />
                        <span>Remove</span>
                      </button>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => editor.chain().focus().unsetHighlight().run()}
                  title="Remove highlight"
                  className="rounded-md p-2 text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900"
                >
                  <Eraser className="h-4 w-4" />
                </button>

                <div className="flex items-center gap-1 rounded-md px-2 py-1">
                  <Type className="h-4 w-4 text-zinc-500" />
                  <select
                    value={currentFontSize}
                    onChange={(e) =>
                      editor?.chain().focus().setFontSize(e.target.value).run()
                    }
                    className="bg-transparent text-sm text-zinc-600 outline-none"
                  >
                    <option value="">Size</option>
                    {fontSizes.map((size) => (
                      <option key={size} value={size.toString()}>
                        {size}px
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={() => editor.chain().focus().toggleBulletList().run()}
                  className={`rounded-md p-2 transition hover:bg-zinc-100 ${editor.isActive('bulletList')
                      ? 'bg-zinc-100 text-zinc-900'
                      : 'text-zinc-500'
                    }`}
                >
                  <List className="h-4 w-4" />
                </button>

                <button
                  onClick={() => editor.chain().focus().toggleOrderedList().run()}
                  className={`rounded-md p-2 transition hover:bg-zinc-100 ${editor.isActive('orderedList')
                      ? 'bg-zinc-100 text-zinc-900'
                      : 'text-zinc-500'
                    }`}
                >
                  <ListOrdered className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </main>
  )
}