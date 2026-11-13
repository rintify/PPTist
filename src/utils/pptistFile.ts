import type { useSlidesStore } from '@/store'
import type { Slide } from '@/types/slides'
import { encrypt } from '@/utils/crypto'

export function createPptistFile(project: ReturnType<typeof useSlidesStore>, slides: Slide[] = project.slides) {
  return encrypt(JSON.stringify({
    title: project.title,
    width: project.viewportSize,
    height: project.viewportSize * project.viewportRatio,
    theme: project.theme,
    slides,
  }))
}
