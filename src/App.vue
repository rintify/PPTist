<template>
  <template v-if="slides.length">
    <Screen v-if="screening" />
    <Editor v-else-if="_isPC" />
    <Mobile v-else />
  </template>
  <FullscreenSpin tip="数据初始化中，请稍等 ..." v-else  loading :mask="false" />
</template>

<script lang="ts" setup>
import { onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { nanoid } from 'nanoid'
import { useScreenStore, useMainStore, useSnapshotStore, useSlidesStore } from '@/store'
import { LOCALSTORAGE_KEY_DISCARDED_DB } from '@/configs/storage'
import { deleteDiscardedDB } from '@/utils/database'
import { isPC } from '@/utils/common'
import api from '@/services'
import { decrypt } from '@/utils/crypto'
import message from '@/utils/message'
import type { Slide, SlideTheme } from '@/types/slides'

import Editor from './views/Editor/index.vue'
import Screen from './views/Screen/index.vue'
import Mobile from './views/Mobile/index.vue'
import FullscreenSpin from '@/components/FullscreenSpin.vue'

const _isPC = isPC()

const mainStore = useMainStore()
const slidesStore = useSlidesStore()
const snapshotStore = useSnapshotStore()
const screenStore = useScreenStore()
const { databaseId } = storeToRefs(mainStore)
const { slides } = storeToRefs(slidesStore)
const { screening } = storeToRefs(screenStore)

const isAudienceMode = new URLSearchParams(window.location.search).get('mode') === 'audience'

if (import.meta.env.MODE !== 'development') {
  window.onbeforeunload = () => false
}

const loadStartupProject = async () => {
  const path = import.meta.env.VITE_PPTIST_STARTUP_PROJECT
  if (!path) return false

  try {
    const url = new URL(path, window.location.href)
    if (url.origin !== window.location.origin) throw new Error('Expected a local project')
    const response = await fetch(url)
    if (!response.ok) throw new Error('Project could not be opened')

    const { slides, theme, title, width, height } = JSON.parse(decrypt(await response.text())) as {
      slides: Slide[]
      theme?: Partial<SlideTheme>
      title?: string
      width?: number
      height?: number
    }
    if (!Array.isArray(slides) || !slides.length) throw new Error('Project has no slides')

    slidesStore.setSlides(slides, theme)
    if (title) slidesStore.setTitle(title)
    if (width && height) {
      slidesStore.setViewportSize(width)
      slidesStore.setViewportRatio(height / width)
    }
    return true
  }
  catch {
    message.error('无法打开启动演示文稿')
    return false
  }
}

onMounted(async () => {
  if (isAudienceMode) {
    slidesStore.setSlides([{
      id: nanoid(10),
      elements: [],
    }])
    screenStore.setScreening(true)
  }
  else {
    if (!await loadStartupProject()) {
      const slides = await api.getMockData('slides')
      slidesStore.setSlides(slides)
    }

    await deleteDiscardedDB()
    snapshotStore.initSnapshotDatabase()
  }
})

// 应用注销时向 localStorage 中记录下本次 indexedDB 的数据库ID，用于之后清除数据库
window.addEventListener('beforeunload', () => {
  const discardedDB = localStorage.getItem(LOCALSTORAGE_KEY_DISCARDED_DB)
  const discardedDBList: string[] = discardedDB ? JSON.parse(discardedDB) : []

  discardedDBList.push(databaseId.value)

  const newDiscardedDB = JSON.stringify(discardedDBList)
  localStorage.setItem(LOCALSTORAGE_KEY_DISCARDED_DB, newDiscardedDB)
})
</script>

<style lang="scss">
#app {
  height: 100%;
}
</style>