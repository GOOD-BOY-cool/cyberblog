/**
 * Markdown 渲染层
 * - markdown-it 负责语法，highlight.js 只在构建期跑（产物里没有高亮 JS，只有 class）
 * - 顺手做三件事：标题自动加锚点 id、收集 H2 生成目录、代码块套上赛博外壳
 */
import MarkdownIt from 'markdown-it'
import hljs from 'highlight.js'

/** 生成 URL 友好的锚点：保留中英文与数字，空格转连字符 */
function slugify(text, fallback) {
  const slug = String(text)
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
  return slug || fallback
}

/**
 * @param {string} source Markdown 正文（不含 front matter）
 * @returns {{ html: string, toc: { id: string, text: string }[] }}
 */
export function renderMarkdown(source) {
  const md = new MarkdownIt({
    html: true, // 允许在 md 里直接写 <video>/<picture> 这类原生标签
    linkify: true,
    typographer: false,
  })

  const toc = []
  const usedIds = new Set()

  // 1. 标题：自动 id + 收集 H2
  md.renderer.rules.heading_open = (tokens, idx, options, env, self) => {
    const token = tokens[idx]
    const inline = tokens[idx + 1]
    const text = inline && inline.type === 'inline' ? inline.content : ''
    let id = slugify(text, `sec-${idx}`)
    if (usedIds.has(id)) id = `${id}-${idx}`
    usedIds.add(id)
    token.attrSet('id', id)
    if (token.tag === 'h2') toc.push({ id, text: text.replace(/[`*]/g, '') })
    return self.renderToken(tokens, idx, options)
  }

  // 2. 代码块：构建期高亮 + 带 COPY 按钮的外壳
  md.renderer.rules.fence = (tokens, idx) => {
    const token = tokens[idx]
    const lang = (token.info || '').trim().split(/\s+/)[0] || 'text'
    const code = token.content.replace(/\n$/, '')
    const highlighted = hljs.getLanguage(lang)
      ? hljs.highlight(code, { language: lang, ignoreIllegals: true }).value
      : md.utils.escapeHtml(code)
    return (
      `<div class="codeblock" data-lang="${lang}">` +
      '<div class="codeblock__bar"><i class="dot dot--r"></i><i class="dot dot--y"></i>' +
      '<i class="dot dot--g"></i>' +
      `<span class="codeblock__lang">${lang}</span>` +
      '<button class="codeblock__copy" type="button" aria-label="复制代码">COPY</button>' +
      '</div>' +
      `<pre><code class="hljs language-${lang}">${highlighted}</code></pre>` +
      '</div>\n'
    )
  }

  // 3. 表格：包一层可横向滚动的容器，避免窄屏撑破页面
  md.renderer.rules.table_open = () => '<div class="table-wrap"><table>'
  md.renderer.rules.table_close = () => '</table></div>'

  // 4. 任务列表：`- [ ] 待办` / `- [x] 已完成` → 带勾选框的条目
  //    markdown-it 默认只把 [ ] 当普通文字，这里在 inline 阶段之后改写 token
  md.core.ruler.after('inline', 'task-lists', (state) => {
    const tokens = state.tokens
    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i]
      if (token.type !== 'inline') continue
      const match = /^\s*\[([ xX])\]\s+/.exec(token.content)
      if (!match) continue
      const done = match[1].toLowerCase() === 'x'

      // 找到这条 inline 所属的 <li>，给它打上 class
      for (let j = i - 1; j >= 0; j--) {
        if (tokens[j].type === 'list_item_open') {
          tokens[j].attrJoin('class', done ? 'task-item task-item--done' : 'task-item')
          break
        }
        if (tokens[j].type === 'bullet_list_open' || tokens[j].type === 'ordered_list_open') break
      }

      const box = new state.Token('html_inline', '', 0)
      box.content = `<span class="task__box${done ? ' is-done' : ''}" aria-hidden="true"></span>`
      const first = token.children && token.children[0]
      if (first && first.type === 'text') {
        first.content = first.content.replace(/^\s*\[[ xX]\]\s+/, '')
      }
      token.children.unshift(box)
      token.content = token.content.replace(/^\s*\[[ xX]\]\s+/, '')
    }
  })

  // 5. 图片：默认懒加载 + 预留解码，防止 CLS
  md.renderer.rules.image = (tokens, idx, options, env, self) => {
    const token = tokens[idx]
    const altIndex = token.attrIndex('alt')
    token.attrs[altIndex][1] = self.renderInlineAsText(token.children, options, env)
    token.attrSet('loading', 'lazy')
    token.attrSet('decoding', 'async')
    return self.renderToken(tokens, idx, options)
  }

  return { html: md.render(source), toc }
}
