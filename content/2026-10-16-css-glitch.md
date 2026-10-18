---
title: 纯 CSS 故障艺术：把文字砸出信号噪点
slug: css-glitch
date: 2026-10-16
tags: CSS, 动效
summary: 不用一张图、不用 JS，只用伪元素、clip-path 与 steps()，就能做出可信的 RGB 分离与信号撕裂。
---

赛博朋克视觉里最便宜也最有效的特效，是「故障」（glitch）。它模拟的是：信号在传输中被干扰，色差通道错位，扫描行断裂。

它的实现成本低得惊人——两个伪元素、一段 `clip-path`、一个 `steps()` 时间函数，就够。

## RGB 分离：从三个字开始

真实显示器的故障，本质是红绿蓝三个通道的偏色。对应到 CSS，就是「同一段文字画三层，各自偏移几个像素」。

```css
.title {
  position: relative;
  color: #f2f8ff;
}

.title::before,
.title::after {
  content: attr(data-text);
  position: absolute;
  inset: 0;
  mix-blend-mode: screen;
}

.title::before { color: #22f0ff; transform: translate(-2px, 0); }
.title::after  { color: #ff2d78; transform: translate(2px, 0); }
```

`content: attr(data-text)` 是关键：HTML 里只需写一次文字，伪元素自动复制，不用在两处维护。

```html
<h1 class="title" data-text="NEON//EDGE">NEON<span>//</span>EDGE</h1>
```

注意内层那个 `<span>`（让斜杠变色）。伪元素复制的是纯文本，所以斜杠在伪元素里是白色的——这反而增加了错位的随机感。

## 为什么用 screen 混合模式

如果伪元素是普通的不透明层，它会**盖住**底层文字，你看到的就只有最上面一层。`mix-blend-mode: screen` 让颜色相加：青 + 白 = 白，品红 + 青 = 紫白。视觉上是「发光叠加」，而不是「贴纸覆盖」。

```css
mix-blend-mode: screen;
opacity: .55;   /* 控制强度，1 会太糊 */
```

## 撕裂：clip-path + steps(1)

光有偏色还不够，故障的灵魂是**不连续**。用 `clip-path: inset()` 只露出一条横带，然后在时间轴上跳变。

```css
@keyframes tear {
  0%, 88%, 100% {
    transform: translate3d(0, 0, 0);
    clip-path: inset(0 0 100% 0);   /* 完全裁掉 = 静止态不可见 */
  }
  89% { transform: translate3d(-5px, 0, 0); clip-path: inset(8% 0 62% 0); }
  90% { transform: translate3d(5px, 0, 0);  clip-path: inset(58% 0 18% 0); }
  91% { transform: translate3d(-3px, 0, 0); clip-path: inset(32% 0 46% 0); }
  92% { transform: translate3d(4px, 0, 0);  clip-path: inset(2% 0 84% 0); }
}
```

三个细节决定了它像不像：

- **静止态要裁到 100%**，不能只靠 `opacity: 0`。裁切是几何操作，不参与混合，比透明度更干净。
- **`steps(1)`** 让每一帧突变而不是插值。故障从来不是渐变的。
- **爆发窗口要短**（占时间轴的 12% 以内）。一直抖会让人眼疲劳，而且看起来像廉价特效。

## 让两个通道不同步

只用一个伪元素，撕裂节奏是单一的。用两个、并给第二个加 `animation-delay`，就会出现「两个通道各自掉帧」的错位感。

```css
.title::before { animation: tear-a 6.5s steps(1) infinite; }
.title::after  { animation: tear-b 5.5s steps(1) infinite; animation-delay: .4s; }
```

周期取**质数关系**（6.5s 与 5.5s）比取倍数关系更好——两个循环要很久才会重合，重复感被推迟了。

## 性能代价几乎为零

这套效果的成本只在爆发的那几十毫秒：4 个关键帧，每个动 `transform` 和 `clip-path`。静止期间伪元素被完全裁掉，不产生可见像素。

对比一下常见的错误做法：

```css
/* 不要这样：每帧都在做高斯模糊，中端笔记本直接掉到 30fps */
.bad { animation: glow 2s infinite; }
@keyframes glow {
  50% { filter: blur(6px) drop-shadow(0 0 20px cyan); }
}
```

`filter` 在动画里是允许的，但**大面积 + 高频**就会变成性能杀手。故障效果的面积只有一行标题，可以接受；如果要用在整块 hero 上，就该换成预渲染的位图或 SVG 滤镜。

## 加一层扫描线收尾

纯文字故障还差一点「屏幕感」。叠一层 CRT 扫描线，成本极低：

```css
.scanlines {
  position: fixed;
  inset: -4px 0;
  background: repeating-linear-gradient(
    to bottom,
    rgba(190, 240, 255, .05) 0 1px,
    transparent 1px 3px
  );
  mix-blend-mode: overlay;
  pointer-events: none;
  animation: drift 7s linear infinite;
}
@keyframes drift {
  from { transform: translate3d(0, -3px, 0); }
  to   { transform: translate3d(0, 0, 0); }
}
```

位移必须正好是 3px（图案周期），否则循环时会看到一条接缝跳一下。

## 降级：尊重用户的系统设置

```css
@media (prefers-reduced-motion: reduce) {
  .title::before,
  .title::after { animation: none; clip-path: inset(0 0 100% 0); }
  .scanlines { animation: none; }
}
```

故障艺术对前庭敏感人群不友好。关掉动画后，标题依然是白色、有霓虹光晕的——视觉完整性没有损失，只是不再抖动。这才是正确的降级方式：**去掉动作，保留风格**。
