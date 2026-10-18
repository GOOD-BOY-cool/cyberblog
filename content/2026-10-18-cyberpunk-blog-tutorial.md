---
title: 从零构建赛博朋克静态博客：结构、动效、性能与部署全流程
slug: cyberpunk-blog-tutorial
date: 2026-10-18
tags: 教程, 架构, 动效, 性能
summary: 一份可以照抄的施工手册：页面如何分工、动图放在哪里、动画何时触发、怎样在 16.7ms 的预算里跑满 60 帧，以及从 npm install 到上线的完整命令。
---

你现在看到的这个站点，就是按下面这套流程造出来的。全文分五段：**技术选型 → 页面结构 → 动效系统 → 响应式与性能 → 构建部署**。每一段都给具体文件、具体代码、具体命令。

一句话概括本站的技术形态：**内容用 Markdown 写，构建交给 Vite，动效全部是原生 CSS / 原生 JS / SVG。产出物是纯静态文件，可以扔到任何地方。**

## 一、技术选型：只要 4 个构建期依赖

静态博客的本质是「Markdown 进，HTML 出」。这件事有很多种做法，选之前先想清楚三条硬指标：

1. **首屏够快**：赛博朋克视觉元素多，如果再加上框架运行时，第一屏很容易掉到 1 秒以外。
2. **动效可控**：霓虹、故障、扫描线都必须能精确控制生命周期，不能交给某个 UI 库的主题。
3. **十年后还能构建**：博客是长期资产，工具链越薄，腐坏概率越低。

按这三条，可选方案大致三类：

| 方案 | 代表 | 构建耗时 | 依赖体积 | 运行时开销 | 适合谁 |
|---|---|---|---|---|---|
| 重型框架 | Next.js / Nuxt | 5~30s | 200MB+ | 有 hydration | 需要 SSR、API 路由 |
| 轻量 SSG | Astro / Hugo / Eleventy | 0.3~3s | 30~200MB | 通常为 0 | 内容多、要插件生态 |
| 自写构建脚本 | 纯 Node / Python | < 0.1s | 0~2MB | 0 | 追求完全掌控 |
| **本项目：Vite + markdown-it** | 本仓库 | < 0.5s | ~10MB | **0** | 标准工具链 + 零运行时 |

本项目选最后一档，原因很具体：

- **构建期干活，运行期不干活**：Markdown 解析、语法高亮、模板拼装全部在 `npm run build` 时完成，浏览器拿到的就是 HTML 字符串。**产物里没有解析器，也没有 hydration**。
- **Vite 只做两件事**：开发服务器（HMR）和打包（CSS/JS 压缩 + 文件名 hash）。它不参与「内容」，所以换掉它也不会伤筋动骨。
- **依赖只有 4 个，全部是 `devDependencies`**：

| 依赖 | 作用 | 是否进入产物 |
|---|---|---|
| `vite` | 开发服务器 + 打包 | 否 |
| `markdown-it` | Markdown → HTML | 否 |
| `gray-matter` | 解析 front matter | 否 |
| `highlight.js` | 代码块语法高亮（构建期） | 否（只留 CSS 类名） |

> 注意「构建期」和「运行期」这两个词。`npm run build` 之后，`dist/` 里只有 HTML、一个 CSS、一个 JS 和几个 SVG。**没有 node_modules，没有框架，没有第三方脚本。**

流水线只有四步，全部发生在构建期：

```text
content/*.md
   │  gray-matter  →  title / date / tags / summary
   │  markdown-it  →  <p> <h2> <pre><code class="hljs">...
   ▼
scripts/templates.mjs  →  layout() 套骨架 + 卡片 + 目录
   │
   ▼
index.html / posts/*.html / about.html / 404.html      ← 磁盘上的真实文件
   │  Vite 打包（CSS 压缩、JS 压缩、文件名加 hash）
   ▼
dist/  →  sitemap.xml / feed.xml / robots.txt / .nojekyll   （writeBundle 阶段补写）
```

## 二、目录结构：源与产物彻底分开

```text
cyberblog/
├── package.json               # 4 个 devDependencies + 4 条 npm script
├── vite.config.mjs            # base / 多页 / 打包策略
├── content/                   # 唯一需要你天天动的地方
│   ├── 2026-09-28-hello-neon.md
│   ├── 2026-10-12-canvas-particles.md
│   └── 2026-10-18-cyberpunk-blog-tutorial.md
├── scripts/                   # 构建器，六个文件各管一件事
│   ├── site.config.mjs        # 站点标题 / 作者 / 域名 / 配色轮换
│   ├── markdown.mjs           # md 渲染：锚点、目录、代码块外壳、图片懒加载
│   ├── content.mjs            # 读 md → 结构化对象 + 阅读时长 + 标签统计
│   ├── templates.mjs          # 纯函数模板：layout / card / 五个页面
│   ├── generate.mjs           # 写页面到磁盘 + sitemap / robots / RSS
│   └── vite-plugin-blog.mjs   # 把上面这套接进 Vite 的三个生命周期钩子
├── src/
│   ├── main.js                # 交互层：粒子 / 打字机 / 进场 / 倾斜 / 过滤
│   └── styles/cyber.css       # 设计系统 + 全部 CSS 动画 + 高亮配色
├── public/assets/             # 原样拷贝到 dist 的静态资源
│   ├── holo-core.svg          # 首页全息核心（SMIL 动图，6KB）
│   ├── data-stream.svg        # 数据流（SMIL 动图，5KB）
│   ├── mark.svg               # 品牌标志
│   └── favicon.svg
├── dist/                      # 构建产物（git 忽略，可直接部署）
└── *.html                     # 构建器生成的页面（git 忽略）
```

