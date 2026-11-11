<template>
  <Modal
    v-model:visible="visible"
    :width="880"
  >
    <LaTeXEditor
      v-if="editingLatexElement"
      :value="editingLatexElement.latex"
      :katexOptions="editingLatexElement.katex"
      @close="visible = false"
      @update="data => updateLatexData(data)"
    />
  </Modal>
</template>

<script lang="ts" setup>
import { computed, onUnmounted, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useMainStore, useSlidesStore } from '@/store'
import type { PPTLatexElement } from '@/types/slides'
import emitter, { EmitterEvents } from '@/utils/emitter'
import useHistorySnapshot from '@/hooks/useHistorySnapshot'

import LaTeXEditor from '@/components/LaTeXEditor/index.vue'
import Modal from '@/components/Modal.vue'

const mainStore = useMainStore()
const slidesStore = useSlidesStore()
const { handleElementId } = storeToRefs(mainStore)
const { currentSlide } = storeToRefs(slidesStore)

const visible = ref(false)
const editingElementId = ref('')

const editingLatexElement = computed(() => {
  const element = currentSlide.value.elements.find(item => item.id === editingElementId.value)
  return element?.type === 'latex' ? element as PPTLatexElement : null
})

watch(editingLatexElement, () => {
  if (!visible.value || editingLatexElement.value) return
  visible.value = false
  editingElementId.value = ''
})

const { addHistorySnapshot } = useHistorySnapshot()

const openLatexEditor = () => {
  const element = currentSlide.value.elements.find(item => item.id === handleElementId.value)
  if (!element || element.type !== 'latex') return

  editingElementId.value = element.id
  visible.value = true
}

const updateLatexData = (data: { path: string; latex: string; w: number; h: number }) => {
  if (!editingLatexElement.value) return

  const element = editingLatexElement.value
  const scaleX = element.katex ? element.width / element.viewBox[0] : 1
  const scaleY = element.katex ? element.height / element.viewBox[1] : 1
  slidesStore.updateElement({
    id: element.id,
    props: {
      path: data.path,
      latex: data.latex,
      width: data.w * scaleX,
      height: data.h * scaleY,
      viewBox: [data.w, data.h],
    },
  })
  addHistorySnapshot()
  visible.value = false
}

emitter.on(EmitterEvents.OPEN_LATEX_EDITOR, openLatexEditor)
onUnmounted(() => {
  emitter.off(EmitterEvents.OPEN_LATEX_EDITOR, openLatexEditor)
})
</script>
