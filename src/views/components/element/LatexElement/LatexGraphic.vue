<template>
  <KaTeXContent
    v-if="element.katex"
    :latex="element.latex"
    :display="element.katex.display"
    :style="{
      position: 'absolute',
      top: 0,
      left: 0,
      color: element.color,
      fontFamily: element.katex.fontFamily,
      fontSize: element.katex.fontSize + 'px',
      transformOrigin: 'top left',
      transform: `scale(${scaleX}, ${scaleY})`,
    }"
  />
  <svg
    v-else
    overflow="visible"
    :width="element.width"
    :height="element.height"
    :stroke="element.color"
    :stroke-width="element.strokeWidth"
    fill="none"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <path :transform="`scale(${scaleX}, ${scaleY})`" :d="element.path" />
  </svg>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import KaTeXContent from '@/components/LaTeXEditor/KaTeXContent.vue'
import type { PPTLatexElement } from '@/types/slides'

const props = defineProps<{ element: PPTLatexElement }>()
const scaleX = computed(() => props.element.width / props.element.viewBox[0])
const scaleY = computed(() => props.element.height / props.element.viewBox[1])
</script>