三个边界必须清楚，否则后面全是坑：

- **`content/` 是内容，`scripts/` 是规则，`src/` 是表现。** 改文章只碰 `content/`，改视觉只碰 `src/styles/cyber.css`。
- **`dist/` 每次构建都会被覆盖**，任何手工修改都会丢失。
- **根目录那几个 `.html` 是生成的中间产物**，同时充当 Vite 的多页入口（`build.rollupOptions.input`）。所以它们要进 `.gitignore`，但不能删。

### 为什么页面要「先落盘，再交给 Vite」

Vite 打包多页应用时，要求每个入口是一个**真实存在的 HTML 文件**。所以流程是：

```js
// scripts/vite-plugin-blog.mjs
config() {
  const { input } = generateSite()               // 先把 md 渲染成 *.html 写到磁盘
  return { build: { rollupOptions: { input } } } // 再把它们注册成打包入口
}
```

`config()` 钩子在 Vite 读完配置之后、开始打包之前执行，是唯一能「既生成文件、又改打包入口」的位置。开发服务器同样跑这个钩子，于是 `npm run dev` 打开的就是同一份 HTML，不存在「开发能看、构建后错位」的问题。

## 三、页面结构设计与职责划分

整站 5 个页面，每个页面只负责一件事：

| 页面 | 产物路径 | 构建函数 | 核心职责 | 主力动效 |
|---|---|---|---|---|
| 首页 | `/index.html` | `buildIndex()` | 3 秒内说清「这里是什么」，导流到最新 3 篇 | 故障标题、打字机、全息核心、粒子星网、数据流 |
| 归档页 | `/posts/index.html` | `buildList()` | 全量索引、标签过滤、关键词检索 | 卡片入场、3D 倾斜、扫光 |
| 详情页 | `/posts/<slug>.html` | `buildPost()` | 沉浸阅读、目录导航、代码复制、上下篇 | 阅读进度条、目录高亮、头图数据流 |
| 关于页 | `/about.html` | `buildAbout()` | 作者身份、技术栈、时间线、联系方式 | 头像环旋转、时间线脉冲点 |
| 404 | `/404.html` | `buildNotFound()` | 兜住错误路径，把人送回首页 | 故障标题 |

### 1. 骨架层：所有页面共用的 5 件事

`layout()` 是唯一的页面外壳，它只负责塞五类东西，多一件都不塞：

- **元信息**：`title`、`description`、`og:*`、`theme-color`、favicon、RSS 自动发现
- **氛围层**：`.fx--scanlines`（扫描线）、`.fx--vignette`（暗角）、`.fx--grain`（噪点）三个固定定位的空 div
- **背景画布**：`<canvas id="bg-canvas">`
- **全局导航**：logo + 三个链接 + 状态灯
- **样式与脚本**：`/src/styles/cyber.css` 与 `<script type="module" src="/src/main.js">`

模板参数只有 6 个：`title`、`desc`、`body`、`root`、`pageId`、`boot`。

其中 `root` 是**相对根路径**：一级页传 `''`，`/posts/` 下的页面传 `'../'`。导航链接写成 `root + 'posts/index.html'`，无论部署在域名根目录还是 `https://user.github.io/repo/` 这种子路径下，相对链接永远正确，不需要任何运行时拼接。

```js
layout({ title, desc, body, root: '', pageId: 'index', boot: true })   // /index.html
layout({ title, desc, body, root: '../', pageId: 'post' })             // /posts/xxx.html
```

再强调一遍这条纪律：**页面内的站内链接一律相对，静态资源一律绝对（`/assets/...`）。** 前者保证子路径部署不炸，后者交给 Vite 的 `base` 统一改写。

### 2. 首页：一次性说服

首页只有一个任务：**让访客 3 秒内知道这里是什么，并且愿意点进去**。所以信息密度刻意做低，按 F 型视线排布：

- 左侧：状态徽章 → 主标题（故障字）→ 打字机副标题 → 一句定位 → 两个 CTA → 四个数字
- 右侧：全息核心动图——视觉锚点，也是「这里能动」的第一个信号
- 下方：最新日志三卡 → 终端面板 + 信号面板 → 收尾 CTA

终端面板是**氛围组件**而非功能组件：等宽字体、假命令、绿色 `✔`，成本几乎为零，但「赛博 / 工程」的气质全靠它撑。注意它是静态 HTML，不是 JS 打出来的——**能用静态标记表达的，就不要用脚本**。

### 3. 归档页：可检索

过滤与搜索全部在前端完成，不需要后端、不需要索引文件：

```js
// 构建时：front matter 注入 data 属性
// <article class="card" data-tags="CSS,动效" data-title="纯 CSS 故障艺术">
// 运行时：只做字符串匹配 + hidden 切换，不重建 DOM
var okTag = activeTag === 'all' || tags.indexOf(activeTag) !== -1
card.hidden = !(okTag && okText)
```

`hidden` 属性是最便宜的「隐藏」：不销毁节点、不触发重排到 0 高度，恢复时也不需要重建。5 篇文章看不出差别，500 篇也不会卡。

### 4. 详情页：阅读优先

详情页有严格层级：**进度条（fixed）→ 面包屑 → 标签 → 标题 → 元信息 → 头图 → 正文 + 目录 → 上下篇**。

正文是两栏网格：

```css
.post__layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;   /* 右边 210px 的 sticky 目录 */
  gap: 56px;
}
```

`minmax(0, 1fr)` 里的 **0 是必须的**。默认的 `1fr` 等价于 `minmax(auto, 1fr)`，而 `auto` 的最小尺寸由内容决定——`<pre>` 里一行 200 字符的代码会把栅格撑破，整页出现横向滚动条。这是 CSS Grid 最常见的坑，配代码高亮的博客 100% 会遇到。

