/**
 * Vite 插件：把「Markdown → HTML」接进 Vite 的生命周期
 * - config()       构建前生成所有页面，并注册成多页入口
 * - configureServer 开发时监听 content/，改 md 自动重建 + 整页刷新
 * - writeBundle    构建后补写 sitemap / robots / feed / .nojekyll
 */
import path from 'node:path'
import { ROOT, generateSite, emitStatic } from './generate.mjs'

export function cyberblog() {
  return {
    name: 'cyberblog',
    enforce: 'pre',

    config() {
      const { input } = generateSite()
      return { build: { rollupOptions: { input } } }
    },

    configureServer(server) {
      const contentDir = path.join(ROOT, 'content')
      let timer = null

      // chokidar 给回的可能是绝对路径，也可能是相对路径，统一归一化再比较
      const isContent = (file) => {
        const abs = path.resolve(ROOT, file).replace(/\\/g, '/')
        return abs.startsWith(contentDir.replace(/\\/g, '/'))
      }

      const schedule = (file) => {
        if (!isContent(file)) return
        clearTimeout(timer)
        timer = setTimeout(() => {
          const started = Date.now()
          generateSite()
          server.ws.send({ type: 'full-reload' })
          server.config.logger.info(
            `[cyberblog] ${path.relative(ROOT, file)} → rebuilt in ${Date.now() - started}ms (full reload)`
          )
        }, 120)
      }

      server.watcher.add(contentDir)
      for (const event of ['add', 'change', 'unlink']) server.watcher.on(event, schedule)
    },

    writeBundle(options) {
      emitStatic(options.dir || path.join(ROOT, 'dist'))
    },
  }
}
