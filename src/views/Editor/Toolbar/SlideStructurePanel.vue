<template>
  <div class="structure-panel" @keydown.stop @paste.stop>
    <label class="field">
      レイアウト
      <select :value="structure.kind" @change="setKind">
        <option value="none">自由配置</option>
        <option value="standard">定型ヘッダー・参考文献</option>
        <option value="contents">自動目次</option>
      </select>
    </label>

    <template v-if="structure.kind !== 'none'">
      <div class="fields">
        <label class="field">
          タイトル
          <input
            :value="structure.title"
            :placeholder="structure.kind === 'contents' ? '目次' : (section?.title || 'タイトルを入力')"
            @input="event => editText('title', event)"
            @keydown.enter="commitInput"
            @change="addHistorySnapshot"
          >
        </label>
        <label v-if="structure.kind === 'standard'" class="field">
          サブタイトル
          <input :value="structure.subtitle" @input="event => editText('subtitle', event)" @keydown.enter="commitInput" @change="addHistorySnapshot">
        </label>
        <div class="page-number">ページ番号 {{ slideIndex + 1 }}（自動）</div>
      </div>

      <div v-if="structure.kind === 'standard'" class="fields">
        <label v-if="section" class="field">
          章名（目次に反映）
          <input :value="section.title" @keydown.enter="commitInput" @change="renameSection">
        </label>
        <label v-if="section?.title" class="field">
          子タイトル（このページから開始）
          <input
            :value="structure.childTitle"
            :placeholder="childTitle || '子タイトルを入力'"
            @keydown.enter="commitInput"
            @change="setChildTitle"
          >
        </label>
        <button v-if="!currentSlide.sectionTag" type="button" class="action" @click="startSection">このページから新しい章を始める</button>
        <button v-else type="button" class="action" @click="removeSection">この章区切りを解除</button>
      </div>

      <div v-else class="fields">
        <label class="field">
          目次のフォーカス
          <select :value="contentsFocus" @change="setContentsFocus">
            <option value="">全体目次</option>
            <optgroup v-for="item in focusSections" :key="item.sectionId" :label="item.title">
              <option :value="'section:' + item.sectionId">{{ item.title }}</option>
              <option v-for="child in item.children" :key="child.slideId" :value="'child:' + child.slideId">
                {{ item.title }}/{{ child.title }}
              </option>
            </optgroup>
          </select>
        </label>
        <label v-if="!contentsFocus || structure.additionalSections !== undefined" class="field">
          目次の追加項目
          <textarea
            rows="3"
            :value="structure.additionalSections?.join('\n')"
            placeholder="スライドのない項目を1行ずつ入力"
            @input="editAdditionalSections"
            @change="addHistorySnapshot"
          ></textarea>
        </label>
      </div>

      <div class="fields">
        <div class="field-heading">参考文献</div>
        <div v-for="(reference, index) in references" :key="index" class="reference">
          <label class="field">
            {{ reference.text.trim() ? `[${referenceNumber(index)}] 文献` : '文献' }}
            <textarea
              ref="referenceInputs"
              rows="2"
              :value="reference.text"
              placeholder="文献情報を入力"
              @input="event => editReference(index, 'text', event)"
              @change="addHistorySnapshot"
            ></textarea>
          </label>
          <div class="reference-actions">
            <input
              type="url"
              :aria-label="`文献 ${index + 1} のリンク`"
              :value="reference.url"
              placeholder="URL（任意）"
              @input="event => editReference(index, 'url', event)"
              @change="addHistorySnapshot"
            >
            <button v-if="reference.text || reference.url || references.length > 1" type="button" class="action" :aria-label="`文献 ${index + 1} を削除`" @click="removeReference(index)">削除</button>
          </div>
        </div>
        <button type="button" class="action" @click="addReference">参考文献を追加</button>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, useTemplateRef } from 'vue'
import { storeToRefs } from 'pinia'
import { nanoid } from 'nanoid'
import useHistorySnapshot from '@/hooks/useHistorySnapshot'
import { useSlidesStore } from '@/store'
import type { SlideStructure } from '@/types/slides'