目录只在 `H2 数量 ≥ 2` 时渲染，避免短文章出现一个孤零零的目录框。

### 5. 关于页 & 404

关于页回答「你是谁 / 你做过什么 / 怎么联系」，用三种载体：事实列表（LOCATION / STACK / STATUS / POSTS）、README 式自述、时间线。时间线左边线用 `border-left`，节点是 `::before` 的发光圆点，最后一项把边框设成透明，视觉上自然收尾。

404 复用 `page-head` 的排版，只把标题换成 `404`，再加一个回首页的按钮。**不要为 404 单独设计一套样式**——它的访问量低，不值得维护成本。

## 四、动图与动画系统

赛博朋克最容易翻车的地方：把所有特效同时打开，页面从头到尾都在动，读者三秒就烦。

本站的规矩是**分三层**，三层不能混：

| 层级 | 定位 | 数量 | 例子 |
|---|---|---|---|
| L0 氛围 | 常驻、低成本、不抢注意力 | ≤ 4 | 粒子星网、扫描线、暗角、噪点、网格地面 |
| L1 信息 | 随滚动/时间触发，服务于内容 | ≤ 6 | 故障标题、打字机、全息核心、数据流、卡片入场、数字滚动 |
| L2 反馈 | 只在交互时出现 | 不限 | 3D 倾斜、扫光、光标光晕、阅读进度、复制反馈 |

### 1. 完整动效清单（位置 / 触发 / 实现 / 成本）

| 层 | 动效 | 位置 | 触发时机 | 实现 | 成本 |
|---|---|---|---|---|---|
| L0 | 粒子星网 | 全站固定底层 `#bg-canvas` | 空闲回调后常驻 | Canvas 2D + rAF | 中 |
| L0 | CRT 扫描线 | 全站覆盖层 | 常驻，7s 循环 | `repeating-linear-gradient` + `translate3d` | 极低 |
| L0 | 暗角 + 噪点 | 全站覆盖层 | 静态 | `radial-gradient` + SVG `feTurbulence` | 零 |
| L0 | 网格地面 | 首页 hero 底部 | 常驻，6s 流动 | `rotateX(74deg)` + 背景位移 | 低 |
| L1 | 故障标题 | 首页 / 归档 / 关于 / 404 的 H1 | 每 5.5~6.5s 爆发约 40ms | 双伪元素 + `clip-path` + `steps(1)` | 低 |
| L1 | 打字机 | 首页副标题 | `load` 后 0.9s，循环 3 句 | `setTimeout` 逐字 | 低 |
| L1 | 全息核心 | 首页右侧 | 常驻，7 组不同速率 | SVG SMIL `animateTransform` | 中 |
| L1 | 数据流 | 首页信号面板 + 详情页头图 | 常驻 | SVG SMIL `stroke-dashoffset` | 低 |
| L1 | 卡片入场 | 首页 / 归档 | 交叉视口 8% 时触发**一次** | IntersectionObserver + transform | 低 |
| L1 | 数字滚动 | 首页 stats | 进入视口时 | rAF + easeOutCubic | 极低 |
| L2 | 3D 倾斜 | 卡片 hover | `pointermove`（rAF 节流） | CSS 变量 + `rotateX/Y` | 低 |
| L2 | 扫光 | 卡片 hover | hover | `translateX(-130% → 130%)` | 低 |
| L2 | 光标光晕 | 全站 | `pointermove`，0.14 阻尼跟随 | 单 div `transform` | 低 |
| L2 | 阅读进度 | 详情页顶部 | `scroll`（rAF 节流） | `scaleX()` | 极低 |
| L2 | 复制反馈 | 代码块按钮 | click | 文案切换 + 颜色 | 极低 |
| L2 | 开机遮罩 | 首页 | `load` 后 620ms 淡出 | `opacity` + `visibility` | 一次性 |

### 2. 动图选型：为什么不用 GIF

「有动图」这件事，很多人第一反应是塞一张 `.gif`。本站首页那个旋转的核心就是一张**动图**，但它不是 GIF，是一个 6KB 的 SVG：

| 指标 | 动画 GIF（480px） | SVG + SMIL | WebM / MP4 |
|---|---|---|---|
| 体积 | 800KB ~ 2.5MB | **6KB** | 200KB ~ 2MB |
| 缩放 | 放大发虚 | 任意分辨率锐利 | 放大发虚 |
| 改颜色 | 逐帧重做 | 改一个 `stop-color` | 重编码 |
| 支持 `prefers-reduced-motion` | 否 | 是（CSS 可禁） | 是（暂停播） |
| CPU | 每帧解码位图 | 矢量重绘 | 硬解，很省 |
| 适用场景 | 真人实拍 / 复杂纹理 | **图标、界面、数据可视化** | 实拍视频 |

结论按这个顺序选：

1. **能用 SVG/CSS 表达的，就用 SVG/CSS**。它天然矢量、可换色、可被 CSS 控制，体积常常只有 GIF 的 1%。
2. 必须是实拍或复杂纹理动画 → 用 **WebM/MP4 + `video autoplay muted loop playsinline`**，不要 GIF。
3. 非要用栅格动图 → 用**动图 WebP 或 AVIF**，同画质约为 GIF 的 1/5。
4. **实在要用 GIF**：限制在 480px 宽、控制帧数、`loading="lazy"`，并且永远别放在首屏。

