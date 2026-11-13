import { ref, computed, onMounted, onUnmounted, watch, type ShallowRef } from 'vue'
import { storeToRefs } from 'pinia'
import { useMainStore, useSlidesStore } from '@/store'

export default (canvasRef: ShallowRef<HTMLElement | null>) => {
  const viewportLeft = ref(0)
  const viewportTop = ref(0)

  const mainStore = useMainStore()
  const { canvasPercentage, canvasDragged } = storeToRefs(mainStore)
  const { viewportRatio, viewportSize } = storeToRefs(useSlidesStore())

  const getScale = (canvas: HTMLElement, percentage: number) => {
    const fitWidth = Math.min(canvas.clientWidth, canvas.clientHeight / viewportRatio.value)
    return fitWidth / viewportSize.value * percentage / 100
  }

  const initViewportPosition = () => {
    const canvas = canvasRef.value
    if (!canvas) return
    const scale = getScale(canvas, canvasPercentage.value)
    mainStore.setCanvasScale(scale)
    viewportLeft.value = (canvas.clientWidth - viewportSize.value * scale) / 2
    viewportTop.value = (canvas.clientHeight - viewportSize.value * viewportRatio.value * scale) / 2
  }

  let zoomAnchor: { x: number; y: number } | undefined

  watch(canvasPercentage, (percentage, previous) => {
    const canvas = canvasRef.value
    if (!canvas) return
    const oldScale = getScale(canvas, previous)
    const newScale = getScale(canvas, percentage)
    if (oldScale > 0) {
      const x = zoomAnchor?.x ?? viewportLeft.value + viewportSize.value * oldScale / 2
      const y = zoomAnchor?.y ?? viewportTop.value + viewportSize.value * viewportRatio.value * oldScale / 2
      const ratio = newScale / oldScale
      viewportLeft.value = x + (viewportLeft.value - x) * ratio
      viewportTop.value = y + (viewportTop.value - y) * ratio
    }
    mainStore.setCanvasScale(newScale)
  }, { flush: 'sync' })

  const zoomViewportAt = (percentage: number, clientX: number, clientY: number) => {
    const canvas = canvasRef.value
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    zoomAnchor = { x: clientX - rect.left, y: clientY - rect.top }
    try {
      mainStore.setCanvasPercentage(percentage)
    }
    finally {
      zoomAnchor = undefined
    }
  }

  const panViewport = (deltaX: number, deltaY: number) => {
    if (!deltaX && !deltaY) return
    viewportLeft.value -= deltaX
    viewportTop.value -= deltaY
    mainStore.setCanvasDragged(true)
  }

  watch(viewportRatio, initViewportPosition)
  watch(viewportSize, initViewportPosition)

  // 画布拖拽状态改变（复原）时，重置可视区域的位置
  watch(canvasDragged, () => {
    if (!canvasDragged.value) initViewportPosition()
  })

  // 画布可视区域位置和大小的样式
  const viewportStyles = computed(() => ({
    width: viewportSize.value,
    height: viewportSize.value * viewportRatio.value,
    left: viewportLeft.value,
    top: viewportTop.value,
  }))

  // 监听画布尺寸发生变化时，重置可视区域的位置
  const resizeObserver = new ResizeObserver(initViewportPosition)

  onMounted(() => {
    if (canvasRef.value) resizeObserver.observe(canvasRef.value)
  })
  onUnmounted(() => {
    if (canvasRef.value) resizeObserver.unobserve(canvasRef.value)
  })

  // 拖拽画布
  const dragViewport = (e: MouseEvent) => {
    let isMouseDown = true

    const startPageX = e.pageX
    const startPageY = e.pageY

    const originLeft = viewportLeft.value
    const originTop = viewportTop.value

    document.onmousemove = e => {
      if (!isMouseDown) return

      const currentPageX = e.pageX
      const currentPageY = e.pageY

      viewportLeft.value = originLeft + (currentPageX - startPageX)
      viewportTop.value = originTop + (currentPageY - startPageY)
    }

    document.onmouseup = () => {
      isMouseDown = false
      document.onmousemove = null
      document.onmouseup = null

      mainStore.setCanvasDragged(true)
    }
  }

  return {
    viewportStyles,
    zoomViewportAt,
    panViewport,
    dragViewport,
  }
}