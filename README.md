# NEON//EDGE

一个赛博朋克风格的静态博客：霓虹、故障字、扫描线、粒子星网，以及克制到 60 帧的动效。

- **构建**：Vite 7 + markdown-it（构建期依赖 4 个，产物零运行时依赖）
- **内容**：`content/*.md` + front matter，改完 push 就发布
- **动效**：原生 CSS 动画 + 原生 JS + SMIL 动画 SVG（没有一张 GIF，动图仅 12KB）
- **部署**：纯静态，GitHub Pages / Netlify / Vercel / Cloudflare / Nginx 都能跑

> 完整施工教程就在站点里：`content/2026-10-18-cyberpunk-blog-tutorial.md`
> 跑起来后访问 `/posts/cyberpunk-blog-tutorial.html`，或直接读这份 Markdown。
>
> 只想写文章 / 只想部署：看 **`docs/写作与部署.md`**（front matter 字段、Markdown 支持范围、图片与动图规范、GitHub Pages 全流程与排错表）。

## 快速开始

```bash
cd cyberblog        # 注意要进到 cyberblog 这一层，不是它的上级目录
npm install         # 首次
npm run dev         # http://localhost:4321
```

改文章 → 存盘 → 浏览器自动刷新。改样式 → 热更新，不刷新页面。

### 在 VSCode 里跑

```bash
code cyberblog      # 或在 VSCode 里 File → Open Folder 选中 cyberblog
```

仓库自带 `.vscode/`：`Ctrl+Shift+B` 直接跑默认任务（=`npm run dev`），任务面板里还有 `build` 和 `preview(构建产物)`。推荐扩展会在右下角弹出提示，装不装都不影响运行。

## 常用命令

| 命令 | 作用 |
|---|---|
| `npm run dev` | 开发服务器（HMR + md 热重建），端口 4321 |
| `npm run build` | 构建到 `dist/` |
| `npm run preview` | 用静态服务器预览 `dist/`（和线上一致） |
| `npm run clean` | 删除 `dist/` |

## 写一篇新文章

```bash
cat > content/2026-10-20-my-post.md <<'EOF'
---
title: 文章标题
slug: my-post
date: 2026-10-20
tags: 随笔, 动效
summary: 卡片上显示的一句话摘要。
---

正文……
EOF
```

| 字段 | 必填 | 说明 |
|---|---|---|
| `title` | 是 | 页面标题 / 卡片标题 |
| `slug` | 否 | URL 与文件名；缺省时取文件名去掉日期前缀 |
| `date` | 是 | `YYYY-MM-DD`，用于排序 |
| `tags` | 否 | 逗号分隔，第一个做卡片角标，全部用于过滤 |
| `summary` | 否 | 卡片摘要 + meta description |

## 目录结构

```
content/          文章源文件（唯一需要天天动的目录）
scripts/          构建器：markdown 渲染 / 模板 / 页面生成 / Vite 插件
src/main.js       交互层：粒子、打字机、进场、倾斜、搜索过滤
src/styles/       cyber.css：设计系统 + 全部 CSS 动画 + 代码高亮配色
public/assets/    SVG 动图、logo、favicon（原样拷贝进 dist）
dist/             构建产物，可直接部署
```

## 部署

**GitHub Pages**：仓库已带 `.github/workflows/deploy.yml`，push 到 `main` 即自动构建。到 Settings → Pages 把 Source 设为 **GitHub Actions**。
项目站点在子路径下，工作流会自动传 `BASE=<repo>`，无需改配置。

**Netlify / Vercel / Cloudflare Pages**：Build command `npm run build`，Output directory `dist`。

**自己的服务器**：`rsync -avz --delete dist/ user@host:/var/www/blog/`，Nginx 配置见教程第六节。

## 自定义

- 站点标题 / 作者 / 域名 / 邮箱 → `scripts/site.config.mjs`
- 配色 → `src/styles/cyber.css` 顶部 `:root`（`--cyan` `--magenta` `--violet` `--amber`）
- 动效开关 → `src/main.js` 里的 `reduceMotion` / `finePointer` 判断
- 字体 → `scripts/templates.mjs` 里的 Google Fonts `<link>`，或换成本地 woff2