一个容易忽略的细节：SMIL 动画写在 `.svg` 文件内部，用 `<img src="holo-core.svg">` 引用时**依然会播放**（脚本不执行，但声明式动画会）。所以它既能当图片用，又天然是「动图」，还能被懒加载、被浏览器缓存、被 CDN 压缩。

```html
<img src="/assets/holo-core.svg" alt="全息核心：旋转光环与脉冲波形"
     width="560" height="560" fetchpriority="high" decoding="async">
```

`width` / `height` 必须写死。SVG 在加载完成前高度是 0，会造成明显的布局偏移（CLS）——赛博朋克页面本来元素就多，这一下能直接把 CLS 从 0 推到 0.2。

### 3. 故障标题：两个伪元素伪造信号断裂

思路：真文字保持白色，两个伪元素复制同一段文字（`content: attr(data-text)`），分别染青与品红，用 `mix-blend-mode: screen` 叠加，再用 `clip-path: inset()` 在时间轴上抖动切片。

```css
.glitch { position: relative; color: #f2f8ff; }
.glitch::before,
.glitch::after {
  content: attr(data-text);
  position: absolute; inset: 0;
  pointer-events: none;
  mix-blend-mode: screen;        /* 叠加而非遮挡，保留底层的品红斜杠 */
}
.glitch::before { color: var(--cyan);    text-shadow: -2px 0 var(--magenta); animation: glitch-a 6.5s steps(1) infinite; }
.glitch::after  { color: var(--magenta); text-shadow:  2px 0 var(--cyan);    animation: glitch-b 5.5s steps(1) infinite; }

@keyframes glitch-a {
  0%, 88%, 100% { transform: translate3d(0,0,0); clip-path: inset(0 0 100% 0); }
  89% { transform: translate3d(-5px,0,0); clip-path: inset(8% 0 62% 0); }
  90% { transform: translate3d( 5px,0,0); clip-path: inset(58% 0 18% 0); }
  91% { transform: translate3d(-3px,0,0); clip-path: inset(32% 0 46% 0); }
}
```

三个关键点：

- **`steps(1)` 而不是 `ease`**：故障是「跳变」不是「渐变」，缓动会让它看起来像卡顿。
- **静止态用 `clip-path: inset(0 0 100% 0)` 把伪元素完全裁掉**：只有爆发那几十毫秒才露出来，其余时间文字是绝对干净的。否则长期重影会让标题发虚。
- **两个伪元素的周期故意错开**（6.5s / 5.5s）：同频会显得像固定模板，错开后每次爆发的位置组合都不同。

### 4. 扫描线：3px 位移的完美循环

```css
.fx--scanlines {
  position: fixed; inset: -4px 0;   /* 上下各多留 4px，避免位移时露边 */
  background: repeating-linear-gradient(to bottom,
    rgba(190,240,255,.05) 0 1px, transparent 1px 3px);
  mix-blend-mode: overlay;
  animation: scan-drift 7s linear infinite;
}
@keyframes scan-drift {
  from { transform: translate3d(0,-3px,0); }
  to   { transform: translate3d(0, 0,0); }
}
```

位移距离必须**等于图案周期（3px）**，最后一帧才能和第一帧完全重合。写成 `-10px` 你会看到每 7 秒画面「跳」一下——这是最常见的循环动画瑕疵。

### 5. 粒子星网：一个 canvas 撑起全站氛围

`initCanvas()` 做五件事：

1. **按面积算节点数**：`clamp(w*h/20000, 26, 90)`。小屏省电，大屏不空。
2. **连线只比距离平方**：`d2 < 19600`（即 140px），避免每个配对都开方。
3. **鼠标排斥**：指针 160px 内的节点被轻推开，制造「有生命」的错觉。
4. **DPR 上限 2**：4K 屏不画 4 倍像素。
5. **标签页隐藏时跳过绘制**：`document.hidden` 为真直接 return。

```js
var dpr = Math.min(window.devicePixelRatio || 1, 2);
canvas.width  = Math.floor(w * dpr);
canvas.height = Math.floor(h * dpr);
ctx.setTransform(dpr, 0, 0, dpr, 0, 0);   // 用 CSS 像素坐标绘制，缩放交给矩阵
```

**不要用 `ctx.shadowBlur` 画 90 个发光点。** 那是 canvas 里最贵的操作之一，中端笔记本能直接把帧率从 60 拖到 25。本项目的发光感来自 CSS 覆盖层的暗角与噪点，而不是逐点高斯模糊。

另外一个容易被忽略的点：粒子画布通过 `requestIdleCallback` 延后启动，不和首屏 LCP 抢主线程。

```js
var idle = window.requestIdleCallback || function (fn) { return setTimeout(fn, 260); };
idle(function () { initCanvas(); }, { timeout: 1400 });
```

### 6. 进场动画：只动 opacity 和 transform，且只触发一次

```js
var io = new IntersectionObserver(function (entries) {
  entries.forEach(function (entry) {
    if (!entry.isIntersecting) return;
    entry.target.classList.add('is-visible');
    io.unobserve(entry.target);        // 触发一次就解绑，避免反复计算
  });
}, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
```

配套 CSS 只动两个属性：

```css
html.js [data-reveal] {
  opacity: 0;
  transform: translate3d(0, 22px, 0);
  transition: opacity .75s var(--ease), transform .75s var(--ease);
}
html.js [data-reveal].is-visible { opacity: 1; transform: none; }
```

注意前缀 `html.js`：这段样式只在 JS 可用时生效。否则禁用 JS 的用户会看到一整页空白——这是「用 JS 做动画」最经典的翻车方式。`<head>` 里那行内联脚本负责第一时间打标记：

```html
<script>document.documentElement.classList.add("js");</script>
```

