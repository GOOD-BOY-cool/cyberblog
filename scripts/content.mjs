/**
 * 内容层：读 content/*.md → 一组结构化文章对象
 * 构建期执行，浏览器里没有任何解析逻辑
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import matter from 'gray-matter'
import { renderMarkdown } from './markdown.mjs'
import { SITE } from './site.config.mjs'

export const ROOT = fs.realpathSync(
  path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
)
const CONTENT_DIR = path.join(ROOT, 'content')

/**
 * 统一日期为 YYYY-MM-DD。
 * 注意：gray-matter 底层是 js-yaml，`date: 2026-09-28` 这种 ISO 写法会被解析成 Date 对象，
 * 直接 String() 会得到 "Mon Sep 28 2026 ..."，排序和分组都会错。这里统一归一化。
 */
function normalizeDate(value) {
  if (!value) return '2026-01-01'
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    // YAML 的纯日期按 UTC 零点解析，用 UTC 取值可以拿回作者写的日期
    const y = value.getUTCFullYear()
    const m = String(value.getUTCMonth() + 1).padStart(2, '0')
    const d = String(value.getUTCDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  }
  const text = String(value).trim()
  const hit = /^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/.exec(text)
  if (hit) return `${hit[1]}-${hit[2].padStart(2, '0')}-${hit[3].padStart(2, '0')}`
  return text.slice(0, 10)
}

/** 阅读时长：中文按 350 字/分钟，英文按 200 词/分钟 */
function readingTime(text) {
  const zh = (text.match(/[\u4e00-\u9fa5]/g) || []).length
  const en = (text.match(/[A-Za-z0-9]+/g) || []).length
  return Math.max(1, Math.round(zh / 350 + en / 200))
}

/** @returns {{slug:string,title:string,date:string,tags:string[],summary:string,html:string,toc:object[],minutes:number,accent:string}[]} */
export function readPosts() {
  const files = fs.readdirSync(CONTENT_DIR).filter((f) => f.endsWith('.md'))

  const posts = files.map((file) => {
    const raw = fs.readFileSync(path.join(CONTENT_DIR, file), 'utf8').replace(/\r\n/g, '\n')
    const { data, content } = matter(raw)
    const { html, toc } = renderMarkdown(content)
    const slug = data.slug || path.basename(file, '.md').replace(/^\d{4}-\d{2}-\d{2}-/, '')
    return {
      slug,
      title: data.title || slug,
      date: normalizeDate(data.date),
      tags: Array.isArray(data.tags)
        ? data.tags.map(String)
        : String(data.tags || '')
            .split(/[,，]/)
            .map((t) => t.trim())
            .filter(Boolean),
      summary: data.summary || '',
      html,
      toc,
      minutes: readingTime(content),
      accent: 'cyan', // 先占位，下面按排序结果轮换
    }
  })

  posts.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
  posts.forEach((post, i) => {
    post.accent = SITE.accents[i % SITE.accents.length]
  })
  return posts
}
