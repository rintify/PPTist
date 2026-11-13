import katex from 'katex'
import { hfmath } from '@/components/LaTeXEditor/hfmath'
import type { PPTLatexElement } from '@/types/slides'

export function updateFormulaSource(element: PPTLatexElement, latex: string): Partial<PPTLatexElement> {
  if (!latex.trim()) throw new Error('Empty formula')
  if (!element.katex) {
    const formula = new hfmath(latex)
    const box = formula.box({})
    const viewBox: [number, number] = [box.w + 32, box.h + 32]
    return { latex, path: formula.pathd({}), viewBox, width: viewBox[0], height: viewBox[1] }
  }

  const { display, fontSize, fontFamily } = element.katex
  const markup = katex.renderToString(latex, { displayMode: display, trust: false })
  const measure = document.createElement('span')
  measure.style.cssText = 'position:fixed;visibility:hidden;display:inline-block;width:max-content;line-height:normal;white-space:nowrap'
  measure.style.fontSize = `${fontSize}px`
  if (fontFamily) measure.style.fontFamily = fontFamily
  measure.innerHTML = markup
  const formula = measure.querySelector<HTMLElement>('.katex')
  if (formula) formula.style.fontSize = '1em'
  const displayWrapper = measure.querySelector<HTMLElement>('.katex-display')
  if (displayWrapper) displayWrapper.style.margin = '0'
  document.body.appendChild(measure)
  try {
    const { width, height } = measure.getBoundingClientRect()
    if (!width || !height) throw new Error('Empty formula')
    return {
      latex,
      viewBox: [width, height],
      width: width * (element.width / element.viewBox[0]),
      height: height * (element.height / element.viewBox[1]),
    }
  }
  finally {
    measure.remove()
  }
}

const textEscapes: Record<string, string> = {
  '{': '\\{', '}': '\\}', '%': '\\%', '$': '\\$', '&': '\\&', '#': '\\#',
  '_': '\\_', '\\': '\\textbackslash{}', '^': '\\textasciicircum{}', '~': '\\textasciitilde{}',
}
const unescapeText = Object.fromEntries(Object.entries(textEscapes).map(([key, value]) => [value, key]))

// Expose literal text arguments. Arguments containing TeX commands stay editable in the source.
export function getFormulaTextFields(source: string) {
  return Array.from(source.matchAll(/(?<!\\)\\text\{((?:[^{}\\]|\\[{}%$&#_]|\\text(?:backslash|asciicircum|asciitilde)\{\})*)\}/g), match => ({
    start: (match.index ?? 0) + '\\text{'.length,
    end: (match.index ?? 0) + match[0].length - 1,
    text: match[1].replace(/\\(?:[{}%$&#_]|text(?:backslash|asciicircum|asciitilde)\{\})/g, token => unescapeText[token]),
  }))
}

export function replaceFormulaText(source: string, field: ReturnType<typeof getFormulaTextFields>[number], text: string) {
  const escaped = Array.from(text, char => textEscapes[char] || char).join('')
  return source.slice(0, field.start) + escaped + source.slice(field.end)
}
