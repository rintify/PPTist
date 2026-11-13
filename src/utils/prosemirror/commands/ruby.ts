import type { Mark } from 'prosemirror-model'
import { TextSelection, type EditorState } from 'prosemirror-state'

export function getRubySelection(state: EditorState) {
  const { selection, doc, schema } = state
  if (!(selection instanceof TextSelection) || !selection.$from.sameParent(selection.$to)) return
  const { $from, from, to, empty } = selection
  const runs: { from: number; to: number; mark: Mark }[] = []
  $from.parent.forEach((node, offset) => {
    const mark = node.marks.find(item => item.type === schema.marks.ruby)
    if (!mark || !node.isText) return
    const start = $from.start() + offset
    const end = start + node.nodeSize
    const previous = runs[runs.length - 1]
    if (previous?.to === start && previous.mark.eq(mark)) previous.to = end
    else runs.push({ from: start, to: end, mark })
  })

  const touched = runs.filter(run => empty ? run.from <= from && from < run.to : run.from < to && run.to > from)
  if (empty && !touched.length) return
  const start = Math.min(from, touched[0]?.from ?? from)
  const end = Math.max(to, touched[touched.length - 1]?.to ?? to)
  const text = doc.textBetween(start, end, '\n', '\n')
  if (!text.trim() || text.includes('\n')) return

  const existing = touched.length === 1 && touched[0].from === start && touched[0].to === end ? touched[0].mark : undefined
  return { from: start, to: end, text, reading: existing?.attrs.reading ?? '', existing }
}
