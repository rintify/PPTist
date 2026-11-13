import { useMainStore, useSlidesStore } from '@/store'
import type { PPTElement } from '@/types/slides'
import { copyText } from '@/utils/clipboard'
import message from '@/utils/message'

const elementType: Record<PPTElement['type'], string> = {
  text: 'テキスト', image: '画像', shape: '図形', line: '線', chart: 'グラフ',
  table: '表', latex: '数式', video: '動画', audio: '音声',
}

function excerpt(value: string) {
  const line = value.replace(/\s+/g, ' ').trim()
  return line.length > 140 ? line.slice(0, 139) + '…' : line
}

function describeElement(element: PPTElement) {
  const type = element.type === 'text' && element.textTemplate?.kind === 'caption'
    ? 'キャプション'
    : elementType[element.type]
  let content = element.name || ''
  if (element.type === 'latex') content = element.latex
  if (element.type === 'text') {
    const doc = new DOMParser().parseFromString(element.content, 'text/html')
    content = Array.from(doc.body.childNodes, node => node.textContent || '').join(' ')
  }
  const preview = excerpt(content)
  const position = `x=${Math.round(element.left)}, y=${Math.round(element.top)}`
  return `- ${type}（要素ID ${element.id}、${position}）${preview ? ' ' + JSON.stringify(preview) : ''}`
}

export default function useCopySlideReference() {
  const main = useMainStore()
  const project = useSlidesStore()
  return async () => {
    const slide = project.currentSlide
    if (!slide) return
    const elements = main.activeGroupElementId && main.handleElement
      ? [main.handleElement]
      : main.activeElementList
    const path = project.localProjectRevision ? import.meta.env.VITE_PPTIST_STARTUP_PROJECT : undefined
    const file = path?.split('/').at(-1)
    const heading = [slide.structure?.title, slide.structure?.subtitle].filter(Boolean).join(' / ')
    const lines = [
      `PPTist「${project.title}」${file ? '（' + file + '）' : ''}`,
      `スライド ${project.slideIndex + 1}/${project.slides.length}（スライドID ${slide.id}）${heading ? ' ' + heading : ''}`,
      ...(elements.length ? elements.map(describeElement) : ['対象: スライド全体']),
    ]
    try {
      const text = lines.join('\n')
      if (navigator.clipboard?.writeText) {
        try {
          await navigator.clipboard.writeText(text)
        }
        catch {
          await copyText(text)
        }
      }
      else await copyText(text)
      message.success('編集箇所の参照をコピーしました')
    }
    catch {
      message.error('編集箇所の参照をコピーできませんでした')
    }
  }
}
