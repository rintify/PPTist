import { storeToRefs } from 'pinia'
import { saveAs } from 'file-saver'
import { useSlidesStore } from '@/store'
import { createPptistFile } from '@/utils/pptistFile'
import message from '@/utils/message'

export async function getProjectRevision(contents: string) {
  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(contents))
  return '"' + Array.from(new Uint8Array(hash), byte => byte.toString(16).padStart(2, '0')).join('') + '"'
}

let saving = false

export default function useProjectSave() {
  const project = useSlidesStore()
  const { localProjectRevision } = storeToRefs(project)

  const saveProject = async () => {
    if (saving) return
    saving = true
    try {
      // Commit inputs that update the document on blur or change.
      if (document.activeElement instanceof HTMLElement) document.activeElement.blur()
      const contents = createPptistFile(project)
      if (!localProjectRevision.value) {
        saveAs(new Blob([contents]), `${project.title}.pptist`)
        return
      }
      const response = await fetch('/__pptist/local-project', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/octet-stream', 'If-Match': localProjectRevision.value },
        body: contents,
      })
      if (response.status === 409) {
        message.error('プロジェクトファイルが別の場所で更新されました。編集内容を残すには PPTist 形式で書き出してください。')
        return
      }
      const revision = response.headers.get('ETag')
      if (response.status !== 204 || !revision) throw new Error('Project save failed')
      localProjectRevision.value = revision
      message.success('ローカルのプロジェクトファイルに保存しました')
    }
    catch {
      message.error('保存できませんでした。編集内容を残すには PPTist 形式で書き出してください。')
    }
    finally {
      saving = false
    }
  }

  return { saveProject }
}
