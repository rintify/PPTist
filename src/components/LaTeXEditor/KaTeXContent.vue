<template>
  <span class="katex-content" v-html="content"></span>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import katex from 'katex'
import 'katex/dist/katex.min.css'

const props = defineProps<{ latex: string; display: boolean }>()
const content = computed(() => katex.renderToString(props.latex, {
  displayMode: props.display,
  throwOnError: false,
  trust: false,
}))
</script>

<style scoped>
.katex-content {
  display: inline-block;
  line-height: normal;
  width: max-content;
  flex-shrink: 0;
  white-space: nowrap;
}
.katex-content :deep(.katex) {
  font-size: 1em;
}
.katex-content :deep(.katex-display) {
  margin: 0;
}
</style>
