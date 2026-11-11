<template>
  <div class="latex-editor">
    <div class="container">
      <div class="left">
        <div class="input-area">
          <TextArea v-model:value="latex" placeholder="LaTeX の数式を入力" ref="textAreaRef" />
        </div>
        <div class="preview">
          <div class="placeholder" v-if="!latex">数式プレビュー</div>
          <div class="preview-content" v-else>
            <KaTeXContent
              v-if="katexOptions"
              ref="katexPreview"
              :latex="latex"
              :display="katexOptions.display"
              :style="{ fontSize: katexOptions.fontSize + 'px', fontFamily: katexOptions.fontFamily }"
            />
            <FormulaContent
              v-else
              :width="518"
              :height="138"
              :latex="latex"
            />
          </div>
        </div>
      </div>
      <div class="right">
        <Tabs 
          :tabs="tabs" 
          v-model:value="toolbarState" 
          card
        />
        <div class="content">
          <div class="symbol" v-if="toolbarState === 'symbol'">
            <Tabs 
              :tabs="symbolTabs" 
              v-model:value="selectedSymbolKey" 
              spaceBetween 
              :tabsStyle="{ margin: '10px 10px 0' }" 
            />
            <div class="symbol-pool">
              <div class="symbol-item" v-for="item in symbolPool" :key="item.latex" @click="insertSymbol(item.latex)">
                <SymbolContent :latex="item.latex" />
              </div>
            </div>
          </div>
          <div class="formula" v-else>
            <Tabs
              :tabs="formulaTabs"
              v-model:value="selectedFormulaKey"
              spaceBetween
              :tabsStyle="{ margin: '10px 10px 0' }"
            />
            <div class="formula-pool" :key="selectedFormulaKey">
              <div class="formula-section" v-for="section in formulaSections" :key="section.label">
                <div class="formula-section-title" v-if="section.label">{{section.label}}</div>
                <div class="formula-item" v-for="item in section.children" :key="item.label">
                  <div class="formula-title">{{item.label}}</div>
                  <div class="formula-item-content" @click="latex = item.latex">
                    <FormulaContent
                      :width="236"
                      :height="60"
                      :latex="item.latex"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="footer">
      <Button class="btn" @click="emit('close')">キャンセル</Button>
      <Button class="btn" type="primary" @click="update()">OK</Button>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, onMounted, ref, useTemplateRef } from 'vue'
import { hfmath } from './hfmath'
import katex from 'katex'
import type { PPTLatexElement } from '@/types/slides'
import KaTeXContent from './KaTeXContent.vue'
import { FORMULA_LIST, SYMBOL_LIST, type FormulaPreset } from '@/configs/latex'
import message from '@/utils/message'

import FormulaContent from './FormulaContent.vue'
import SymbolContent from './SymbolContent.vue'
import Button from '../Button.vue'
import TextArea from '../TextArea.vue'
import Tabs from '../Tabs.vue'

interface TabItem {
  key: 'symbol' | 'formula'
  label: string
}

const tabs: TabItem[] = [
  { label: 'よく使う記号', key: 'symbol' },
  { label: '数式テンプレート', key: 'formula' },
]

interface LatexResult {
  latex: string
  path: string
  w: number
  h: number
}

const props = withDefaults(defineProps<{
  value?: string
  katexOptions?: PPTLatexElement['katex']
}>(), {
  value: '',
})

const emit = defineEmits<{
  (event: 'update', payload: LatexResult): void
  (event: 'close'): void
}>()

const formulaTabs = FORMULA_LIST.map(item => ({
  label: item.label,
  key: item.type,
}))

const symbolTabs = SYMBOL_LIST.map(item => ({
  label: item.label,
  key: item.type,
}))

const latex = ref('')
const katexPreview = useTemplateRef<InstanceType<typeof KaTeXContent>>('katexPreview')
const toolbarState = ref<'symbol' | 'formula'>('symbol')
const textAreaRef = useTemplateRef<InstanceType<typeof TextArea>>('textAreaRef')

const selectedFormulaKey = ref(FORMULA_LIST[0].type)
const formulaSections = computed(() => {
  const selectedFormula = FORMULA_LIST.find(item => item.type === selectedFormulaKey.value)
  const sections: {label: string; children: FormulaPreset[]}[] = []
  for (const formula of selectedFormula?.children || []) {
    const label = formula.category || ''
    let section = sections[sections.length - 1]
    if (!section || section.label !== label) {
      section = {label, children: []}
      sections.push(section)
    }
    section.children.push(formula)
  }
  return sections
})

