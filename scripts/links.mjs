/**
 * 友链数据：改这个文件就能加 / 删 / 排序，不需要动模板
 * - name  站点名
 * - url   主页地址（必须带 https://）
 * - desc  一句话介绍
 * - tags  可选，显示成小标签
 *
 * 头像不引用外部图片：用站点名首字生成字母牌，避免外链挂掉出现「裂图」。
 * 想换成真头像，加一个 avatar: 'https://…/avatar.png'，模板会自动用它。
 */
export const LINKS = [
  {
    name: '阮一峰的网络日志',
    url: 'https://www.ruanyifeng.com/blog/',
    desc: '每周五的技术周刊，中文技术圈最稳定的信息源之一。',
    tags: ['技术周刊'],
  },
  {
    name: 'CSS-Tricks',
    url: 'https://css-tricks.com/',
    desc: 'CSS 技巧与前端工程实践，本站很多动效思路来自这里。',
    tags: ['CSS', '前端'],
  },
  {
    name: 'Josh W. Comeau',
    url: 'https://www.joshwcomeau.com/',
    desc: '把 CSS 动画和交互讲透的人，文章配图一绝。',
    tags: ['动效', '教程'],
  },
  {
    name: 'Vite 官方文档',
    url: 'https://cn.vitejs.dev/',
    desc: '本站的构建工具，中文文档质量很高。',
    tags: ['工具'],
  },
  {
    name: 'MDN Web Docs',
    url: 'https://developer.mozilla.org/zh-CN/',
    desc: '写原生 JS 时最常开的那个标签页。',
    tags: ['参考'],
  },
]

/** 友链申请说明，显示在页面顶部 */
export const LINKS_NOTE = {
  title: '// LINK EXCHANGE',
  rules: [
    '站点内容以技术、设计、写作类原创为主，能正常访问（HTTPS）。',
    '首页已放上本站链接，或愿意在申请后补上。',
    '把「站点名 + 地址 + 一句话介绍」发到邮箱，或在 GitHub 提 issue。',
  ],
  site: 'NEON//EDGE · https://example.com',
}
