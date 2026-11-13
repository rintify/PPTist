<template>
  <div class="export-pptx-dialog">
    <div class="thumbnails-view">
      <div ref="imageThumbnailsRef">
        <ThumbnailSlide
          v-if="renderedSlide"
          :key="renderedSlide.id"
          :slide="renderedSlide"
          :size="1600"
        />
      </div>
    </div>
    <div class="configs">
      <div class="row">
        <div class="title">出力範囲：</div>
        <RadioGroup
          class="config-item"
          v-model:value="rangeType"
        >
          <RadioButton style="width: 33.33%;" value="all">すべて</RadioButton>
          <RadioButton style="width: 33.33%;" value="current">現在のページ</RadioButton>
          <RadioButton style="width: 33.33%;" value="custom">カスタム</RadioButton>
        </RadioGroup>
      </div>
      <div class="row">
        <div class="title">出力モード：</div>
        <RadioGroup
          class="config-item"
          v-model:value="exportMode"
        >
          <RadioButton style="width: 50%;" value="standard">標準</RadioButton>
          <RadioButton style="width: 50%;" value="image">画像（余白なし）</RadioButton>
        </RadioGroup>
      </div>
      <div class="row" style="margin-bottom: 32px" v-if="rangeType === 'custom'">
        <div class="title" :data-range="`（${range[0]} ~ ${range[1]}）`">範囲を指定：</div>
        <Slider
          class="config-item"
          range
          :min="1"
          :max="slides.length"
          :step="1"
          v-model:value="range"
        />
      </div>
      
      <template v-if="exportMode === 'standard'">
        <div class="row">
          <div class="title">音声・動画を省略：</div>
          <div class="config-item">
            <Switch v-model:value="ignoreMedia" v-tooltip="'音声・動画を含めると書き出しに時間がかかります。PPTX に含めるには「音声・動画を省略」をオフにしてください'" />
          </div>
        </div>
        <div class="row">
          <div class="title">既定のマスターを上書き：</div>
          <div class="config-item">
            <Switch v-model:value="masterOverwrite" />
          </div>
        </div>

        <div class="tip" v-if="!ignoreMedia">
          書き出せる形式は AVI、MP4、MOV、WMV、MP3、WAV です。別のオリジンにあるファイルは書き出せません
        </div>
      </template>
      <div class="tip" v-else>
        各ページをPNG画像にして、スライド全面に配置します。
      </div>
    </div>
    <div class="btns">
      <Button class="btn export" type="primary" @click="execExport()"><i-icon-park-outline:download /> PPTX を書き出す</Button>
      <Button class="btn close" @click="emit('close')">閉じる</Button>
    </div>

    <FullscreenSpin :loading="exporting" :tip="exportTip" />
  </div>
</template>

<script lang="ts" setup>
import { computed, nextTick, ref, shallowRef, useTemplateRef } from 'vue'
import { storeToRefs } from 'pinia'
import { useSlidesStore } from '@/store'
import type { Slide } from '@/types/slides'
import useExport from '@/hooks/useExport'

import ThumbnailSlide from '@/views/components/ThumbnailSlide/index.vue'
import FullscreenSpin from '@/components/FullscreenSpin.vue'
import Switch from '@/components/Switch.vue'
import Slider from '@/components/Slider.vue'
import Button from '@/components/Button.vue'
import RadioButton from '@/components/RadioButton.vue'
import RadioGroup from '@/components/RadioGroup.vue'

const emit = defineEmits<{
  (event: 'close'): void
}>()

const { slides, currentSlide } = storeToRefs(useSlidesStore())

const { exportPPTX, exportImagePPTX, exporting } = useExport()

const imageThumbnailsRef = useTemplateRef<HTMLElement>('imageThumbnailsRef')
const rangeType = ref<'all' | 'current' | 'custom'>('all')
const exportMode = ref<'standard' | 'image'>('standard')
const range = ref<[number, number]>([1, slides.value.length])
const masterOverwrite = ref(true)
const ignoreMedia = ref(true)
const renderedSlide = shallowRef<Slide | null>(null)
const exportTip = ref('書き出し中…')

const selectedSlides = computed(() => {
  if (rangeType.value === 'all') return slides.value
  if (rangeType.value === 'current') return [currentSlide.value]
  return slides.value.filter((item, index) => {
    const [min, max] = range.value
    return index >= min - 1 && index <= max - 1
  })
})

const execExport = async () => {
  if (exporting.value) return
  if (exportMode.value === 'standard') {
    await exportPPTX(selectedSlides.value, masterOverwrite.value, ignoreMedia.value)
    return
  }

  const slidesToExport = [...selectedSlides.value]
  try {
    await exportImagePPTX(slidesToExport, async (slide, page) => {
      exportTip.value = `書き出し中…（${page} / ${slidesToExport.length}）`
      renderedSlide.value = slide
      await nextTick()
      const thumbnail = imageThumbnailsRef.value?.firstElementChild
      if (!(thumbnail instanceof HTMLElement)) throw new Error('Slide preview is unavailable')
      return thumbnail
    })
  }
  finally {
    renderedSlide.value = null
    exportTip.value = '書き出し中…'
  }
}
</script>

<style lang="scss" scoped>
.export-pptx-dialog {
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  position: relative;
  overflow: hidden;
}
.thumbnails-view {
  @include absolute-0();

  &::after {
    content: '';
    background-color: #fff;
    @include absolute-0();
  }
}
.configs {
  width: 350px;
  height: calc(100% - 80px);
  display: flex;
  flex-direction: column;
  justify-content: center;
  z-index: 1;

  .row {
    display: flex;
    justify-content: center;
    align-items: center;
    margin-bottom: 25px;
  }

  .title {
    width: 100px;
    position: relative;

    &::after {
      content: attr(data-range);
      position: absolute;
      top: 20px;
      left: 0;
    }
  }
  .config-item {
    flex: 1;
  }

  .tip {
    font-size: 12px;
    color: #aaa;
    line-height: 1.8;
    margin-top: 10px;
  }
}
.btns {
  width: 300px;
  height: 80px;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1;

  .export {
    flex: 1;
  }
  .close {
    width: 100px;
    margin-left: 10px;
  }
}
</style>
