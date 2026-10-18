import { realpathSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import { cyberblog } from './scripts/vite-plugin-blog.mjs'

/**
 * 为什么显式指定 root：
 * 若项目放在软链接/目录联结（junction）下，process.cwd() 与真实路径可能不在同一个盘符，
 * Vite 内部用 path.relative(root, 入口文件) 计算产物名时会得到绝对路径而报错。
 * 统一取 realpath 即可两边一致。
 */
const root = realpathSync(path.dirname(fileURLToPath(import.meta.url)))

/**
 * 部署到 https://<user>.github.io/<repo>/ 时，用 BASE=repo npm run build
 * （只写仓库名，不要带斜杠——Windows 的 Git Bash 会把以 / 开头的值当成路径转换掉）
 * 其余静态托管（Netlify / Vercel / Cloudflare / 自有域名根目录）保持默认即可
 */
const repo = (process.env.BASE || '').replace(/^\/+|\/+$/g, '')

export default defineConfig({
  root,
  base: repo ? `/${repo}/` : '/',
  appType: 'mpa',
  plugins: [cyberblog()],
  server: {
    port: 4321,
    strictPort: true,
  },
  preview: {
    port: 4321,
    strictPort: true,
  },
  build: {
    target: 'es2020',
    cssCodeSplit: false,
    assetsInlineLimit: 4096,
    reportCompressedSize: true,
    rollupOptions: {
      output: {
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]',
      },
    },
  },
})
