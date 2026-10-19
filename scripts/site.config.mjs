/**
 * 站点配置：改这里就够了
 * 换配色去 src/styles/cyber.css 的 :root，换内容去 content/
 */
export const SITE = {
  title: 'MAGIC//BLOG',
  tagline: '在信号的边缘写代码',
  author: '奶龙肘子',
  role: '后端开发者 / 摆烂之人 / 奶龙大王',
  desc: '奶龙的超级无敌blog',
  email: 'zjzxh123.zj@outlook.com',
  // 线上地址（自定义域名，根路径部署）。sitemap / robots / RSS 都用它，改完记得重新构建
  url: 'https://milk-dragon.cn',
  locale: 'zh-CN',
  // 首页首屏那颗小胶囊里的文字
  chip: 'SYSTEM ONLINE · 2026 · NODE 07',
  // 首页打字机轮播的三句话（用 | 分隔，写几句都行）
  heroWords: [
    '我是奶~我是奶龙~',
    '不过些许风霜罢了',
    '落魄谷中寒风吹，春秋蝉鸣少年归',
    '仰天大笑出门去，我辈岂是蓬蒿人',
  ],
  // 卡片配色轮换，顺序对应 --cyan / --magenta / --violet / --amber
  accents: ['cyan', 'magenta', 'violet', 'amber'],

  // 浏览器标签页里 <title> 的后缀
  subtitle: '神秘博客',

  /**
   * 关于页（OPERATOR）
   * readme 与 quote 支持少量 HTML（<strong> <code> <a>），其余按纯文本转义
   */
  about: {
    sub: '一个把后端逻辑写进霓虹里的人。',
    location: '浙江 / CN',
    stack: 'Go · Python · CSS · JS',
    status: 'AVAILABLE',
    readme: [
      '我在做后端，也在当奶龙。白天努力当奶龙，夜里调霓虹与噪点。',
      '这个站是一个实验：<strong>用极少的构建期依赖，做出不掉帧的静态博客</strong>。内容用 Markdown 写，Vite 负责打包，动效是原生 CSS + 原生 JS + SVG/SMIL，部署到任何静态托管都能跑。',
    ],
    quote: '好的动效不是炫技，是在 16.7ms 的预算里讲清楚一件事。',
    timeline: [
      {
        date: '2026.10',
        title: 'MAGIC//BLOG 上线',
        desc: 'Vite + markdown-it 静态博客，赛博 / 卡通 / 二次元三套皮肤。',
      },
      {
        date: '2026.08',
        title: '孤独市集二期',
        desc: 'Go + Gin + GORM 的校园二手交易后端，购买请求工作流。',
      },
      {
        date: '2024.09',
        title: '开始写代码',
        desc: '从 python语言开始。',
      },
    ],
  },

  // 首页底部那张 CTA 卡片（desc 支持 HTML）
  cta: {
    kicker: '// 启动',
    title: '把想法写进日志，让奶龙替你通电。',
    desc: '啊吧~~啊吧~~',
    button: '浏览全部日志',
  },

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
    repo: 'GOOD-BOY-cool/cyberblog',
    repoId: 'R_kgDOVOU7PA',
    category: 'General',
    categoryId: 'DIC_kwDOVOU7PM4DI_Wt',
  },
}
