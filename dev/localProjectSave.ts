import { createHash, randomUUID } from 'node:crypto'
import { readFile, realpath, rename, rm, writeFile } from 'node:fs/promises'
import { basename, dirname, join } from 'node:path'
import type { Plugin } from 'vite'

const endpoint = '/__pptist/local-project'
const maxBytes = 64 * 1024 * 1024
const digest = (data: Buffer) => createHash('sha256').update(data).digest('hex')

export default function localProjectSave(): Plugin {
  return {
    name: 'pptist-local-project-save',
    apply: 'serve',
    configureServer(server) {
      const project = server.config.env.VITE_PPTIST_STARTUP_PROJECT
      // Only a configured project in the local-projects directory can be saved.
      if (!server.config.publicDir || !/^\.?\/?local-projects\/[\w.-]+\.pptist$/.test(project || '')) return
      const configuredPath = join(server.config.publicDir, 'local-projects', basename(project))
      let writing = false

      server.middlewares.use((req, res, next) => {
        if (req.url !== endpoint) return next()
        const finish = (status: number) => {
          res.statusCode = status
          res.end()
        }
        const host = req.headers.host
        if (!host || !/^(127\.0\.0\.1|localhost|\[::1\])(:\d+)?$/.test(host) ||
          req.headers.origin !== `http://${host}` || req.headers['sec-fetch-site'] !== 'same-origin') return finish(403)
        if (req.method !== 'PUT' || req.headers['content-type'] !== 'application/octet-stream') return finish(405)
        const expected = req.headers['if-match']
        if (typeof expected !== 'string' || !/^"[a-f0-9]{64}"$/.test(expected)) return finish(428)

        const save = async () => {
          const chunks: Buffer[] = []
          let size = 0
          for await (const chunk of req.iterator({ destroyOnReturn: false })) {
            size += chunk.length
            if (size > maxBytes) {
              req.resume()
              return finish(413)
            }
            chunks.push(chunk)
          }
          const data = Buffer.concat(chunks, size)
          if (!data.subarray(0, 10).equals(Buffer.from('U2FsdGVkX1'))) return finish(400)
          if (writing) return finish(409)
          writing = true
          let temp: string | undefined
          try {
            // Follow the project symlink and replace the file on its own volume.
            const target = await realpath(configuredPath)
            if (`"${digest(await readFile(target))}"` !== expected) return finish(409)
            temp = join(dirname(target), `.${basename(target)}.${randomUUID()}.tmp`)
            await writeFile(temp, data, { flag: 'wx', mode: 0o600 })
            await rename(temp, target)
            temp = undefined
            res.setHeader('ETag', `"${digest(data)}"`)
            finish(204)
          }
          finally {
            writing = false
            if (temp) await rm(temp, { force: true })
          }
        }
        void save().catch(() => finish(500))
      })
    },
  }
}