它必须内联、必须在 `<head>`、必须早于任何样式表生效，否则会出现「先正常显示，再突然隐藏，再淡入」的闪屏。

### 7. 3D 倾斜：把鼠标坐标写进 CSS 变量

```js
card.addEventListener('pointermove', function (e) {
  if (frame) return;                         // rAF 节流：120Hz 鼠标每秒触发 120 次
  frame = requestAnimationFrame(function () {
    var r = card.getBoundingClientRect();
    var px = (e.clientX - r.left) / r.width - 0.5;
    var py = (e.clientY - r.top) / r.height - 0.5;
    inner.style.setProperty('--ry', (px * 7).toFixed(2) + 'deg');
    inner.style.setProperty('--rx', (-py * 7).toFixed(2) + 'deg');
    frame = null;
  });
});
```

```css
.card__link {
  transform: perspective(900px) rotateX(var(--rx, 0deg)) rotateY(var(--ry, 0deg));
  transition: transform .35s var(--ease);
}
```

**7 度是经验上限**：再大就显得廉价，而且文字会因为透视而模糊。倾斜只在 `(hover: hover) and (pointer: fine)` 下初始化——触屏设备上 `pointermove` 会和滚动打架。

### 8. 触发时机的三条纪律

1. **首屏常驻动画不超过 3 个**：本站是粒子 + 扫描线 + 全息核心。再多，LCP 和注意力都会被吃掉。
2. **滚动动画只播一次**：`unobserve` 之后不再重播。反复播放的入场动画会让长文阅读变得焦躁。
3. **交互动画只做增强**：hover 效果必须在没有 hover 的设备上完全不影响可用性；进度条、目录高亮属于「有更好，没有也能读」。

## 五、响应式与性能

### 1. 断点策略：三个就够

| 断点 | 变化 |
|---|---|
| `≤ 1024px` | Hero 变单列、视觉元素提到标题上方；目录隐藏；关于页单列 |
| `≤ 820px` | 导航收进汉堡菜单；工具栏纵向排列；头图降为 96px 高 |
| `≤ 520px` | 容器边距 18px；数字区 2×2 网格；信号面板单列；扫描线透明度降到 .35 |

断点不是「设备型号」，而是「内容开始挤不下」的位置。判断方法很简单：把浏览器拉到 1440 / 1024 / 820 / 520 / 375 五档，看哪一档开始出现换行难看、文字压边。

移动端刻意做的**降级清单**：

- 粒子数量随面积下降（下限 26 个）
- 3D 倾斜、光标光晕只在支持 hover 的精细指针设备启用
- 扫描线透明度降低（小屏像素密度高，同透明度会更糊）
- hero 最小高度改 `auto`，避免移动端地址栏收缩导致高度跳动
- 详情页目录隐藏（移动端有原生滚动条就够）

### 2. 性能预算：给自己定死红线

| 指标 | 预算 | 说明 |
|---|---|---|
| 首页 HTML | < 30KB | 含内联骨架，不压缩 |
| CSS | < 60KB | 单文件，gzip 后约 9KB |
| JS | < 30KB | 单文件，gzip 后约 5KB |
| SVG 资源合计 | < 40KB | 4 个文件 |
| 首屏请求数 | ≤ 6 | HTML / CSS / JS / 2 个 SVG / 字体 |
| LCP | < 1.5s | 本地静态预览约 0.5~0.7s |
| CLS | < 0.05 | 图片写死宽高，实测 0 |
| 单帧 JS 执行 | < 4ms | 粒子循环约 1ms |
| Lighthouse Performance | ≥ 95 | 关闭节流后测 |

预算超标就优化，不要用「看起来还行」自我安慰。

### 3. 资源加载顺序

```html
<!-- 1. 字体：先建连，再用 print 技巧异步加载，不阻塞首屏渲染 -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet"
      href="https://fonts.googleapis.com/css2?family=Orbitron:wght@600;800;900&display=swap"
      media="print" onload="this.media='all'">

<!-- 2. 关键 CSS：同步加载。单文件且体积小，内联反而破坏缓存 -->
<link rel="stylesheet" href="/src/styles/cyber.css">

<!-- 3. 首屏 SVG 提高优先级 -->
<img src="/assets/holo-core.svg" width="560" height="560" fetchpriority="high">

<!-- 4. 首屏以下的图懒加载 -->
<img src="/assets/data-stream.svg" width="640" height="180" loading="lazy">

<!-- 5. JS 用 module（自带 defer），不阻塞解析 -->
<script type="module" src="/src/main.js"></script>
```

`media="print" onload="this.media='all'"` 是经典的「不阻塞 CSS」技巧：浏览器把它当打印样式表，不等它就开始渲染首屏，加载完成后切回 `all`。即使 Google Fonts 被墙，`--font-display` / `--font-mono` 的 fallback 栈（Bahnschrift / Consolas / 系统字体）也能保证版面不塌——**赛博感有 60% 来自字号、字距和字重，而不是具体哪款字体**。

### 4. 动画性能的三条铁律

1. **只动 `transform` 和 `opacity`**。这两个属性走合成器线程，不触发 layout / paint。动 `width`、`top`、`margin`、`box-shadow` 会每帧重排或重绘，必掉帧。
2. **`will-change` 要克制**。只在动画期间加，结束就移除。给几十个元素常驻 `will-change: transform`，等于给显存开几十个合成层。
3. **短爆发优于常驻抖动**。故障效果 6 秒才爆发 40ms，其余时间伪元素被 `clip-path` 完全裁掉，几乎零成本。让它一直抖，既伤眼也伤 GPU。

### 5. 无障碍与降级：不是可选项

