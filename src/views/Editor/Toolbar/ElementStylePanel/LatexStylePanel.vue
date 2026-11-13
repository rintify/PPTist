<template>
  <div class="latex-style-panel">
    <div class="formula-source" @keydown.stop @paste.stop>
      <label>
        数式ソース（LaTeX）
        <textarea
          :key="handleLatexElement.id"
          :value="handleLatexElement.latex"
          rows="5"
          spellcheck="false"
          @change="changeSource"
          @keydown.esc.stop="resetSource"
          @keydown.meta.enter.prevent="commitField"
          @keydown.ctrl.enter.prevent="commitField"
        ></textarea>
      </label>
      <label v-for="(field, index) in formulaTextFields" :key="index">
        数式内の文字{{ formulaTextFields.length > 1 ? ' ' + (index + 1) : '' }}
        <input :value="field.text" @keydown.enter="commitField" @change="event => changeFormulaText(field, event)">
      </label>
    </div>
    <div class="row">
      <Button style="flex: 1;" @click="openLatexEditor()"><i-icon-park-outline:edit /> 記号・テンプレート</Button>
    </div>

    <Divider />

    <div class="row">
      <div style="width: 40%;">色：</div>
      <Popover trigger="click" style="width: 60%;">
        <template #content>
          <ColorPicker
            :modelValue="handleLatexElement.color"
            @update:modelValue="value => updateLatex({ color: value })"
          />
        </template>
        <ColorButton :color="handleLatexElement.color" />
      </Popover>
    </div>
    <div class="row">
      <div style="width: 40%;">太さ：</div>
      <NumberInput 
        :min="1"
        :max="3"
        :value="handleLatexElement.strokeWidth" 
        @update:value="value => updateLatex({ strokeWidth: value })" 
        style="width: 60%;" 
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, type Ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useMainStore, useSlidesStore } from '@/store'
import type { PPTLatexElement } from '@/types/slides'
import emitter, { EmitterEvents } from '@/utils/emitter'
import { getFormulaTextFields, replaceFormulaText, updateFormulaSource } from '@/utils/formulaSource'
import message from '@/utils/message'
import useHistorySnapshot from '@/hooks/useHistorySnapshot'

import ColorButton from '@/components/ColorButton.vue'
import ColorPicker from '@/components/ColorPicker/index.vue'
import Divider from '@/components/Divider.vue'
import Button from '@/components/Button.vue'
import NumberInput from '@/components/NumberInput.vue'
import Popover from '@/components/Popover.vue'

const slidesStore = useSlidesStore()
const { handleElement } = storeToRefs(useMainStore())

const handleLatexElement = handleElement as Ref<PPTLatexElement>

const { addHistorySnapshot } = useHistorySnapshot()

const updateLatex = (props: Partial<PPTLatexElement>) => {
  if (!handleElement.value) return
  slidesStore.updateElement({ id: handleElement.value.id, props })
  addHistorySnapshot()
}

const formulaTextFields = computed(() => getFormulaTextFields(handleLatexElement.value.latex))

function applySource(source: string) {
  const element = handleLatexElement.value
  if (source === element.latex) return true
  try {
    updateLatex(updateFormulaSource(element, source))
    return true
  }
  catch {
    message.error('LaTeX の記述を確認してください')
    return false
  }
}

function changeSource(event: Event) {
  const input = event.target as HTMLTextAreaElement
  if (!applySource(input.value)) input.value = handleLatexElement.value.latex
}

function commitField(event: KeyboardEvent) {
  if (!event.isComposing) (event.target as HTMLElement).blur()
}

function resetSource(event: KeyboardEvent) {
  if (!event.isComposing) (event.target as HTMLTextAreaElement).value = handleLatexElement.value.latex
}

function changeFormulaText(field: ReturnType<typeof getFormulaTextFields>[number], event: Event) {
  const input = event.target as HTMLInputElement
  const source = replaceFormulaText(handleLatexElement.value.latex, field, input.value)
  if (!applySource(source)) input.value = field.text
}

const openLatexEditor = () => emitter.emit(EmitterEvents.OPEN_LATEX_EDITOR)
</script>

<style lang="scss" scoped>
.formula-source {
  display: grid;
  gap: 10px;
  margin-bottom: 12px;

  label { display: grid; gap: 5px; }
  textarea, input {
    width: 100%;
    padding: 6px;
    border: 1px solid $borderColor;
    border-radius: 4px;
  }
  textarea {
    resize: vertical;
    font-family: monospace;
  }
}
.row {
  width: 100%;
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}
</style>
