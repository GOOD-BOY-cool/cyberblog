---
title: 60 帧的预算表：动画与资源加载的性能红线
slug: perf-budget
date: 2026-10-08
tags: 性能, 动效
summary: 16.7 毫秒不是「目标」，是总预算。给它列一张表：排版多少、绘制多少、脚本多少、剩多少给意外。
---

「动画要流畅」是一句废话。工程上它有一个可量化的答案：**每帧 16.7ms，超了就掉帧**。

60fps 意味着每秒 60 帧，每帧 16.66ms。浏览器的这一帧要做四件事：JS 执行 → 样式计算 → 布局 → 绘制 → 合成。给动画留的总时间，实际上只有 **8~10ms**——因为浏览器自身开销和别的脚本还要占一部分。

所以性能优化不是「让动画快一点」，而是**给每一类操作分配预算，超支就砍**。

## 一张预算表

| 阶段 | 预算 | 典型开销 | 谁在花 |
|---|---|---|---|
| JS 执行 | 4ms | 粒子循环 1.2ms | 事件回调、rAF 逻辑 |
| 样式计算 | 1ms | 0.3ms | 类名切换、CSS 变量更新 |
| 布局（Layout） | 0ms | 0ms | **不应该发生** |
| 绘制（Paint） | 3ms | 1ms | 文字、渐变、阴影 |
| 合成（Composite） | 2ms | 0.6ms | transform / opacity 层 |

「布局应为 0」是硬性要求：动画期间只要触发一次 layout，前面省下的时间全部白费。

## 哪些属性动起来不花钱

| 属性 | 触发阶段 | 结论 |
|---|---|---|
| `transform` | Composite | 放心用 |
| `opacity` | Composite | 放心用 |
| `filter` | Paint（可能 Composite） | 小面积可用，大面积慎用 |
| `background-position` | Paint | 可以，但别覆盖全屏大图 |
| `width` / `height` | Layout + Paint | 动画里禁用 |
| `top` / `left` / `margin` | Layout + Paint | 动画里禁用 |
| `box-shadow` | Paint | 每帧重算模糊，很贵 |
| `clip-path` | Paint | 小面积可用（故障文字就靠它） |

判断方法很直接：DevTools → Rendering → 勾上 **Paint flashing**，绿色区域就是重绘范围。动画时如果整屏泛绿，就该改实现。

## 三个真实的取舍

### 取舍一：网格地面，用 transform 而不是 background-position

错误的写法：

```css
/* 全屏面积，每帧重绘渐变 */
.floor {
  background-image: linear-gradient(...), linear-gradient(...);
  background-size: 72px 72px;
  animation: flow 6s linear infinite;
}
@keyframes flow { to { background-position: 0 72px; } }
```

改成一个**超出容器的内层元素 + transform**：

```css
.floor { overflow: hidden; }
.floor::before {
  content: "";
  position: absolute;
  inset: -80% 0 0 0;
  background-image: linear-gradient(...), linear-gradient(...);
  background-size: 72px 72px;
  animation: flow 6s linear infinite;
}
@keyframes flow { to { transform: translate3d(0, 72px, 0); } }
```

代价是元素面积变大（要 `inset: -80%` 预留位移空间），收益是动画跑在合成器线程，主线程完全不参与。

### 取舍二：噪点用静态 SVG，不要动

`feTurbulence` 做颗粒很美，但**每一帧重算噪点**是灾难：

```css
/* 不要：每帧重新生成噪声 */
.grain { animation: noise .2s steps(4) infinite; }
```

正确做法是生成一张静态噪点图（或内联 SVG data URI），铺满即可：

```css
.fx--grain {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.82' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)'/%3E%3C/svg%3E");
  opacity: .038;
}
```

颗粒感是「静态」的，肉眼分辨不出它有没有动——但 GPU 省下了每帧的滤波计算。这是一个典型的「视觉无损、性能白赚」。

### 取舍三：will-change 用完就撤

```css
[data-reveal] { will-change: opacity, transform; }
[data-reveal].is-visible { will-change: auto; }
```

`will-change` 会提前把元素提升为独立合成层。用了不撤，页面上几十个卡片就是几十个层，显存暴涨，在低端机上反而更卡。

**规则：只在动画即将发生或正在发生的那段时间里加。**

## 资源加载：请求数也是预算

| 资源 | 本项目做法 | 省下的 |
|---|---|---|
| 字体 | `media=print` 异步加载 + 系统字体兜底 | 首屏不等字体，LCP 提前 ~300ms |
| CSS | 单文件，不拆包 | 请求数 1，无瀑布 |
| JS | 单文件 + `defer` | 不阻塞解析 |
| 图片 | 全 SVG，无位图 | 4 个动图合计 22KB |
| 首屏之外 | `loading="lazy"` | 首屏请求 5 个 |
| 缓存 | 静态资源 `max-age=604800` | 二次访问 0 请求 |

字体那一招值得单独说：

```html
<link rel="stylesheet"
      href="https://fonts.googleapis.com/css2?family=Orbitron:wght@800&display=swap"
      media="print" onload="this.media='all'">
```

浏览器把它当打印样式表处理，不会阻塞首屏渲染；下载完成后 `onload` 把它切回 `all`。配合 `display=swap`，字体到达前后都不会出现「不可见文字」。

**但前提是你的 fallback 栈要好看**：

```css
--font-display: "Orbitron", "Rajdhani", "Bahnschrift", "Segoe UI", system-ui, sans-serif;
```

如果兜底是 `serif`，字体加载前后版面会跳变，CLS 直接爆表。

## CLS：被忽视的「第三指标」

CLS（累积布局偏移）衡量的是「内容突然跳一下」。赛博风站点特别容易踩，因为大量使用绝对定位和装饰元素。

三条防线：

1. **所有 `img` 写死 `width` / `height`**，尤其是 SVG——SVG 没有固有尺寸时，加载前高度是 0。
2. **装饰层用 `position: fixed` 或 `absolute`**，不参与文档流。
3. **字体调度**用 `font-display: swap`，并且保证 fallback 的 `line-height` 与目标字体接近。

```html
<img src="assets/holo-core.svg" alt="" width="560" height="560">
```

## 测量，而不是猜测

```text
1. DevTools → Performance → 录制 5s → 看 FPS 条是否绿色连续
2. 看 Main 轨道有没有超过 50ms 的黄色长任务
3. Rendering → Paint flashing：动画时不应整屏泛绿
4. Rendering → Layer borders：合成层数量是否异常膨胀
5. Lighthouse → 看 LCP / CLS / INP 三项
```

本项目在本地静态服务下的参考值：

| 指标 | 数值 |
|---|---|
| FPS（滚动 + 粒子 + 倾斜） | 58~60 |
| 最长任务 | 38ms（仅首屏初始化一次） |
| LCP | 0.6s |
| CLS | 0 |
| INP | 42ms |

## 一句话总结

性能优化不是让动画更快，而是**让每一帧都有余量**。当你的粒子循环只花 1.2ms、动画只动 transform、噪点静态预生成、字体不阻塞首屏——剩下的 15ms 就是「流畅」的全部秘密。
