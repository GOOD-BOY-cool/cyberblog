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

/** 阅读时长：中文按 350 字/分钟，英文按 200 词/分钟 */
function readingTime(text) {
  const zh = (text.match(/[\u4e00-\u9fa5]/g) || []).length
  const en = (text.match(/[A-Za-z0-9]+/g) || []).length
  return Math.max(1, Math.round(zh / 350 + en / 200))
}

/** @returns {{slug:string,title:string,date:string,tags:string[],summary:string,body:string,html:string,toc:object[],minutes:number,accent:string}[]} */
export function readPosts() {
  const files = fs
    .readdirSync(CONTENT_DIR)
    .filter((f) => f.endsWith('.md'))

  const posts = files.map((file) => {
    const raw = fs.readFileSync(path.join(CONTENT_DIR, file), 'utf8').replace(/\r\n/g, '\n')
    const { data, content } = matter(raw)
    const { html, toc } = renderMarkdown(content)
    const slug = data.slug || path.basename(file, '.md').replace(/^\d{4}-\d{2}-\d{2}-/, '')
    return {
      slug,
      title: data.title || slug,
      date: data.date ? String(data.date).slice(0, 10) : '2026-01-01',
      tags: Array.isArray(data.tags)
        ? data.tags.map(String)
        : String(data.tags || '')
            .split(/[,，]/)
            .map((t) => t.trim())
            .filter(Boolean),
      summary: data.summary || '',
      body: content,
      html,
      toc,
      minutes: readingTime(content),
      accent: 'cyan',
    }
  })

  posts.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
  posts.forEach((post, i) => {
    post.accent = SITE.accents[i % SITE.accents.length]
  })
  return posts
}

/** 全站标签统计，用于归档页的过滤条 */
export function collectTags(posts) {
  const map = new Map()
  for (const post of posts) {
    for (const tag of post.tags) map.set(tag, (map.get(tag) || 0) + 1)
  }
  return [...map.entries()].map(([name, count]) => ({ name, count }))
}
