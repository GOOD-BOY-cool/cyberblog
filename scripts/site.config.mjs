/**
 * 站点配置：改这里就够了
 * 换配色去 src/styles/cyber.css 的 :root，换内容去 content/
 */
export const SITE = {
  title: 'NEON//EDGE',
  tagline: '在信号的边缘写代码',
  author: 'ZERO',
  role: '后端开发者 / 赛博美学爱好者',
  desc: '一个赛博朋克风格的静态博客：霓虹、噪点、故障艺术，以及 60FPS 的克制。',
  email: 'zjzxh123.zj@outlook.com',
  // 线上地址（自定义域名，根路径部署）。sitemap / robots / RSS 都用它，改完记得重新构建
  url: 'https://milk-dragon.cn',
  locale: 'zh-CN',
  // 首页首屏那颗小胶囊里的文字
  chip: 'SYSTEM ONLINE · 2026 · NODE 07',
  // 首页打字机轮播的三句话（用 | 分隔，写几句都行）
  heroWords: [
    '在信号的边缘写代码',
    '用 4 个构建期依赖做出赛博美学',
    '让动画跑满 60 帧',
  ],
  // 卡片配色轮换，顺序对应 --cyan / --magenta / --violet / --amber
  accents: ['cyan', 'magenta', 'violet', 'amber'],

  /**
   * 评论（Giscus，基于 GitHub Discussions，免费、无广告、无后端）
   * 开启步骤：
   *   1. 仓库 Settings → General → Features 勾上 Discussions
   *   2. 到 https://github.com/apps/giscus 安装到该仓库
   *   3. 打开 https://giscus.app/zh-CN 填仓库名，拿到 data-repo-id 与 data-category-id
   *   4. 把四个值填进来，重新构建
   * 留空则文章页显示「如何开启评论」的占位说明，不会请求任何外部脚本。
   */
  giscus: {
    repo: '',
    repoId: '',
    category: 'General',
    categoryId: '',
  },
}
