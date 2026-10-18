# NEON//EDGE

一个赛博朋克风格的静态博客：霓虹、故障字、扫描线、粒子星网，以及克制到 60 帧的动效。

- **构建**：Vite 7 + markdown-it（构建期依赖 4 个，产物零运行时依赖）
- **内容**：`content/*.md` + front matter，改完 push 就发布
- **动效**：原生 CSS 动画 + 原生 JS + SMIL 动画 SVG（没有一张 GIF，动图仅 12KB）
- **三套皮肤**：右下角按钮轮转「赛博（默认，暗色霓虹 + 粒子星网）→ 卡通（厚描边 + 硬投影 + 卡通天空）→ 二次元（磨砂玻璃 + 淡彩壁纸）」，0.55s 交叉淡入、无刷新、localStorage 记忆
- **内容页**：首页 / 日志（筛选+搜索）/ 归档（按年份）/ 友链 / 关于 / 404 / RSS
- **评论**：Giscus（GitHub Discussions），未配置时显示开通步骤，不会请求外部脚本
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

仓库自带 `.vscode/`：`Ctrl+Shift+B` 直接跑默认任务（=`npm run dev`），任务面板里还有 `build`、`preview(构建产物)`、**`发布（构建 + 提交 + 推送）`**。推荐扩展会在右下角弹出提示，装不装都不影响运行。

### 只用鼠标发布

改完内容后不用敲 git 命令，两种点法：

**A. VSCode 内置按钮（3 步）**
1. `Ctrl+Shift+G` 打开源代码管理 → 改动都在 Changes 里
2. 点 `+` 全部暂存 → 填一句提交信息 → 点 **✓ Commit**
3. 点状态栏左下角的 **Sync Changes**（或 `...` 菜单 → Push）

**B. 一个任务搞定（推荐）**
`Ctrl+Shift+P` → `Tasks: Run Task` → **发布（构建 + 提交 + 推送）** → 输入提交说明 → 回车。
它会依次执行「本地构建校验 → git add → commit → push」，构建失败就停住，不会把坏代码推上去。

> 两者效果一样：push 后约 60 秒 GitHub Actions 自动构建并发布。
> 没有改动时任务会跳过 commit，直接 push（显示 Everything up-to-date），不会报错。

## 常用命令

| 命令 | 作用 |
|---|---|
| `npm run dev` | 开发服务器（HMR + md 热重建），端口 4321 |
| `npm run build` | 构建到 `dist/` |
| `npm run preview` | 用静态服务器预览 `dist/`（和线上一致） |
| `npm run stop` | 关掉占用 4321 的本地服务（终端关了/进程找不到时用） |
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
scripts/          构建器：markdown 渲染 / 模板 / 页面生成 / Vite 插件 / 友链数据
src/main.js       交互层：粒子、打字机、进场、倾斜、搜索过滤、背景切换
src/styles/       cyber.css：设计系统 + 全部 CSS 动画 + 代码高亮 + 亮色主题
public/assets/    SVG 动图（含二次元背景）、logo、favicon（原样拷贝进 dist）
dist/             构建产物，可直接部署
```

## 背景切换

右下角固定按钮：赛博 → 卡通 → 二次元 三态轮转（默认赛博）。点击即时生效，不刷新页面，选择记在 `localStorage`（key：`neon-theme`），刷新后保持；首次加载由 `<head>` 里的内联脚本提前写入 `data-theme`，不会闪一下暗色。

- **背景图**：`public/assets/cartoon-bg.svg`（卡通天空：太阳/云/草地/气泡）、`public/assets/anime-bg.svg`（二次元淡彩） —— 纯 SMIL 动图（流云 / 樱花 / 光斑 / 太阳），24KB，无限缩放不糊
- **换成自己的图**：把 gif / webp / mp4 丢进 `public/assets/`，改 `scripts/templates.mjs` 里 `.bg-anime__art` 的 `src` 即可；`object-fit: cover` 已保证铺满
- **铺满与可读性**：`.bg-anime` 是固定层，`z-index: 0` + `pointer-events: none`，不挡滚动与点击；上面盖一层 `.bg-anime__veil`（白色 24%→64% 渐变）压住背景，配合亮色文字令牌保证对比度
- **配色**：亮色主题的所有颜色都在 `cyber.css` 的 `html[data-theme="anime"]` 块里，改令牌即可整体换肤

## 友链与评论

**友链**：改 `scripts/links.mjs`，加一条对象就是一张卡片（`name` / `url` / `desc` / `tags`，可选 `avatar` 外链头像）。不填头像时用站点名首字生成字母牌，避免外链裂图。申请规则在同文件的 `LINKS_NOTE`。

**评论**：用 Giscus（基于 GitHub Discussions，免费、无广告、不用自建后端）。

1. 仓库 Settings → General → Features 勾上 **Discussions**
2. 打开 <https://github.com/apps/giscus>，安装到该仓库
3. 打开 <https://giscus.app/zh-CN> 填仓库名，复制 `data-repo-id` 与 `data-category-id`
4. 写进 `scripts/site.config.mjs` 的 `giscus` 字段，重新构建

没填这四项时，文章页会显示一段「如何开启」的说明面板，**不会请求任何 giscus 脚本**。配置后评论区会懒加载（滚到距视口 600px 才拉脚本），并跟随亮/暗主题自动换肤。

## 部署

**GitHub Pages**：仓库已带 `.github/workflows/deploy.yml`，push 到 `main` 即自动构建。到 Settings → Pages 把 Source 设为 **GitHub Actions**。
项目站点在子路径下，工作流会自动传 `BASE=<repo>`，无需改配置。

**Netlify / Vercel / Cloudflare Pages**：Build command `npm run build`，Output directory `dist`。

**自己的服务器**：`rsync -avz --delete dist/ user@host:/var/www/blog/`，Nginx 配置见教程第六节。

## 自定义

- 站点标题 / 作者 / 域名 / 邮箱 → `scripts/site.config.mjs`
- 配色 → `src/styles/cyber.css` 顶部 `:root`（`--cyan` `--magenta` `--violet` `--amber`）；亮色主题在同文件的 `html[data-theme="anime"]`
- 动效开关 → `src/main.js` 里的 `reduceMotion` / `finePointer` 判断
- 字体 → `scripts/templates.mjs` 里的 Google Fonts `<link>`，或换成本地 woff2
- **分享缩略图**（微信 / QQ / TG 的预览卡）→ 改 `scripts/og-cover.html`，然后重新截一张 1200×630 的 PNG：

  ```bash
  # 直接用浏览器打开 scripts/og-cover.html（走 file:// 即可，不依赖本地服务），
  # 或用命令行截图（Windows 的 Edge）：
  "/c/Program Files (x86)/Microsoft/Edge/Application/msedge.exe" --headless=new \
    --hide-scrollbars --window-size=1200,630 \
    --screenshot=public/assets/og-cover.png \
    "file:///$(pwd)/scripts/og-cover.html"
  ```

  改完图片要重新 `npm run build`（`public/` 下的文件是原样拷贝进 `dist/`）。
