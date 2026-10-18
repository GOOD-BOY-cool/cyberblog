/**
 * 模板层：把结构化数据拼成 HTML 字符串
 * 全部是纯函数 —— 同一个输入永远得到同一个字符串，方便 diff 与缓存
 */
import { SITE } from './site.config.mjs'
import { LINKS, LINKS_NOTE } from './links.mjs'

const esc = (s) => String(s ?? '').replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c])
const escAttr = (s) => esc(s).replace(/"/g, '&quot;')

/* ---------------------------------------------------------------- 骨架层 */
export function layout({ title, desc, body, root = '', boot = false }) {
  return `<!DOCTYPE html>
<html lang="${SITE.locale}">
<head>
<meta charset="UTF-8">
<script>document.documentElement.classList.add("js");</script>
<script>(function () { try { var t = localStorage.getItem("neon-theme"); document.documentElement.setAttribute("data-theme", t === "cartoon" || t === "anime" ? t : "cyber"); } catch (e) { document.documentElement.setAttribute("data-theme", "cyber"); } })();</script>
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="theme-color" content="#05060a">
<title>${esc(title)}</title>
<meta name="description" content="${escAttr(desc)}">
<meta property="og:title" content="${escAttr(title)}">
<meta property="og:description" content="${escAttr(desc)}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="${escAttr(SITE.title)}">
<link rel="icon" href="/assets/favicon.svg" type="image/svg+xml">
<link rel="alternate" type="application/rss+xml" title="${escAttr(SITE.title)}" href="${root}feed.xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Baloo+2:wght@600;700;800&family=JetBrains+Mono:wght@400;500;700&family=Orbitron:wght@600;800;900&family=ZCOOL+KuaiLe&display=swap" media="print" onload="this.media='all'">
<link rel="stylesheet" href="/src/styles/cyber.css">
</head>
<body>
<div class="bg-cartoon" aria-hidden="true">
  <img class="bg-cartoon__art" data-src="/assets/cartoon-bg.svg" alt="" width="1600" height="1000" decoding="async">
  <span class="bg-cartoon__veil"></span>
</div>
<div class="bg-anime" aria-hidden="true">
  <img class="bg-anime__art" data-src="/assets/anime-bg.svg" alt="" width="1600" height="1000" decoding="async">
  <span class="bg-anime__veil"></span>
</div>
<div class="fx fx--scanlines" aria-hidden="true"></div>
<div class="fx fx--vignette" aria-hidden="true"></div>
<div class="fx fx--grain" aria-hidden="true"></div>
<canvas id="bg-canvas" aria-hidden="true"></canvas>
<div class="cursor-glow" id="cursor-glow" aria-hidden="true"></div>
${boot ? BOOT : ''}
<header class="site-header" id="site-header">
  <div class="container site-header__inner">
    <a class="brand" href="${root}index.html" aria-label="返回首页">
      <img class="brand__mark" src="/assets/mark.svg" alt="" width="38" height="38">
      <span class="brand__text">NEON<em>//</em>EDGE</span>
    </a>
    <button class="nav-toggle" id="nav-toggle" type="button" aria-label="打开菜单" aria-expanded="false">
      <span></span><span></span><span></span>
    </button>
    <nav class="nav" id="nav">
      <a class="nav__link" href="${root}index.html">首页</a>
      <a class="nav__link" href="${root}posts/index.html">日志</a>
      <a class="nav__link" href="${root}archive.html">归档</a>
      <a class="nav__link" href="${root}links.html">友链</a>
      <a class="nav__link" href="${root}about.html">关于</a>
      <a class="nav__link nav__link--ghost" href="${root}feed.xml">RSS<span class="nav__dot"></span></a>
    </nav>
    <div class="status" title="系统状态">
      <span class="status__dot"></span><span class="status__text">SYS.ONLINE</span>
    </div>
  </div>
</header>
<main id="main">
${body}
</main>
<footer class="site-footer">
  <div class="container site-footer__inner">
    <div class="site-footer__brand">
      <span class="brand__text">NEON<em>//</em>EDGE</span>
      <p>在信号的边缘写代码。二〇二六，持续在线。</p>
    </div>
    <div class="site-footer__meta">
      <span>&copy; ${new Date().getFullYear()} ${esc(SITE.author)}</span>
      <span>VITE + 0 RUNTIME DEPS</span>
      <span class="mono">LAT 39.90 / LON 116.40</span>
    </div>
  </div>
  <div class="site-footer__bar" aria-hidden="true"></div>
</footer>
<button class="theme-toggle" id="theme-toggle" type="button" aria-pressed="false" aria-label="切换风格，当前：赛博">
  <span class="theme-toggle__icon" aria-hidden="true">
    <svg class="theme-toggle__svg theme-toggle__svg--sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round">
      <circle cx="12" cy="12" r="4.2"/>
      <path d="M12 2.6v2.2M12 19.2v2.2M2.6 12h2.2M19.2 12h2.2M5.4 5.4l1.6 1.6M17 17l1.6 1.6M18.6 5.4 17 7M7 17l-1.6 1.6"/>
    </svg>
    <svg class="theme-toggle__svg theme-toggle__svg--moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
      <path d="M20 14.5A8.2 8.2 0 0 1 9.5 4a8.4 8.4 0 1 0 10.5 10.5Z"/>
    </svg>
  </span>
  <span class="theme-toggle__label">赛博</span>
</button>
<script type="module" src="/src/main.js"></script>
</body>
</html>
`
}

const BOOT = `<div class="boot" id="boot" aria-hidden="true">
  <div class="boot__inner">
    <div class="boot__logo">NEON<span>//</span>EDGE</div>
    <div class="boot__bar"><i></i></div>
    <div class="boot__log mono">BOOTING NEURAL INTERFACE ... OK</div>
  </div>
</div>`

/* ---------------------------------------------------------------- 首页 */
const HERO = (postCount) => `<section class="hero">
  <div class="hero__grid" aria-hidden="true"></div>
  <div class="hero__glow" aria-hidden="true"></div>
  <div class="container hero__inner">
    <div class="hero__copy" data-reveal>
      <p class="chip"><span class="chip__dot"></span>SYSTEM ONLINE · 2026 · NODE 07</p>
      <h1 class="glitch" data-text="NEON//EDGE">NEON<span class="glitch__slash">//</span>EDGE</h1>
      <p class="hero__type"><span class="type" id="typewriter" data-words="在信号的边缘写代码|用 4 个构建期依赖做出赛博美学|让动画跑满 60 帧"></span><span class="caret" aria-hidden="true"></span></p>
      <p class="hero__desc">${esc(SITE.desc)}</p>
      <div class="hero__actions">
        <a class="btn btn--primary" href="posts/index.html"><span>进入日志</span><i>&#8594;</i></a>
        <a class="btn btn--ghost" href="about.html">关于作者</a>
      </div>
      <ul class="hero__stats">
        <li><b data-count="${postCount}">0</b><span>LOGS</span></li>
        <li><b data-count="16">0</b><span>ANIM</span></li>
        <li><b data-count="60">0</b><span>FPS</span></li>
        <li><b data-count="0">0</b><span>RUNTIME</span></li>
      </ul>
    </div>
    <div class="hero__visual" data-reveal>
      <div class="holo">
        <img class="holo__img" src="/assets/holo-core.svg" alt="全息核心：旋转光环与脉冲波形的动态图" width="560" height="560" fetchpriority="high" decoding="async">
        <span class="holo__label mono">HOLO-CORE v2.6</span>
      </div>
    </div>
  </div>
  <div class="scroll-hint" aria-hidden="true"><span></span>SCROLL</div>
</section>`

const TERMINAL = `<section class="section">
  <div class="container">
    <div class="duo">
      <div class="panel panel--term" data-reveal>
        <div class="panel__bar"><i class="dot dot--r"></i><i class="dot dot--y"></i><i class="dot dot--g"></i><span class="mono">~/neon-edge — zsh</span></div>
        <div class="term">
          <p class="term__line"><span class="term__prompt">$</span> whoami</p>
          <p class="term__line term__out">${esc(SITE.role)}</p>
          <p class="term__line"><span class="term__prompt">$</span> cat stack.txt</p>
          <p class="term__line term__out">Vite(构建) · markdown-it · 原生 CSS · 原生 JS · SVG/SMIL</p>
          <p class="term__line"><span class="term__prompt">$</span> npm run build</p>
          <p class="term__line term__out term__out--ok">✔ built in 412ms · 5 pages · 0 runtime deps</p>
        </div>
      </div>
      <div class="panel panel--signal" data-reveal>
        <div class="panel__bar"><span class="mono">SIGNAL MONITOR</span><span class="mono blink">● REC</span></div>
        <div class="signal">
          <img class="signal__img" src="/assets/data-stream.svg" alt="数据流动态图" width="640" height="180" loading="lazy" decoding="async">
          <div class="signal__grid">
            <div><span>UPTIME</span><b>99.98%</b></div>
            <div><span>LATENCY</span><b>12ms</b></div>
            <div><span>BANDWIDTH</span><b>4.2 Gb/s</b></div>
            <div><span>NOISE</span><b>0.31</b></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>`

/* ---------------------------------------------------------------- 卡片 */
export function card(post, root = '') {
  return `<article class="card card--${post.accent}" data-tilt data-reveal data-tags="${escAttr(post.tags.join(','))}" data-title="${escAttr(post.title)}">
  <a class="card__link" href="${root}posts/${post.slug}.html">
    <span class="card__corner card__corner--tl"></span>
    <span class="card__corner card__corner--br"></span>
    <span class="card__sweep"></span>
    <div class="card__top">
      <span class="tag">${esc(post.tags[0] || 'LOG')}</span>
      <time class="mono" datetime="${post.date}">${post.date.replace(/-/g, '.')}</time>
    </div>
    <h3 class="card__title">${esc(post.title)}</h3>
    <p class="card__desc">${esc(post.summary)}</p>
    <div class="card__foot">
      <span class="mono">${post.minutes} MIN READ</span>
      <span class="card__arrow">&#8594;</span>
    </div>
  </a>
</article>`
}

/* ---------------------------------------------------------------- 首页 */
export function buildIndex(posts) {
  const body =
    HERO(posts.length) +
    `<section class="section">
  <div class="container">
    <div class="section__head" data-reveal>
      <h2><span class="mono">//</span> LATEST_LOGS</h2>
      <a class="section__more mono" href="posts/index.html">ALL LOGS &#8594;</a>
    </div>
    <div class="grid grid--posts">${posts.slice(0, 3).map((p) => card(p)).join('')}</div>
  </div>
</section>` +
    TERMINAL +
    `<section class="section section--cta">
  <div class="container">
    <div class="cta" data-reveal>
      <p class="cta__kicker mono">// TRANSMISSION OPEN</p>
      <h2>把想法写进日志，让霓虹替你通电。</h2>
      <p>所有文章以 Markdown 存放，一次 <code>npm run build</code> 即可发布。没有前端框架，没有 hydration，产物就是 HTML + CSS + 一点点原生 JS。</p>
      <a class="btn btn--primary" href="posts/index.html"><span>浏览全部日志</span><i>&#8594;</i></a>
    </div>
  </div>
</section>`

  return layout({
    title: `${SITE.title} — 赛博朋克静态博客`,
    desc: SITE.desc,
    body,
    root: '',
    boot: true,
  })
}

/* ---------------------------------------------------------------- 归档页 */
export function buildList(posts) {
  const tags = []
  for (const post of posts) {
    for (const tag of post.tags) {
      const hit = tags.find((t) => t.name === tag)
      if (hit) hit.count++
      else tags.push({ name: tag, count: 1 })
    }
  }

  const chips = [
    `<button class="chip-btn is-active" data-filter="all" type="button">ALL<span>${posts.length}</span></button>`,
    ...tags.map(
      (t) =>
        `<button class="chip-btn" data-filter="${escAttr(t.name)}" type="button">${esc(t.name)}<span>${t.count}</span></button>`
    ),
  ].join('')

  const body = `<section class="page-head">
  <div class="container">
    <p class="crumb mono"><a href="../index.html">HOME</a> / LOGS</p>
    <h1 class="page-title glitch" data-text="ARCHIVE">ARCHIVE</h1>
    <p class="page-sub">${posts.length} 条日志 · 按时间倒序 · 支持标签过滤与关键词检索</p>
  </div>
</section>
<section class="section section--flush">
  <div class="container">
    <div class="toolbar" data-reveal>
      <div class="filters">${chips}</div>
      <label class="search">
        <span aria-hidden="true">&#9906;</span>
        <input id="post-search" type="search" placeholder="搜索标题 / 摘要…" autocomplete="off" aria-label="搜索文章">
      </label>
    </div>
    <div class="grid grid--posts" id="post-grid">${posts.map((p) => card(p, '../')).join('')}</div>
    <p class="empty" id="empty-state" hidden>没有匹配的日志。换个关键词试试。</p>
  </div>
</section>`

  return layout({
    title: `日志归档 — ${SITE.title}`,
    desc: '全部日志归档，支持标签过滤与搜索。',
    body,
    root: '../',
  })
}

/* ---------------------------------------------------------------- 文章页 */
export function buildPost(post, prev, next) {
  const tocHtml =
    post.toc.length >= 2
      ? `<aside class="toc" aria-label="目录">
      <p class="toc__title mono">// ON THIS PAGE</p>
      <ul>${post.toc.map((t) => `<li><a href="#${t.id}">${esc(t.text)}</a></li>`).join('')}</ul>
    </aside>`
      : ''

  let nav = ''
  if (prev || next) {
    nav = '<nav class="post-nav">'
    if (prev) {
      nav += `<a class="post-nav__item" href="${prev.slug}.html"><span class="mono">&#8592; PREV</span><b>${esc(prev.title)}</b></a>`
    }
    if (next) {
      nav += `<a class="post-nav__item post-nav__item--next" href="${next.slug}.html"><span class="mono">NEXT &#8594;</span><b>${esc(next.title)}</b></a>`
    }
    nav += '</nav>'
  }

  const body = `<div class="progress" aria-hidden="true"><i id="progress-bar"></i></div>
<article class="post">
  <header class="post__head">
    <div class="container">
      <p class="crumb mono"><a href="../index.html">HOME</a> / <a href="index.html">LOGS</a> / ${esc((post.tags[0] || 'LOG').toUpperCase())}</p>
      <div class="post__tags">${post.tags.map((t) => `<span class="tag">${esc(t)}</span>`).join('')}</div>
      <h1 class="post__title">${esc(post.title)}</h1>
      <p class="post__meta mono"><span>${post.date}</span><span class="post__meta-dot"></span><span>${post.minutes} MIN READ</span><span class="post__meta-dot"></span><span>BY ${esc(SITE.author)}</span></p>
      <div class="post__banner" aria-hidden="true">
        <img src="/assets/data-stream.svg" alt="" width="1200" height="180" fetchpriority="high" decoding="async">
      </div>
    </div>
  </header>
  <div class="container post__body">
    <div class="post__layout">
      <div class="prose">${post.html}</div>
      ${tocHtml}
    </div>
    ${nav}
  </div>
</article>
${commentsBlock()}`

  return layout({
    title: `${post.title} — ${SITE.title}`,
    desc: post.summary || SITE.desc,
    body,
    root: '../',
  })
}

/* ---------------------------------------------------------------- 关于页 */
export function buildAbout(posts) {
  const body = `<section class="page-head page-head--about">
  <div class="container">
    <p class="crumb mono"><a href="index.html">HOME</a> / ABOUT</p>
    <h1 class="page-title glitch" data-text="OPERATOR">OPERATOR</h1>
    <p class="page-sub">一个把后端逻辑写进霓虹里的人。</p>
  </div>
</section>
<section class="section section--flush">
  <div class="container about">
    <div class="about__card panel" data-reveal>
      <div class="about__avatar" aria-hidden="true">
        <img src="/assets/mark.svg" alt="" width="120" height="120">
      </div>
      <h2>${esc(SITE.author)}</h2>
      <p class="mono about__role">${esc(SITE.role)}</p>
      <ul class="about__facts">
        <li><span>LOCATION</span><b>Beijing / CN</b></li>
        <li><span>STACK</span><b>Go · Python · CSS · JS</b></li>
        <li><span>STATUS</span><b class="ok">AVAILABLE</b></li>
        <li><span>POSTS</span><b>${posts.length}</b></li>
      </ul>
      <a class="btn btn--primary" href="mailto:${SITE.email}"><span>发送信号</span><i>&#8594;</i></a>
    </div>
    <div class="about__main">
      <div class="panel" data-reveal>
        <div class="panel__bar"><span class="mono">// README.md</span></div>
        <div class="prose prose--panel">
          <p>我在做后端，也在做视觉。白天写接口与事务，夜里调霓虹与噪点。</p>
          <p>这个站是一个实验：<strong>用极少的构建期依赖，做出不掉帧的赛博朋克静态博客</strong>。内容用 Markdown 写，Vite 负责打包，动效是原生 CSS + 原生 JS + SVG/SMIL，部署到任何静态托管都能跑。</p>
          <blockquote><p>好的动效不是炫技，是在 16.7ms 的预算里讲清楚一件事。</p></blockquote>
        </div>
      </div>
      <div class="panel" data-reveal>
        <div class="panel__bar"><span class="mono">// TIMELINE</span></div>
        <ol class="timeline">
          <li><span class="mono">2026.10</span><b>NEON//EDGE 上线</b><p>Vite + markdown-it 静态博客，赛博朋克视觉系统第一版。</p></li>
          <li><span class="mono">2026.08</span><b>孤独市集二期</b><p>Go + Gin + GORM 的校园二手交易后端，购买请求工作流。</p></li>
          <li><span class="mono">2024.09</span><b>开始写代码</b><p>从 C 语言指针开始，一路走到分布式与前端动效。</p></li>
        </ol>
      </div>
    </div>
  </div>
</section>`

  return layout({
    title: `关于 — ${SITE.title}`,
    desc: '关于作者与这个博客。',
    body,
    root: '',
  })
}

/* ---------------------------------------------------------------- 404 */
export function buildNotFound() {
  const body = `<section class="page-head">
  <div class="container">
    <p class="crumb mono">SIGNAL LOST</p>
    <h1 class="page-title glitch" data-text="404">404</h1>
    <p class="page-sub">这条信号在噪声里丢了。返回已知坐标重新连接。</p>
    <p style="margin-top:28px"><a class="btn btn--primary" href="/index.html"><span>回到首页</span><i>&#8594;</i></a></p>
  </div>
</section>`

  return layout({
    title: `404 — ${SITE.title}`,
    desc: '页面不存在。',
    body,
    root: '/',
  })
}

/* ---------------------------------------------------------------- 评论 */
function commentsBlock() {
  const g = SITE.giscus || {}
  const enabled = Boolean(g.repo && g.repoId && g.categoryId)
  return `<section class="comments" id="comments" aria-label="评论">
  <div class="container">
    <div class="comments__head">
      <h2 class="comments__title"><span class="mono">//</span> COMMENTS</h2>
      <p class="comments__hint mono">${
        enabled ? '用 GitHub 账号登录后即可评论 · 无需注册本站' : '评论尚未启用 · 见下方说明'
      }</p>
    </div>
    <div class="comments__mount" id="giscus-mount"
         data-repo="${escAttr(g.repo || '')}"
         data-repo-id="${escAttr(g.repoId || '')}"
         data-category="${escAttr(g.category || 'General')}"
         data-category-id="${escAttr(g.categoryId || '')}"></div>
    <noscript><p class="comments__hint mono">评论组件需要 JavaScript。</p></noscript>
  </div>
</section>`
}

/* ---------------------------------------------------------------- 归档 */
export function buildArchive(posts) {
  const byYear = new Map()
  for (const post of posts) {
    const year = post.date.slice(0, 4)
    if (!byYear.has(year)) byYear.set(year, [])
    byYear.get(year).push(post)
  }
  const years = [...byYear.keys()].sort().reverse()

  // 侧栏统计
  const tagCount = new Map()
  for (const post of posts) for (const tag of post.tags) tagCount.set(tag, (tagCount.get(tag) || 0) + 1)
  const tagList = [...tagCount.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
  const totalWords = posts.reduce((sum, post) => sum + (post.words || 0), 0)
  const wordText = totalWords >= 10000 ? `${(totalWords / 10000).toFixed(1)} 万` : String(totalWords)
  const latest = posts[0] ? posts[0].date.replace(/-/g, '.') : '—'

  const groups = years
    .map(
      (year) => `<section class="archive__year">
      <h2 class="archive__year-label">
        <span class="mono">${year}</span>
        <i class="mono">${byYear.get(year).length} POSTS</i>
      </h2>
      <ol class="archive__list">
        ${byYear
          .get(year)
          .map(
            (post) => `<li class="archive__item">
          <time class="archive__date mono" datetime="${post.date}">${post.date.slice(5).replace('-', '.')}</time>
          <span class="archive__cat">${esc(post.tags[0] || 'LOG')}</span>
          <a class="archive__title" href="posts/${post.slug}.html">${esc(post.title)}</a>
          <span class="archive__tags">${post.tags
            .map(
              (tag) =>
                `<a class="mono" href="posts/index.html?tag=${encodeURIComponent(tag)}">#${esc(tag)}</a>`
            )
            .join('')}</span>
        </li>`
          )
          .join('')}
      </ol>
    </section>`
    )
    .join('')

  const body = `<section class="page-head">
  <div class="container">
    <p class="crumb mono"><a href="index.html">HOME</a> / ARCHIVE</p>
    <h1 class="page-title glitch" data-text="ARCHIVE">ARCHIVE</h1>
    <p class="page-sub">${posts.length} 条日志 · ${years.length} 个年份 · 按时间倒序</p>
  </div>
</section>
<section class="section section--flush">
  <div class="container archive__layout">
    <div class="archive">${groups}</div>
    <aside class="archive__side">
      <div class="sidecard">
        <p class="sidecard__title mono">// 站点统计</p>
        <ul class="sidecard__stats">
          <li><span>文章</span><b>${posts.length}</b></li>
          <li><span>标签</span><b>${tagList.length}</b></li>
          <li><span>总字数</span><b>${wordText}</b></li>
          <li><span>最近更新</span><b>${latest}</b></li>
        </ul>
      </div>
      <div class="sidecard">
        <p class="sidecard__title mono">// 标签</p>
        <div class="sidecard__tags">
          ${tagList
            .map(
              ([tag, count]) =>
                `<a class="mono" href="posts/index.html?tag=${encodeURIComponent(tag)}">${esc(tag)}<i>${count}</i></a>`
            )
            .join('')}
        </div>
      </div>
      <div class="sidecard sidecard--note">
        <p class="sidecard__title mono">// 说明</p>
        <p>按年份归档，点击标签可跳转到「日志」页并自动筛选。</p>
      </div>
    </aside>
  </div>
</section>`

  return layout({
    title: `归档 — ${SITE.title}`,
    desc: '全部日志的时间归档，按年份分组。',
    body,
    root: '',
  })
}

/* ---------------------------------------------------------------- 友链 */
export function buildLinks() {
  const cards = LINKS.map((link, i) => {
    let host = link.url
    try {
      host = new URL(link.url).host.replace(/^www\./, '')
    } catch (e) {
      /* 地址写错时退化成原文，不炸构建 */
    }
    const accent = SITE.accents[i % SITE.accents.length]
    const avatar = link.avatar
      ? `<img class="link-card__avatar" src="${escAttr(link.avatar)}" alt="" width="46" height="46" loading="lazy" decoding="async">`
      : `<span class="link-card__avatar" aria-hidden="true">${esc((link.name || '?').trim().slice(0, 1).toUpperCase())}</span>`

    return `<a class="link-card link-card--${accent}" href="${escAttr(link.url)}" target="_blank" rel="noopener noreferrer">
      ${avatar}
      <span class="link-card__body">
        <b>${esc(link.name)}</b>
        <em class="mono">${esc(host)}</em>
        <p>${esc(link.desc)}</p>
        ${link.tags ? `<span class="link-card__tags">${link.tags.map((t) => `<i>${esc(t)}</i>`).join('')}</span>` : ''}
      </span>
      <span class="link-card__arrow" aria-hidden="true">&#8599;</span>
    </a>`
  }).join('')

  const body = `<section class="page-head">
  <div class="container">
    <p class="crumb mono"><a href="index.html">HOME</a> / LINKS</p>
    <h1 class="page-title glitch" data-text="LINKS">LINKS</h1>
    <p class="page-sub">${LINKS.length} 个值得长期订阅的站点 · 信号互通</p>
  </div>
</section>
<section class="section section--flush">
  <div class="container">
    <div class="links__grid">${cards}</div>

    <div class="panel links__note">
      <div class="panel__bar"><span class="mono">${esc(LINKS_NOTE.title)}</span></div>
      <div class="links__note-body">
        <ol>
          ${LINKS_NOTE.rules.map((r) => `<li>${esc(r)}</li>`).join('')}
        </ol>
        <p class="links__note-site mono">本站信息：${esc(LINKS_NOTE.site)}</p>
        <a class="btn btn--ghost" href="mailto:${SITE.email}?subject=%E5%8F%8B%E9%93%BE%E7%94%B3%E8%AF%B7">
          <span>发邮件申请</span><i>&#8594;</i>
        </a>
      </div>
    </div>
  </div>
</section>`

  return layout({
    title: `友链 — ${SITE.title}`,
    desc: '友链：值得长期订阅的站点。',
    body,
    root: '',
  })
}
