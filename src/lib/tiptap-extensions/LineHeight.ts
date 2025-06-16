import {Node, mergeAttributes} from '@tiptap/core'

export interface LineHeightOptions{
    types: string[],
}

declare module '@tiptap/core'{
    interface Commands<ReturnType>{
        lineHeight: {
            setLineHeight: (value: string) => ReturnType
            unsetLineHeight: () => ReturnType
        }
    }
}

export const lineHeight = Node.create<LineHeightOptions>({
    name: 'paragraph',
    addOptions(){
        return{
            types:['paragraph'],
        }
    },
    addAttributes(){
        return{
            lineHeight:{
                default: null,
                parseHTML: element => element.style.lineHeight?.toString() || null,
                renderHTML: attributes =>{
                    if(!attributes.lineHeight){
                        return{}
                    }
                    return {style: `line-height: ${attributes.lineHeight}`}
                },
            },
        }      
    },
    parseHTML(){
        return this.options.types.map(type => ({
            tag:type,
        }))
    },
    renderHTML({HTMLAttributes}){
        return ['p', mergeAttributes(HTMLAttributes),0]
    },
    addCommands(){
        return{
            setLineHeight:
                value =>
                ({chain}) => {
                    return chain().setNode('paragraph', {lineHeight: value}).run()
                },
            unsetLineHeight:
                () =>
                ({chain}) => {
                    return chain().setNode('paragraph', {lineHeight:null}).run()
                },
        }
    },
})