const selectedSymbolKey = ref(SYMBOL_LIST[0].type)
const symbolPool = computed(() => {
  const selectedSymbol = SYMBOL_LIST.find(item => item.type === selectedSymbolKey.value)
  return selectedSymbol?.children || []
})

onMounted(() => {
  if (props.value) latex.value = props.value
  setTimeout(() => {
    textAreaRef.value && textAreaRef.value.focus()
  }, 0)
})

const update = async () => {
  if (!latex.value) return message.error('数式を入力してください')

  if (props.katexOptions) {
    try {
      katex.renderToString(latex.value, { displayMode: props.katexOptions.display })
    }
    catch {
      return message.error('LaTeX の記述を確認してください')
    }
    await document.fonts.ready
    const box = (katexPreview.value?.$el as HTMLElement | undefined)?.getBoundingClientRect()
    if (!box) return
    emit('update', { latex: latex.value, path: '', w: box.width, h: box.height })
    return
  }

  const eq = new hfmath(latex.value)
  const pathd = eq.pathd({})
  const box = eq.box({})
  
  emit('update', {
    latex: latex.value,
    path: pathd,
    w: box.w + 32,
    h: box.h + 32,
  })
}

const insertSymbol = (latex: string) => {
  if (!textAreaRef.value) return
  textAreaRef.value.focus()
  document.execCommand('insertText', false, latex)
}
</script>

<style lang="scss" scoped>
.latex-editor {
  height: 560px;
}
.container {
  height: calc(100% - 50px);
  display: flex;
}
.left {
  width: 540px;
  height: 100%;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
}
.input-area {
  flex: 1;

  textarea {
    height: 100% !important;
    border-color: $borderColor !important;
    padding: 10px !important;
    font-family: SFMono-Regular, Consolas, 'Liberation Mono', Menlo, Courier, monospace;

    &:focus {
      box-shadow: none !important;
    }
  }
}
.preview {
  height: 160px;
  display: flex;
  justify-content: center;
  align-items: center;
  text-align: center;
  margin-top: 20px;
  border: 1px solid $borderColor;
  user-select: none;
  border-radius: $borderRadius;
}
.placeholder {
  color: #888;
  font-size: 13px;
}
.preview-content {
  width: 100%;
  height: 100%;
  padding: 10px;
  display: flex;
  justify-content: center;
  align-items: center;

  &:has(.katex-content) {
    overflow: auto;
    justify-content: safe center;
    align-items: safe center;
  }
}
.right {
  width: 280px;
  height: 100%;
  margin-left: 20px;
  border: solid 1px $borderColor;
  background-color: #fff;
  display: flex;
  flex-direction: column;
  user-select: none;
  border-radius: $borderRadius;
  overflow: hidden;
}
.content {
  height: calc(100% - 40px);
  font-size: 13px;
}
.formula {
  height: 100%;
  display: flex;
  flex-direction: column;
}
.formula-pool {
  flex: 1;
  min-height: 0;
  padding: 12px;

  @include overflow-overlay();
}
.formula-section {
  & + .formula-section {
    margin-top: 20px;
  }
}
.formula-section-title {
  margin-bottom: 10px;
  padding-bottom: 6px;
  border-bottom: 1px solid $borderColor;
  font-weight: 600;
}
.formula-item {
  & + .formula-item {
    margin-top: 10px;
  }

  .formula-title {
    margin-bottom: 5px;
  }
  .formula-item-content {
    height: 60px;
    padding: 5px;
    display: flex;
    align-items: center;
    background-color: $lightGray;
    border-radius: $borderRadius;
    cursor: pointer;
  }
}
.symbol {
  height: 100%;
  display: flex;
  flex-direction: column;
}
.symbol-pool {
  display: flex;
  flex-wrap: wrap;
  flex: 1;
  padding: 12px;

  @include overflow-overlay();
}
.symbol-item {
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: $borderRadius;

  &:hover {
    background-color: $lightGray;
    cursor: pointer;
  }
}
.footer {
  height: 50px;
  display: flex;
  justify-content: flex-end;
  align-items: flex-end;

  .btn {
    margin-left: 10px;
  }
}
</style>
