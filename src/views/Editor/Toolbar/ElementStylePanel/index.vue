<template>
  <div class="element-style-panel">
    <component :is="currentPanelComponent" :key="handleElement?.id"></component>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useMainStore } from '@/store'
import { ElementTypes } from '@/types/slides'

import TextTemplatePanel from './TextTemplatePanel.vue'
import TextStylePanel from './TextStylePanel.vue'
import ImageStylePanel from './ImageStylePanel.vue'
import ShapeStylePanel from './ShapeStylePanel.vue'
import LineStylePanel from './LineStylePanel.vue'
import ChartStylePanel from './ChartStylePanel/index.vue'
import TableStylePanel from './TableStylePanel.vue'
import LatexStylePanel from './LatexStylePanel.vue'
import VideoStylePanel from './VideoStylePanel.vue'
import AudioStylePanel from './AudioStylePanel.vue'

const panelMap = {
  [ElementTypes.TEXT]: TextStylePanel,
  [ElementTypes.IMAGE]: ImageStylePanel,
  [ElementTypes.SHAPE]: ShapeStylePanel,
  [ElementTypes.LINE]: LineStylePanel,
  [ElementTypes.CHART]: ChartStylePanel,
  [ElementTypes.TABLE]: TableStylePanel,
  [ElementTypes.LATEX]: LatexStylePanel,
  [ElementTypes.VIDEO]: VideoStylePanel,
  [ElementTypes.AUDIO]: AudioStylePanel,
}

const { handleElement } = storeToRefs(useMainStore())

const currentPanelComponent = computed<unknown>(() => {
  if (handleElement.value?.type === 'text' && handleElement.value.textTemplate?.kind === 'caption') return TextTemplatePanel
  return handleElement.value ? (panelMap[handleElement.value.type] || null) : null
})
</script>