const slidesStore = useSlidesStore()
const { currentSlide, slideIndex, slideStructure } = storeToRefs(slidesStore)
const { addHistorySnapshot } = useHistorySnapshot()
const structure = computed<SlideStructure>(() => currentSlide.value.structure || { kind: 'none' })
const section = computed(() => slideStructure.value.sectionBySlideId.get(currentSlide.value.id))
const childTitle = computed(() => slideStructure.value.childBySlideId.get(currentSlide.value.id)?.title)
const focusSections = computed(() => slideStructure.value.sections.filter(item => item.sectionId))
const contentsFocus = computed(() => {
  const { highlightChildSlideId, highlightSectionId } = structure.value
  if (highlightChildSlideId) return `child:${highlightChildSlideId}`
  return highlightSectionId ? `section:${highlightSectionId}` : ''
})
const references = computed<NonNullable<SlideStructure['references']>>(() => {
  const list = structure.value.references
  return list?.length ? list : [{ text: '' }]
})
const referenceInputs = useTemplateRef<HTMLTextAreaElement[]>('referenceInputs')

const valueOf = (event: Event) => (event.target as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement).value
const updateStructure = (patch: Partial<SlideStructure>) => {
  slidesStore.updateSlide({ structure: { ...structure.value, ...patch } })
}

function setKind(event: Event) {
  updateStructure({ kind: valueOf(event) as SlideStructure['kind'] })
  addHistorySnapshot()
}

function commitInput(event: KeyboardEvent) {
  if (!event.isComposing) (event.target as HTMLInputElement).blur()
}

function editText(key: 'title' | 'subtitle', event: Event) {
  updateStructure({ [key]: valueOf(event) })
}

function setChildTitle(event: Event) {
  updateStructure({ childTitle: valueOf(event).trim() || undefined })
  addHistorySnapshot()
}

function setContentsFocus(event: Event) {
  const value = valueOf(event)
  updateStructure({
    highlightSectionId: value.startsWith('section:') ? value.slice('section:'.length) : undefined,
    highlightChildSlideId: value.startsWith('child:') ? value.slice('child:'.length) : undefined,
  })
  addHistorySnapshot()
}

function editAdditionalSections(event: Event) {
  updateStructure({ additionalSections: valueOf(event).split('\n') })
}

function startSection() {
  slidesStore.updateSlide({ sectionTag: { id: nanoid(10), title: structure.value.title?.trim() || structure.value.subtitle?.trim() || '新しい章' } })
  addHistorySnapshot()
}

function renameSection(event: Event) {
  if (!section.value) return
  const first = slidesStore.slides.find(slide => slide.id === section.value?.slideId)
  if (!first?.sectionTag) return
  slidesStore.updateSlide({ sectionTag: { ...first.sectionTag, title: valueOf(event).trim() } }, first.id)
  addHistorySnapshot()
}

function removeSection() {
  slidesStore.removeSlideProps({ id: currentSlide.value.id, propName: 'sectionTag' })
  addHistorySnapshot()
}

function referenceNumber(index: number) {
  return references.value.slice(0, index + 1).filter(reference => reference.text.trim()).length || 1
}

async function addReference() {
  const list = structure.value.references || []
  const last = list[list.length - 1]
  if (last?.text || last?.url) {
    updateStructure({ references: [...list, { text: '' }] })
    addHistorySnapshot()
  }
  await nextTick()
  const inputs = referenceInputs.value
  inputs?.[inputs.length - 1]?.focus()
}

function editReference(index: number, key: 'text' | 'url', event: Event) {
  updateStructure({
    references: references.value.map((reference, i) => i === index ? { ...reference, [key]: valueOf(event) } : reference),
  })
}

function removeReference(index: number) {
  updateStructure({ references: references.value.filter((_, i) => i !== index) })
  addHistorySnapshot()
}
</script>

<style scoped lang="scss">
.structure-panel, .fields, .field, .reference {
  display: grid;
  gap: 8px;
}
.fields {
  padding: 12px 0 4px;
  border-top: 1px solid $borderColor;
}
.field {
  gap: 4px;
  font-weight: 500;
}
.field-heading {
  font-weight: 600;
}
input, select, textarea {
  min-width: 0;
  width: 100%;
  padding: 6px 8px;
  border: 1px solid $borderColor;
  border-radius: $borderRadius;
  background: white;
  color: inherit;
  font: inherit;
}
textarea {
  resize: vertical;
}
.page-number {
  color: #626a70;
}
.reference-actions {
  display: flex;
  gap: 6px;
}
.action {
  justify-self: start;
  padding: 5px 8px;
  border: 1px solid $borderColor;
  border-radius: $borderRadius;
  background: white;
  color: inherit;
  white-space: nowrap;
  cursor: pointer;
}
.action:hover {
  border-color: $themeColor;
}
</style>
