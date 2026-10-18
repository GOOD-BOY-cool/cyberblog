/**
 * 生成层：把模板渲染成磁盘上的 .html，并产出 sitemap / robots / RSS
 * 这些页面既是 Vite 的「多页入口」，也是开发服务器的真实文件
 */
import fs from 'node:fs'
import path from 'node:path'
import { ROOT, readPosts } from './content.mjs'
import {
  buildIndex,
  buildList,
  buildPost,
  buildAbout,
  buildArchive,
  buildLinks,
  buildNotFound,
} from './templates.mjs'
import { SITE } from './site.config.mjs'

// generateSite() 已经把全部文章解析过一遍，构建收尾阶段直接复用，避免重复解析
let cachedPosts = null

export function generateSite() {
  const posts = readPosts()
  cachedPosts = posts
  const pages = new Map()

  pages.set('index', buildIndex(posts))
  pages.set('posts/index', buildList(posts))
  pages.set('about', buildAbout(posts))
  pages.set('archive', buildArchive(posts))
  pages.set('links', buildLinks())
  pages.set('404', buildNotFound())
  posts.forEach((post, i) => {
    pages.set(`posts/${post.slug}`, buildPost(post, posts[i + 1] ?? null, posts[i - 1] ?? null))
  })

  const input = {}
  for (const [name, html] of pages) {
    const file = path.join(ROOT, `${name}.html`)
    fs.mkdirSync(path.dirname(file), { recursive: true })
    fs.writeFileSync(file, html, 'utf8')
    input[name] = file
  }
  return { posts, input }
}

/** 构建结束后写进 dist 的附属文件 */
export function emitStatic(outDir) {
  const posts = cachedPosts ?? readPosts()
  const base = SITE.url.replace(/\/$/, '')
  const urls = [
    { loc: '/', prio: '1.0' },
    { loc: '/posts/index.html', prio: '0.8' },
    { loc: '/about.html', prio: '0.6' },
    { loc: '/archive.html', prio: '0.6' },
    { loc: '/links.html', prio: '0.5' },
    ...posts.map((p) => ({ loc: `/posts/${p.slug}.html`, prio: '0.7' })),
  ]

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map((u) => `  <url><loc>${base}${u.loc}</loc><priority>${u.prio}</priority></url>`)
  .join('\n')}
</urlset>
`

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${SITE.title}</title>
    <link>${base}/</link>
    <description>${SITE.desc}</description>
    <language>zh-CN</language>
${posts
  .map(
    (p) => `    <item>
      <title>${p.title}</title>
      <link>${base}/posts/${p.slug}.html</link>
      <guid>${base}/posts/${p.slug}.html</guid>
      <pubDate>${new Date(`${p.date}T00:00:00Z`).toUTCString()}</pubDate>
      <description>${p.summary}</description>
    </item>`
  )
  .join('\n')}
  </channel>
</rss>
`

  const files = {
    'sitemap.xml': sitemap,
    'feed.xml': rss,
    'robots.txt': `User-agent: *\nAllow: /\nSitemap: ${base}/sitemap.xml\n`,
    '.nojekyll': '',
  }
  for (const [name, content] of Object.entries(files)) {
    fs.writeFileSync(path.join(outDir, name), content, 'utf8')
  }
}