```css
@media (prefers-reduced-motion: reduce) {
  html { scroll-behavior: auto; }
  *, *::before, *::after {
    animation-duration: .001ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: .001ms !important;
  }
  .fx--scanlines,
  .hero__grid::before { animation: none; }
  .cursor-glow { display: none; }
  .boot { display: none; }
  html.js [data-reveal] { opacity: 1; transform: none; }
}
```

JS 侧同步尊重这个信号：`reduceMotion` 为真时，粒子只画一帧静态图、打字机直接显示整句、倾斜与光晕不初始化、开机遮罩直接移除。

```js
var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
```

系统设置里打开「减弱动态效果」的用户，通常是前庭功能敏感人群。**降级不是体贴，是及格线。**

## 六、从环境搭建到部署：完整步骤

### 步骤 1：检查环境

只需要 Node.js 18+（推荐 20 / 22 LTS）。Vite 7 要求 Node 20.19+ 或 22.12+。

```bash
node -v    # v22.22.2
npm -v     # 10.9.7
```

没有 Node 的话，去 nodejs.org 装 LTS 版本，或者用版本管理器：

```bash
# macOS / Linux
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
nvm install 22 && nvm use 22

# Windows（PowerShell）
winget install OpenJS.NodeJS.LTS
```

### 步骤 2：拿到项目并安装依赖

```bash
git clone <your-repo> cyberblog
cd cyberblog
npm install
```

国内网络慢的话换镜像（只影响下载速度，不改产物）：

```bash
npm install --registry=https://registry.npmmirror.com
```

安装完成后你会有 `node_modules/`（约 10MB）和 `package-lock.json`。**`node_modules` 不提交，`package-lock.json` 必须提交**——后者锁定版本，保证半年后 CI 构建出的产物和今天一致。

### 步骤 3：本地开发

```bash
npm run dev
# ➜ http://localhost:4321/
```

开发服务器的行为要点：

- **改 `src/styles/cyber.css`、`src/main.js`**：Vite 热更新（HMR），样式改了不刷新页面，JS 改了自动 reload。
- **改 `content/*.md`**：插件监听 `content/` 目录，重新生成 HTML 并整页刷新，控制台打印 `[cyberblog] content\xxx.md → rebuilt in 90ms (full reload)`。
  这里有个坑值得说：chokidar 回调拿到的可能是**相对路径**（`content\x.md`），直接和绝对路径 `startsWith` 比较会永远不成立，监听看起来「没反应」。所以插件里先 `path.resolve` 归一化再比较，顺便把反斜杠统一成正斜杠，Windows 上才不会踩雷。
- **新增 md 文件**：需要重启一次 dev 服务器（新页面要进 Vite 的入口表）。
- **改 `scripts/templates.mjs`**：重启 dev 服务器（模板在 `config()` 阶段执行）。

### 步骤 4：构建

```bash
npm run build
```

输出大致如下：

```text
vite v7.x building for production...
✓ 9 modules transformed.
dist/index.html                            18.4 kB
dist/posts/index.html                      12.1 kB
dist/posts/cyberpunk-blog-tutorial.html    41.3 kB
...
dist/assets/index-<hash>.css               38.9 kB │ gzip: 8.7 kB
dist/assets/index-<hash>.js                13.9 kB │ gzip: 4.8 kB
dist/assets/holo-core.svg                   6.6 kB
✓ built in ~400ms
```

值得注意的三件事：

1. **HTML 是「每个页面一个文件」**，体积就是内容本身，没有运行时解析成本。
2. **CSS / JS 文件名带 hash**，可以放心设一年缓存：内容变了文件名就变了。
3. **`dist/` 里没有 `node_modules`，也没有 markdown-it / highlight.js**——它们只在构建机器上存在。

### 步骤 5：本地验收

```bash
npm run preview
# ➜ http://localhost:4321/ （serve 的是 dist/，和线上完全一致）
```

必须用 `preview` 而不是直接双击 `dist/index.html`：`file://` 协议下模块脚本会被 CORS 拦住。

验收时打开 DevTools 三个面板：

- **Performance**：录 5 秒，FPS 应稳定在 60，长任务（红线）不超过 50ms
- **Rendering → Paint flashing**：不应出现大面积绿色闪烁（说明没有持续重绘）
- **Lighthouse**：Performance / Accessibility / Best Practices / SEO 四项

### 步骤 6：部署

产物是纯静态文件，任选一种。

**A. GitHub Pages**

新建 `.github/workflows/deploy.yml`（仓库已自带）：

```yaml
name: deploy
on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - run: npm run build
        env:
          BASE: ${{ github.event.repository.name }}
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist
  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment: github-pages
    steps:
      - uses: actions/deploy-pages@v4
```

关键点：**`BASE=<repo>`**（只写仓库名，不带斜杠）。因为 GitHub Pages 的项目站点跑在 `https://user.github.io/<repo>/` 子路径下，必须让 Vite 用 `/repo/` 前缀改写静态资源 URL，否则 CSS 会 404。`vite.config.mjs` 会自动把它补成 `/repo/`。

然后到仓库 Settings → Pages，Source 选 **GitHub Actions**。第一次 push 后自动上线。

**B. Netlify**

仓库根目录的 `netlify.toml` 已经写好：

```toml
[build]
  command = "npm run build"
  publish = "dist"

[[headers]]
  for = "/assets/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"
```

接 Git 仓库即可；也可以直接把 `dist/` 拖到 Netlify Drop。

**C. Vercel**

```bash
npm i -g vercel
vercel --prod
# Framework Preset: Other，Output Directory: dist，Build Command: npm run build
```

**D. Cloudflare Pages**

