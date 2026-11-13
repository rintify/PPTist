import { MUTED_SLIDE_TEXT } from '@/configs/slideAppearance'
import type { PPTElementLink, PPTShapeElement, PPTTextElement, Slide, SlideTheme } from '@/types/slides'

type StructureElement = PPTTextElement | PPTShapeElement

interface ContentsEntry {
  title: string
  slideId: string
}

interface Section extends ContentsEntry {
  sectionId?: string
  children: ContentsEntry[]
  firstBodySlideId?: string
}

const WIDTH = 1600
const FONT = '"Yu Gothic", "YuGothic", "Hiragino Kaku Gothic ProN", "Meiryo", sans-serif'
const INK = '#465563'
const ACCENT = '#bdd7ee'
const PALE = '#e2eff9'
let measureContext: CanvasRenderingContext2D | null = null

function textWidth(text: string, size: number, font: string) {
  measureContext ??= document.createElement('canvas').getContext('2d')
  if (!measureContext) return Array.from(text).length * size
  measureContext.font = `${size}px ${font}`
  return measureContext.measureText(text).width
}

function fitFont(text: string, size: number, width: number, font: string) {
  const measured = textWidth(text, size, font)
  return measured > width ? size * width / measured : size
}

function wrapText(text: string, size: number, width: number, font: string) {
  const lines: string[] = []
  let line = ''
  for (const word of text.trim().split(/\s+/)) {
    const candidate = line ? `${line} ${word}` : word
    if (textWidth(candidate, size, font) <= width) {
      line = candidate
      continue
    }

    if (line) lines.push(line)
    line = ''
    if (textWidth(word, size, font) <= width) {
      line = word
      continue
    }
    for (const char of word) {
      if (line && textWidth(line + char, size, font) > width) {
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
  options: { bold?: boolean; align?: 'left' | 'center' | 'right'; color?: string; link?: PPTElementLink } = {}): PPTTextElement {
  const { bold, align = 'left', color = INK, link } = options
  return {
    id, type: 'text', left, top, width, height: size * 1.2, rotate: 0, lock: true, link,
    defaultColor: color, defaultFontName: FONT, lineHeight: 1.2, inset: [0, 0, 0, 0],
    content: `<p style="text-align:${align}"><span style="font-size:${size}px">${bold ? `<strong>${escapeText(value)}</strong>` : escapeText(value)}</span></p>`,
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

function pageProgress(prefix: string, page: number, total: number, font: string): StructureElement[] {
  const diameter = 62
  const radius = diameter / 2
  const left = 1496
  const top = 16
  const track = `M ${radius} 0 A ${radius} ${radius} 0 0 1 ${radius} ${diameter} A ${radius} ${radius} 0 0 1 ${radius} 0`
  const progress = page / total
  const angle = progress * 2 * Math.PI
  const x = radius + radius * Math.sin(angle)
  const y = radius - radius * Math.cos(angle)
  const arc = progress >= 1
    ? track
    : `M ${radius} 0 A ${radius} ${radius} 0 ${progress > 0.5 ? 1 : 0} 1 ${x} ${y}`
  const ring = (id: string, path: string, color: string): PPTShapeElement => ({
    id, type: 'shape', left, top, width: diameter, height: diameter,
    rotate: 0, lock: true, fill: '#00000000', path, viewBox: [diameter, diameter], fixedRatio: true,
    outline: { width: 4, color, style: 'solid' },
  })
  const label = String(page)
  const size = fitFont(label, 29, diameter - 10, font)
  return [
    ring(`${prefix}-progress-track`, track, '#e4e4e4'),
    ring(`${prefix}-progress-fill`, arc, MUTED_SLIDE_TEXT),
    text(`${prefix}-page`, label, left, top + radius - size * 0.6, diameter, size, {
      align: 'center', color: MUTED_SLIDE_TEXT,
    }),
  ]
}

function contents(prefix: string, sections: Section[], additional: string[], height: number, font: string,
  focus?: { sectionId?: string; childSlideId?: string }): StructureElement[] {
  const entries = sections.map((section, index) => ({ ...section, number: String(index + 1).padStart(2, '0') }))
  const seen = new Set(sections.map(section => section.title))
  for (const value of additional) {
    const title = value.trim()
    if (!title || seen.has(title)) continue
    seen.add(title)
    entries.push({ title, slideId: '', children: [], number: String(entries.length + 1).padStart(2, '0') })
  }
  if (!entries.length) return []

  const rowsWithChildren = entries.flatMap(({ sectionId, children, number, ...entry }) => {
    const focused = !!focus?.sectionId && sectionId === focus.sectionId
    const parent = { ...entry, number, nested: false, highlighted: focused && !focus?.childSlideId }
    if (!focused) return [parent]
    return [parent, ...children.map((child, index) => ({
      ...child,
      number: `${Number(number)}.${index + 1}`,
      nested: true,
      highlighted: child.slideId === focus?.childSlideId,
    }))]
  })
  const availableHeight = height - 180
  const rowsPerColumn = Math.max(1, Math.floor(availableHeight / 53))
  const columns = Math.min(2, Math.ceil(rowsWithChildren.length / rowsPerColumn))
  const rows = Math.ceil(rowsWithChildren.length / columns)
  const rowHeight = Math.min(53, availableHeight / rows)
  const columnWidth = 1420 / columns
  const labelSize = Math.min(29, rowHeight * 0.55)
  const badgeWidth = Math.min(57, columnWidth * 0.12)
  const badgeHeight = rowHeight * (40 / 53)
  return rowsWithChildren.flatMap(({ title, slideId, number, nested, highlighted }, index) => {
    const indent = nested ? 36 : 0
    const left = 100 + Math.floor(index / rows) * columnWidth + indent
    const top = 153 + (index % rows) * rowHeight
    const labelLeft = left + badgeWidth + 30
    const labelWidth = columnWidth - badgeWidth - 58 - indent
    const size = fitFont(title, labelSize, labelWidth - 8, font)
    const numberSize = fitFont(number, Math.min(23, rowHeight * 0.44), badgeWidth - 6, font)
    const link: PPTElementLink | undefined = slideId ? { type: 'slide', target: slideId } : undefined
    return [
      ...(highlighted ? [shape(`${prefix}-highlight-${index}`, left - 12, top + 2, columnWidth - 16 - indent, rowHeight - 4, PALE, 'badge')] : []),
      shape(`${prefix}-badge-${index}`, left, top + (rowHeight - badgeHeight) / 2, badgeWidth, badgeHeight, highlighted ? ACCENT : PALE, 'badge'),
      text(`${prefix}-entry-number-${index}`, number, left, top + (rowHeight - numberSize * 1.2) / 2, badgeWidth, numberSize, { align: 'center', bold: highlighted }),
      text(`${prefix}-entry-${index}`, title, labelLeft, top + (rowHeight - size * 1.2) / 2, labelWidth, size, { link, bold: highlighted }),
    ]
  })
}

function referenceFooter(prefix: string, references: NonNullable<NonNullable<Slide['structure']>['references']>, height: number, font: string) {
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
    lines = entries.map(({ text }, index) => wrapText(`[${index + 1}] ${text.trim()}`, size, width - 8, font))
    total = lines.reduce((sum, row) => sum + row.length * lineHeight, 0) + (entries.length - 1) * gap
    if (total <= availableHeight) break
    size *= Math.max(0.1, availableHeight / total) * 0.97
  } while (size > 0.1)

  let top = height - 22 - total + size * 0.1
  return lines.flatMap((row, index) => {
    const url = entries[index].url?.trim()
    const link: PPTElementLink | undefined = url && /^https?:\/\//i.test(url) ? { type: 'web', target: url } : undefined
    const result = row.map((line, lineIndex) => {
      const item = text(`${prefix}-ref-${index}-${lineIndex}`, line, 80, top, width, size, { color: MUTED_SLIDE_TEXT, link })
      top += lineHeight
      return { ...item, textType: 'footer' as const }
    })
    top += gap
    return result
  })
}

export function buildSlideStructure(slides: Slide[], viewportSize: number, ratio: number, theme: Pick<SlideTheme, 'fontName' | 'fontColor'>) {
  const sections: Section[] = []
  const sectionById = new Map<string, Section>()
  const sectionBySlideId = new Map<string, Section>()
  const childBySlideId = new Map<string, ContentsEntry>()
  const childStarts = new Map<string, ContentsEntry>()
  let activeSection: Section | undefined
  let activeChild: ContentsEntry | undefined
  for (const slide of slides) {
    if (slide.sectionTag) {
      const { id, title } = slide.sectionTag
      activeSection = { title: title?.trim() ?? '', slideId: slide.id, sectionId: id, children: [] }
      activeChild = undefined
      if (activeSection.title) {
        sections.push(activeSection)
        sectionById.set(id, activeSection)
      }
    }
    if (activeSection) {
      sectionBySlideId.set(slide.id, activeSection)
      if (slide.structure?.kind !== 'contents') {
        activeSection.firstBodySlideId ??= slide.id
        const title = slide.structure?.kind === 'standard' ? slide.structure.childTitle?.trim() : ''
        if (title) {
          activeChild = { title, slideId: slide.id }
          activeSection.children.push(activeChild)
          childStarts.set(slide.id, activeChild)
        }
        if (activeChild) childBySlideId.set(slide.id, activeChild)
      }
    }
    else if (slide.structure?.kind === 'standard') {
      const title = slide.structure.title?.trim() || slide.structure.subtitle?.trim()
      if (title) sections.push({ title, slideId: slide.id, children: [] })
    }
  }

  const mainContents = slides.find(({ structure }) => structure?.kind === 'contents' &&
    !structure.highlightSectionId && !structure.highlightChildSlideId)?.structure
  const font = theme.fontName || FONT
  const scale = viewportSize / WIDTH
  const height = WIDTH * ratio
  const elementsBySlideId: Record<string, StructureElement[]> = Object.create(null)
  slides.forEach((slide, index) => {
    const data = slide.structure
    if (!data || data.kind === 'none') return
    const prefix = `structure-${slide.id}`
    const section = sectionBySlideId.get(slide.id)
    const child = childBySlideId.get(slide.id)
    const header = data.title?.trim() || (data.kind === 'contents' ? '目次' : section?.title || '')
    const title = child && header ? `${header}/${child.title}` : header || child?.title || ''
    const size = fitFont(title, 34, 1380, font)
    const elements: StructureElement[] = [
      shape(`${prefix}-rule`, 0, 93, WIDTH, 4, ACCENT),
      ...pageProgress(prefix, index + 1, slides.length, font),
    ]
    if (title) elements.push(text(`${prefix}-title`, title, 42, 46.5 - size * 0.6, 1388, size))
    const subtitle = data.subtitle?.trim()
    if (subtitle && data.kind === 'standard') {
      const subtitleSize = fitFont(subtitle, 38, WIDTH - 118, font)
      const bannerWidth = Math.min(WIDTH, textWidth(subtitle, subtitleSize, font) + 96)
      elements.push(
        shape(`${prefix}-banner`, 0, 97, bannerWidth, 78, ACCENT, 'subtitle'),
        text(`${prefix}-subtitle`, subtitle, 48, 107 + (38 - subtitleSize) * 0.6, bannerWidth - 68, subtitleSize),
      )
    }
    if (data.kind === 'contents') {
      const child = childStarts.get(data.highlightChildSlideId ?? '')
      const focusedSection = child ? sectionBySlideId.get(child.slideId) : sectionById.get(data.highlightSectionId ?? '')
      const firstChild = focusedSection?.children[0]
      const childSlideId = child?.slideId ??
        (firstChild?.slideId === focusedSection?.firstBodySlideId ? firstChild?.slideId : undefined)
      const additional = data.additionalSections ?? ((data.highlightSectionId || data.highlightChildSlideId) ? mainContents?.additionalSections : undefined)
      elements.push(...contents(prefix, sections, additional ?? [], height, font, { sectionId: focusedSection?.sectionId, childSlideId }))
    }
    elements.push(...referenceFooter(prefix, data.references || [], height, font))
    elementsBySlideId[slide.id] = elements.map(element => ({
      ...element,
      left: element.left * scale, top: element.top * scale, width: element.width * scale, height: element.height * scale,
      ...(element.type === 'shape' && element.outline && {
        outline: { ...element.outline, width: (element.outline.width ?? 0) * scale },
      }),
      ...(element.type === 'text' && {
        defaultFontName: font,
        defaultColor: element.defaultColor === INK ? (theme.fontColor || INK) : element.defaultColor,
        content: element.content.replace(/font-size:([\d.]+)px/, (_, size) => `font-size:${Number(size) * scale}px`),
      }),
    }))
  })
  return { elementsBySlideId, sections, sectionBySlideId, childBySlideId }
}
