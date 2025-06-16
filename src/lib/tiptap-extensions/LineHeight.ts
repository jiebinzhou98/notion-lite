// src/lib/tiptap-extensions/LineHeight.ts
import Paragraph from '@tiptap/extension-paragraph'
import { mergeAttributes } from '@tiptap/core'

export const LineHeight = Paragraph.extend({
  name: 'paragraph', // 保持原名，不要改

  addOptions() {
    return {
      ...this.parent?.(),
      HTMLAttributes: {},
    }
  },

  addAttributes() {
    return {
      ...this.parent?.(),
      lineHeight: {
        default: null,
        parseHTML: element => element.style.lineHeight || null,
        renderHTML: attributes => {
          if (!attributes.lineHeight) {
            return {}
          }
          return {
            style: `line-height: ${attributes.lineHeight}`,
          }
        },
      },
    }
  },

  addCommands() {
    return {
      setLineHeight:
        (value: any) =>
        ({ chain }: { chain: any }) => {
          return chain()
            .setNode('paragraph', { lineHeight: value })
            .run()
        },
      unsetLineHeight:
        () =>
        ({ chain }: { chain: any }) => {
          return chain()
            .setNode('paragraph', { lineHeight: null })
            .run()
        },
    } as Partial<import('@tiptap/core').RawCommands>
  },
})