Build command `npm run build`，Output directory `dist`，其余留空。全球边缘节点，国内访问通常比 Vercel 稳。

**E. 自己的服务器（Nginx）**

```bash
rsync -avz --delete dist/ user@server:/var/www/neon-edge/
```

```nginx
server {
    listen 80;
    server_name blog.example.com;
    root /var/www/neon-edge;
    index index.html;

    location / {
        try_files $uri $uri/ $uri.html =404;
    }
    error_page 404 /404.html;

    # 带 hash 的资源可以永久缓存
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }
    # HTML 必须回源，否则更新后用户看不到新内容
    location ~* \.html$ {
        add_header Cache-Control "no-cache";
    }

    gzip on;
    gzip_types text/css application/javascript image/svg+xml application/xml;
}
```

### 步骤 7：上线后收尾

- 把 `scripts/site.config.mjs` 里的 `url` 改成真实域名（`sitemap.xml`、`feed.xml`、`robots.txt` 都用它）
- 到 Google Search Console / 百度站长提交 `sitemap.xml`
- 把 `feed.xml` 塞进 RSS 阅读器，确认能正常订阅
- 用 PageSpeed Insights 测线上地址（本地分数会偏高，因为线上有网络延迟）

## 七、日常写作流程

新增一篇文章 = 新建一个 md 文件，然后 git push。

```bash
cat > content/2026-10-20-my-post.md <<'EOF'
---
title: 文章标题
slug: my-post
date: 2026-10-20
tags: 随笔, 动效
summary: 出现在卡片上的一句话摘要。
---

正文用标准 Markdown 写。代码块用三个反引号包裹并标注语言，构建期会自动高亮。
EOF

npm run dev     # 本地看效果
git add . && git commit -m "post: my-post" && git push
```

front matter 字段说明：

| 字段 | 必填 | 作用 |
|---|---|---|
| `title` | 是 | 页面标题、卡片标题、`<title>` |
| `slug` | 否 | 产物文件名与 URL；缺省时从文件名去掉日期前缀推断 |
| `date` | 是 | 排序依据（`YYYY-MM-DD` 字符串倒序） |
| `tags` | 否 | 逗号分隔；第一个作为卡片角标，全部用于过滤 |
| `summary` | 否 | 卡片摘要 + meta description |

阅读时长由构建器自动估算：`中文汉字数 / 350 + 英文词数 / 200`。

在文章里放动图/图片，两条路径：

```html
<!-- 1. 普通图片：放 public/assets/，构建时原样拷贝 -->
<img src="/assets/screenshot.png" alt="描述" width="1200" height="630" loading="lazy">

<!-- 2. 动图：优先 SVG（SMIL）或视频 -->
<img src="/assets/loop.svg" alt="描述" width="640" height="360" loading="lazy">
<video src="/assets/loop.webm" width="640" height="360" autoplay muted loop playsinline></video>
```

Markdown 里直接写 `<img>` / `<video>` 是可行的，因为 `markdown-it` 开了 `html: true`。

## 八、常见问题排查

| 现象 | 原因 | 修复 |
|---|---|---|
| 页面空白，元素全不见 | `html.js [data-reveal]` 生效了但 IO 没跑 | 检查 `/src/main.js` 是否 404；或临时删掉 `html` 上的 `js` 类验证 |
| 整篇正文永远不显示 | `data-reveal` 加在比视口高几十倍的元素上，`threshold: 0.08` 的可见比例永远达不到 | `threshold` 改 `0`，或干脆不给正文加 reveal（本站就是不给） |
| Windows 下构建报 `fileName ... must not be absolute` | 项目放在目录联结 / 软链下，`root` 与入口文件不在同一盘符，`path.relative` 返回绝对路径 | 配置里用 `realpathSync` 统一 `root`（`vite.config.mjs` 已处理） |
| 构建报 `Could not resolve entry` | 生成的 HTML 不存在 | 确认 `config()` 里 `generateSite()` 先跑且没抛错；`content/` 至少要有 1 篇 md |
| 部署到子路径后样式丢失 | 静态资源没走 `base` | `BASE=repo npm run build`，并检查是否有硬编码的绝对路径 |
| 代码块撑破布局 | 栅格列没写 `minmax(0, 1fr)` | 改成 `grid-template-columns: minmax(0,1fr) auto` |
| 扫描线有接缝 | 位移距离 ≠ 图案周期 | 3px 图案必须位移 3px |
| 字体没生效 | Google Fonts 被墙 | 换系统字体栈，或自托管 woff2 到 `public/fonts/` |
| SVG 动图不动 | 用了 `background-image` 或内含脚本 | SMIL 在 `<img>` 里可用，脚本不行；改 `<img>` 引用 |
| 改 md 不生效（dev） | 新增文件没进入口表 | 重启 `npm run dev` |
| 动画在低端机卡顿 | 用 `box-shadow` / `filter` 做逐帧动画 | 改用 transform/opacity，或按媒体查询降级 |
| 每篇文章标题都一样 | `<title>` 没走模板变量 | 检查 `layout()` 的 `title` 是否传了 `post.title` |
| 中文锚点链接失效 | `slugify` 把中文过滤掉了 | 本项目用 `\p{L}` 保留中英文，确认没改成 `[a-z0-9]` |

## 九、验收清单

上线前逐项打勾：

