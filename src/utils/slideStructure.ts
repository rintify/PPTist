import type { PPTElementLink, PPTShapeElement, PPTTextElement, Slide } from '@/types/slides'

type StructureElement = PPTTextElement | PPTShapeElement

interface Section {
  title: string
  slideId: string
}

const WIDTH = 1600
const FONT = '"Yu Gothic", "YuGothic", "Hiragino Kaku Gothic ProN", "Meiryo", sans-serif'
const INK = '#465563'
const ACCENT = '#bdd7ee'
const PALE = '#e2eff9'
let measureContext: CanvasRenderingContext2D | null = null

function textWidth(text: string, size: number) {
  measureContext ??= document.createElement('canvas').getContext('2d')
  if (!measureContext) return Array.from(text).length * size
  measureContext.font = `${size}px ${FONT}`
  return measureContext.measureText(text).width
}

function fitFont(text: string, size: number, width: number) {
  const measured = textWidth(text, size)
  return measured > width ? size * width / measured : size
}

function wrapText(text: string, size: number, width: number) {
  const lines: string[] = []
  let line = ''
  for (const word of text.trim().split(/\s+/)) {
    const candidate = line ? `${line} ${word}` : word
    if (textWidth(candidate, size) <= width) {
      line = candidate
      continue
    }

    if (line) lines.push(line)
    line = ''
    if (textWidth(word, size) <= width) {
      line = word
      continue
    }
    for (const char of word) {
      if (line && textWidth(line + char, size) > width) {
        lines.push(line)
        line = ''
      }
      line += char
    }
  }
  if (line) lines.push(line)
  return lines
}

