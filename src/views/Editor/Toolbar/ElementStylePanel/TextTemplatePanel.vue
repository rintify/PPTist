<template>
  <div class="template-panel" @keydown.stop @paste.stop>
    <template v-if="template">
      <label>
        キャプション
        <input :value="fields.text" @keydown.enter="commitField" @change="event => editField('text', event)">
      </label>
      <label>
        出典・補足（任意）
        <input :value="fields.source" @keydown.enter="commitField" @change="event => editField('source', event)">
      </label>
      <Button @click="clearTemplate">定型を解除</Button>
    </template>
    <label v-else>
      テキストの形式
      <select value="" @change="setTemplate">
        <option value="">通常のテキスト</option>
        <option value="caption">キャプション</option>
      </select>
    </label>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useMainStore, useSlidesStore } from '@/store'
import type { PPTTextElement } from '@/types/slides'
import useHistorySnapshot from '@/hooks/useHistorySnapshot'
import Button from '@/components/Button.vue'

const main = useMainStore()
const slides = useSlidesStore()
const { addHistorySnapshot } = useHistorySnapshot()
const element = computed(() => main.handleElement as PPTTextElement)
const template = computed(() => {
  const current = element.value.textTemplate
  return current?.kind === 'caption' ? current : undefined
})

function getContent() {
  const doc = new DOMParser().parseFromString(element.value.content, 'text/html')
  const paragraphs = Array.from(doc.body.querySelectorAll('p'))
  if (paragraphs.length) return { doc, paragraphs }
  const paragraph = doc.createElement('p')
  paragraph.append(...Array.from(doc.body.childNodes))
  doc.body.appendChild(paragraph)
  return { doc, paragraphs: [paragraph] }
}

const fields = computed(() => {
  if (!template.value) return { text: '', source: '' }
  const { paragraphs } = getContent()
  const lines = paragraphs.map(p => p.textContent || '')
  return template.value.sourceLine
    ? { text: lines[0], source: lines.slice(1).join('') }
    : { text: lines.join(''), source: '' }
})

function update(props: Partial<PPTTextElement>) {
  slides.updateElement({ id: element.value.id, props })
  addHistorySnapshot()
}

function setTemplate(event: Event) {
  if ((event.target as HTMLSelectElement).value !== 'caption') return
  update({ textTemplate: { kind: 'caption', sourceLine: getContent().paragraphs.length === 2 } })
}

function clearTemplate() {
  update({ textTemplate: undefined })
}

// Keep the paragraph and inline styling while replacing the field with plain text.
function setText(paragraph: HTMLParagraphElement, value: string) {
  const walker = paragraph.ownerDocument.createTreeWalker(paragraph, NodeFilter.SHOW_TEXT)
  const first = walker.nextNode()
  if (!first) {
    paragraph.textContent = value
    return
  }
  first.nodeValue = value
  for (let node = walker.nextNode(); node; node = walker.nextNode()) node.nodeValue = ''
}

function commitField(event: KeyboardEvent) {
  if (!event.isComposing) (event.target as HTMLInputElement).blur()
}

function editField(key: 'text' | 'source', event: Event) {
  setField(key, (event.target as HTMLInputElement).value)
}

function setField(key: 'text' | 'source', value: string) {
  const current = template.value
  if (!current || value === fields.value[key]) return
  const { doc, paragraphs } = getContent()
  const [first, ...rest] = paragraphs
  if (key === 'text') {
    setText(first, value)
    if (!current.sourceLine) rest.forEach(paragraph => paragraph.remove())
    update({ content: doc.body.innerHTML })
    return
  }
  const source = rest[0] && current.sourceLine ? rest[0] : first.cloneNode(true) as HTMLParagraphElement
  if (!current.sourceLine) {
    if (!value) return
    setText(first, fields.value.text)
    doc.body.replaceChildren(first, source)
  }
  if (value) setText(source, value)
  else rest.forEach(paragraph => paragraph.remove())
  update({ content: doc.body.innerHTML, textTemplate: { ...current, sourceLine: !!value } })
}
</script>

<style scoped lang="scss">
.template-panel {
  display: grid;
  gap: 10px;
  label { display: grid; gap: 5px; }
  input, select {
    width: 100%;
    padding: 6px;
    border: 1px solid $borderColor;
    border-radius: 4px;
  }
}
</style>
