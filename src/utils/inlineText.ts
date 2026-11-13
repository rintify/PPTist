import katex from 'katex'
import 'katex/dist/katex.min.css'
import { MUTED_SLIDE_TEXT } from '@/configs/slideAppearance'

const blocks = 'p, div, h1, h2, h3, h4, h5, h6, li, blockquote, td, th'
const excluded = 'code, pre, script, style, br'
const citationPattern = /\[\d+\]/g
const sentenceStart = /(?:^|[。！？.!?])[\s「『（(“‘」』）)”’]*(?:\[\d+\][\s]*)*$/u

function findInlineMath(text: string) {
  // Keep rendering the double delimiters used by older projects.
  return Array.from(text.matchAll(/(?<!\\)(?:\$\$((?:\\.|[^\\$\r\n])+)\$\$|\$((?:\\.|[^\\$\r\n])+)\$)/g), match => ({
    start: match.index ?? 0,
    end: (match.index ?? 0) + match[0].length,
    source: match[1] ?? match[2],
  }))
}

function collectInlineRuns(container: DocumentFragment) {
  const runs: Text[][] = []
  let current: Text[] = []
  function breakRun() {
    if (current.length) runs.push(current)
    current = []
  }
  function visit(node: Node) {
    if (node instanceof Text) {
      if (node.length) current.push(node)
      return
    }
    if (node instanceof Element && node.matches('rt')) return
    if (node instanceof Element && node.matches(excluded)) {
      breakRun()
      return
    }
    const block = node instanceof Element && node.matches(blocks)
    if (block) breakRun()
    node.childNodes.forEach(visit)
    if (block) breakRun()
  }
  visit(container)
  breakRun()
  return runs
}

export function renderInlineText(content: string, { citations = true, caption = false } = {}) {
  const mathPossible = content.includes('$')
  const citationsPossible = citations && content.includes('[')
  if (!mathPossible && !citationsPossible && !caption) return { html: content, hasMath: false }
  const template = document.createElement('template')
  template.innerHTML = content
  if (caption) {
    for (const element of template.content.querySelectorAll<HTMLElement>('p, div, a, [style]')) {
      element.style.color = MUTED_SLIDE_TEXT
    }
  }
  let rendered = caption
  let hasMath = false
  for (const nodes of collectInlineRuns(template.content)) {
    let text = ''
    const positions = nodes.map(node => {
      const start = text.length
      text += node.data
      return { node, start, end: text.length }
    })
    const math = mathPossible ? findInlineMath(text) : []
    const replacements: { start: number; end: number; node: HTMLElement }[] = []
    for (const { start, end, source } of math) {
      if (!source.trim()) continue
      const formula = document.createElement('span')
      try {
        formula.innerHTML = katex.renderToString(source.trim(), { displayMode: false, trust: false, strict: 'ignore' })
      }
      catch {
        continue
      }
      formula.className = 'inline-math'
      replacements.push({ start, end, node: formula })
      hasMath = true
    }
    if (citationsPossible) {
      for (const match of text.matchAll(citationPattern)) {
        const start = match.index ?? 0
        const end = start + match[0].length
        if (sentenceStart.test(text.slice(0, start))) continue
        if (math.some(range => range.start < end && range.end > start)) continue
        const marker = document.createElement('sup')
        marker.className = 'inline-citation'
        marker.style.color = MUTED_SLIDE_TEXT
        marker.textContent = match[0]
        replacements.push({ start, end, node: marker })
      }
    }

    // Work backwards so preceding offsets remain valid after replacing a match.
    replacements.sort((a, b) => b.start - a.start)
    for (const { start, end, node } of replacements) {
      const first = positions.find(position => position.end > start)
      const last = positions.find(position => position.end >= end)
      if (!first || !last) continue
      const range = document.createRange()
      range.setStart(first.node, start - first.start)
      range.setEnd(last.node, end - last.start)
      range.deleteContents()
      range.insertNode(node)
      rendered = true
    }
  }
  return { html: rendered ? template.innerHTML : content, hasMath }
}