function escapeText(text: string) {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function text(id: string, value: string, left: number, top: number, width: number, size: number,
  options: { align?: 'left' | 'center' | 'right'; color?: string; link?: PPTElementLink } = {}): PPTTextElement {
  const { align = 'left', color = INK, link } = options
  return {
    id, type: 'text', left, top, width, height: size * 1.2, rotate: 0, lock: true, link,
    defaultColor: color, defaultFontName: FONT, lineHeight: 1.2, inset: [0, 0, 0, 0],
    content: `<p style="text-align:${align}"><span style="font-size:${size}px">${escapeText(value)}</span></p>`,
  }
}

function shape(id: string, left: number, top: number, width: number, height: number, fill: string,
  corner: 'none' | 'badge' | 'subtitle' = 'none'): PPTShapeElement {
  const radius = Math.min(4, height / 2, width / 2)
  const paths = {
    none: `M0 0 H${width} V${height} H0 Z`,
    badge: `M${radius} 0 H${width - radius} Q${width} 0 ${width} ${radius} V${height - radius} Q${width} ${height} ${width - radius} ${height} H${radius} Q0 ${height} 0 ${height - radius} V${radius} Q0 0 ${radius} 0 Z`,
    subtitle: `M0 0 H${width} V10 A68 68 0 0 1 ${width - 68} 78 H0 Z`,
  }
  return {
    id, type: 'shape', left, top, width, height, fill, rotate: 0, lock: true,
    path: paths[corner], viewBox: [width, height], fixedRatio: false,
  }
}

function contents(prefix: string, sections: Section[], additional: string[], height: number): StructureElement[] {
  const entries = [...sections]
  const seen = new Set(sections.map(section => section.title))
  for (const value of additional) {
    const title = value.trim()
    if (!title || seen.has(title)) continue
    seen.add(title)
    entries.push({ title, slideId: '' })
  }
  if (!entries.length) return []

  const availableHeight = height - 180
  const rowsPerColumn = Math.max(1, Math.floor(availableHeight / 53))
  const columns = Math.min(2, Math.ceil(entries.length / rowsPerColumn))
  const rows = Math.ceil(entries.length / columns)
  const rowHeight = Math.min(53, availableHeight / rows)
  const columnWidth = 1420 / columns
  const labelSize = Math.min(29, rowHeight * 0.55)
  const badgeWidth = Math.min(57, columnWidth * 0.12)
  const badgeHeight = rowHeight * (40 / 53)
  return entries.flatMap(({ title, slideId }, index) => {
    const left = 100 + Math.floor(index / rows) * columnWidth
    const top = 153 + (index % rows) * rowHeight
    const labelLeft = left + badgeWidth + 30
    const labelWidth = columnWidth - badgeWidth - 58
    const size = fitFont(title, labelSize, labelWidth - 8)
    const number = String(index + 1).padStart(2, '0')
    const numberSize = Math.min(23, rowHeight * 0.44)
    const link: PPTElementLink | undefined = slideId ? { type: 'slide', target: slideId } : undefined
    return [
      shape(`${prefix}-badge-${index}`, left, top + (rowHeight - badgeHeight) / 2, badgeWidth, badgeHeight, PALE, 'badge'),
      text(`${prefix}-entry-number-${index}`, number, left, top + (rowHeight - numberSize * 1.2) / 2, badgeWidth, numberSize, { align: 'center' }),
      text(`${prefix}-entry-${index}`, title, labelLeft, top + (rowHeight - size * 1.2) / 2, labelWidth, size, { link }),
    ]
  })
}

function referenceFooter(prefix: string, references: NonNullable<NonNullable<Slide['structure']>['references']>, height: number) {
  const entries = references.filter(reference => reference.text.trim())
  if (!entries.length) return []
  const width = WIDTH - 160
  const availableHeight = Math.min(150, height - 198)
  let size = 17
  let lines: string[][]
  let lineHeight: number
  let gap: number
  let total: number
  do {
    lineHeight = size * 1.4
    gap = size * (5 / 17)
    lines = entries.map(({ text }, index) => wrapText(`[${index + 1}] ${text.trim()}`, size, width - 8))
    total = lines.reduce((sum, row) => sum + row.length * lineHeight, 0) + (entries.length - 1) * gap
    if (total <= availableHeight) break
    size *= Math.max(0.1, availableHeight / total) * 0.97
  } while (size > 0.1)

  let top = height - 22 - total + size * 0.1
  return lines.flatMap((row, index) => {
    const url = entries[index].url?.trim()
    const link: PPTElementLink | undefined = url && /^https?:\/\//i.test(url) ? { type: 'web', target: url } : undefined
    const result = row.map((line, lineIndex) => {
      const item = text(`${prefix}-ref-${index}-${lineIndex}`, line, 80, top, width, size, { color: '#626a70', link })
      top += lineHeight
      return item
    })
    top += gap
    return result
  })
}

export function buildSlideStructure(slides: Slide[], viewportSize: number, ratio: number) {
  const sections: Section[] = []
  const sectionBySlideId = new Map<string, Section>()
  let activeSection: Section | undefined
  for (const slide of slides) {
    if (slide.sectionTag) {
      activeSection = { title: slide.sectionTag.title?.trim() ?? '', slideId: slide.id }
      if (activeSection.title) sections.push(activeSection)
    }
    if (activeSection) sectionBySlideId.set(slide.id, activeSection)
    else if (slide.structure?.kind === 'standard') {
      const title = slide.structure.title?.trim() || slide.structure.subtitle?.trim()
      if (title) sections.push({ title, slideId: slide.id })
    }
  }

  const scale = viewportSize / WIDTH
  const height = WIDTH * ratio
  const elementsBySlideId: Record<string, StructureElement[]> = Object.create(null)
  slides.forEach((slide, index) => {
    const data = slide.structure
    if (!data || data.kind === 'none') return
    const prefix = `structure-${slide.id}`
    const title = data.title?.trim() || (data.kind === 'contents' ? '目次' : sectionBySlideId.get(slide.id)?.title || '')
    const size = fitFont(title, 34, 1380)
    const elements: StructureElement[] = [
      shape(`${prefix}-rule`, 0, 93, WIDTH, 4, ACCENT),
      text(`${prefix}-page`, String(index + 1), 1430, 28, 128, 30, { align: 'right' }),
    ]
    if (title) elements.push(text(`${prefix}-title`, title, 42, 46.5 - size * 0.6, 1388, size))
    const subtitle = data.subtitle?.trim()
    if (subtitle && data.kind === 'standard') {
      const subtitleSize = fitFont(subtitle, 38, WIDTH - 118)
      const bannerWidth = Math.min(WIDTH, textWidth(subtitle, subtitleSize) + 96)
      elements.push(
        shape(`${prefix}-banner`, 0, 97, bannerWidth, 78, ACCENT, 'subtitle'),
        text(`${prefix}-subtitle`, subtitle, 48, 107 + (38 - subtitleSize) * 0.6, bannerWidth - 68, subtitleSize),
      )
    }
    if (data.kind === 'contents') elements.push(...contents(prefix, sections, data.additionalSections || [], height))
    elements.push(...referenceFooter(prefix, data.references || [], height))
    elementsBySlideId[slide.id] = scale === 1 ? elements : elements.map(element => ({
      ...element,
      left: element.left * scale, top: element.top * scale, width: element.width * scale, height: element.height * scale,
      ...(element.type === 'text' && {
        content: element.content.replace(/font-size:([\d.]+)px/, (_, size) => `font-size:${Number(size) * scale}px`),
      }),
    }))
  })
  return { elementsBySlideId, sectionBySlideId }
}
