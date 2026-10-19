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
    name: 'Luomic',
    url: 'https://blog.luomic.com/',
    desc: '超级无敌大手，吓哭了。',
    tags: ['大手子'],
  },
  {
    name: '精弘',
    url: 'https://www.myzjut.org/',
    desc: '神秘的组织',
    tags: ['组织'],
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