- [ ] `npm run build` 无报错，`dist/` 里 HTML 数量 = 文章数 + 4
- [ ] `npm run preview` 下 320 / 768 / 1024 / 1440 四档宽度无横向滚动条
- [ ] 键盘 Tab 能走完「导航 → 卡片 → 正文链接」，焦点框可见
- [ ] 系统开启「减弱动态效果」后，页面无持续动画，内容完整可读
- [ ] DevTools 断网后刷新，字体回退但版面不塌
- [ ] Lighthouse Performance ≥ 95，CLS = 0
- [ ] 每篇文章 `title` / `description` / `og:title` 唯一
- [ ] `sitemap.xml` / `feed.xml` / `robots.txt` / `.nojekyll` 均已生成
- [ ] 手机真机上看一眼首屏——模拟器看不出滚动惯性带来的抖动

> 赛博朋克的视觉内核不是「东西多」，而是「信息在噪声中依然能被读清」。所有霓虹、故障、扫描线，都服务于这一件事。动画是修辞，不是内容。

到这里你已经有一套可复用的模板：改 `src/styles/cyber.css` 里的 `--cyan` / `--magenta` 就是另一套冷色或毒性绿视觉，换掉 `content/` 就是另一个博客。剩下的，就是持续往里写东西。

## 十、加餐：亮色「二次元」背景与一键切换

暗色看久了会想换个口味，所以站里加了一个右下角的切换按钮：**经典暗色 ⇄ 亮色二次元**，点一下 0.55 秒交叉淡入，不刷新页面，选择记在 `localStorage`。

实现上只解决三个问题：**动图怎么来**、**怎么铺满还不挡内容**、**亮色主题怎么不重写一遍 CSS**。

### 1. 动图仍然是 SVG，不是 GIF

`public/assets/anime-bg.svg` 是一个 24KB 的 SMIL 动图：渐变天空、漂移的云、飘落的樱花（30 片，各自不同的时长与旋转速度）、会呼吸的太阳、闪烁的星芒。同等观感的 GIF 大概要 3MB，而且放大就糊。

### 2. 一个固定层 + 一层白纱

```html
<div class="bg-anime" aria-hidden="true">
  <img class="bg-anime__art" src="/assets/anime-bg.svg" alt="" width="1600" height="1000">
  <span class="bg-anime__veil"></span>
</div>
```

```css
.bg-anime {
  position: fixed; inset: 0; z-index: 0;
  opacity: 0; visibility: hidden;
  pointer-events: none;                    /* 关键：不拦截滚动和点击 */
  transition: opacity .55s var(--ease), visibility .55s;
}
.bg-anime__art { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
.bg-anime__veil {                          /* 把动图压成浅底，保证文字对比度 */
  position: absolute; inset: 0;
  background: linear-gradient(180deg, rgba(255,255,255,.24), rgba(255,250,252,.42) 46%, rgba(255,255,255,.64));
}
html[data-theme="anime"] .bg-anime { opacity: 1; visibility: visible; }
html[data-theme="anime"] #bg-canvas { opacity: 0; }   /* 粒子星网在亮色下会变脏，淡出 */
```

三个细节：

- `object-fit: cover` 保证任意屏幕比例都铺满，不拉伸、留白；`object-position: 50% 42%` 让视觉重心落在太阳与天空，而不是被裁在底部。
- `pointer-events: none` 是必须的。背景层一旦能接收事件，整页的 hover、点击、滚动都会被它吃掉。
- 白色柔化层是**可读性的保险**：亮色主题下正文直接用深灰 `#33374f`，配 24%~64% 的白纱，对比度稳定在 7:1 以上。

### 3. 主题 = 一套 CSS 变量 + 一段临时过渡

亮色主题没有重写组件，只覆盖令牌：

```css
html[data-theme="anime"] {
  --text: #2c2f45;
  --text-dim: #4b4f68;
  --muted: #6d7190;
  --cyan: #0b93a8;      /* 霓虹青在浅底上会糊，需要压深 */
  --magenta: #d9366e;
  --panel: rgba(255, 255, 255, .76);
}
```

然后是几十条 `html[data-theme="anime"] .xxx` 的定点修正——因为暗色主题里有些颜色是写死的（`.card` 的渐变、`.prose` 的 `#c9d6e8`、`.post__title` 的 `#f4f9ff`）。这是纯暗色设计切亮色必然要付的成本：**变量能覆盖的用变量，写死的老老实实补一条**。

切换的平滑感来自一个「临时全局过渡」：

```js
root.classList.add('is-theme-switching');
setTimeout(() => root.classList.remove('is-theme-switching'), 620);
```

```css
html.is-theme-switching *,
html.is-theme-switching *::before,
html.is-theme-switching *::after {
  transition: background-color .55s var(--ease), color .55s var(--ease),
              border-color .55s var(--ease), opacity .55s var(--ease) !important;
}
```

只在切换的那 620ms 里给所有元素挂上颜色过渡，之后立刻摘掉。这样既拿到了「整页一起渐变」的效果，又不会让 hover、折叠、倾斜这些常规动画被 `transition: all` 拖慢。

### 4. 两个必须踩过的坑

- **刷新会闪回暗色**：`data-theme` 是 JS 加的，而 JS 在 `<body>` 末尾才执行，首帧一定是暗的。解法是把读取 `localStorage` 的脚本内联进 `<head>`，早于 CSS 生效：

  ```html
  <script>(function(){try{if(localStorage.getItem("neon-theme")==="anime")document.documentElement.setAttribute("data-theme","anime")}catch(e){}})();</script>
  ```

- **减少了动效的用户不该看到淡入**：`prefers-reduced-motion: reduce` 时把 `.bg-anime` 的 `transition` 直接关掉，切换变成立即生效。功能不减，只是不再渐变。

按钮本身也做了三件事：图标与文案随主题反转（太阳/「二次元」⇄ 月亮/「经典」）、`aria-pressed` 同步状态、`mobile` 下缩到 14px 边距并在 380px 以下退化成纯图标圆钮。
