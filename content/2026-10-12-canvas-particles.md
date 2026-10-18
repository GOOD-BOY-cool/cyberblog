---
title: 用 3KB 原生 JS 做粒子星网背景
slug: canvas-particles
date: 2026-10-12
tags: JavaScript, Canvas, 动效
summary: 90 个节点、140px 连线阈值、DPR 上限 2、隐藏标签页停绘——一个能跑满 60 帧的背景实现。
---

几乎所有「科技感」站点都会有一个粒子星网：漂浮的点，近了就连线，鼠标靠近会被推开。

现成的库很多（particles.js 之类），但它们通常 20KB 起步，配置项比代码还多。这个能力其实 120 行就能写完，而且能针对自己的站点做裁剪。

## 骨架：四件事

```js
var canvas = document.querySelector("#bg-canvas");
var ctx = canvas.getContext("2d");
var nodes = [], w = 0, h = 0;

function resize() {
  var dpr = Math.min(window.devicePixelRatio || 1, 2);
  w = window.innerWidth;
  h = window.innerHeight;
  canvas.width = Math.floor(w * dpr);
  canvas.height = Math.floor(h * dpr);
  canvas.style.width = w + "px";
  canvas.style.height = h + "px";
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);   // 之后都用 CSS 像素坐标画
  build();
}
```

`ctx.setTransform(dpr, 0, 0, dpr, 0, 0)` 这一行让后续所有绘制都在「CSS 像素」坐标系里，不用到处乘 `dpr`。同时把 DPR 限制在 2：4K 屏上 DPR 可能是 3，那意味着 9 倍像素，对背景特效毫无必要。

## 节点数要跟面积挂钩

固定 80 个节点在手机上会糊成一团，在 27 寸屏上又稀得像坏了。

```js
var count = Math.round(Math.min(Math.max((w * h) / 20000, 26), 90));
```

- 1920×1080 → 104 → 被 clamp 到 90
- 390×844 → 16 → 被抬到 26
- 1440×900 → 65

上下限的意义：**小屏保底不空，大屏封顶不卡。**

## 连线：算平方，不开方

两两配对是 O(n²)，90 个节点 = 4005 次比较。每次都 `Math.sqrt` 会很浪费——我们只需要判断「是否小于 140px」，比较平方值等价。

```js
for (var i = 0; i < nodes.length; i++) {
  var a = nodes[i];
  for (var j = i + 1; j < nodes.length; j++) {
    var b = nodes[j];
    var dx = a.x - b.x, dy = a.y - b.y;
    var d2 = dx * dx + dy * dy;
    if (d2 < 19600) {                        // 140²
      var alpha = (1 - d2 / 19600) * 0.22;   // 越近越亮
      ctx.strokeStyle = "rgba(34,240,255," + alpha.toFixed(3) + ")";
      ctx.lineWidth = 0.6;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    }
  }
}
```

`alpha` 随距离线性衰减，连线就有了「渐隐」的层次感，而不是一刀切。

## 鼠标排斥：给一点生命

```js
var dx = n.x - mouse.x, dy = n.y - mouse.y;
var d2 = dx * dx + dy * dy;
if (d2 < 26000 && d2 > 1) {
  var f = (1 - d2 / 26000) * 0.9;
  n.x += (dx / Math.sqrt(d2)) * f;
  n.y += (dy / Math.sqrt(d2)) * f;
}
```

`d2 > 1` 防除零。半径取 161px 左右，力度 0.9——只推一点点，不要做出「磁铁弹开」的夸张效果，那是 2012 年的审美。

## 边界循环

不要用 `if` 反弹，直接穿越回对侧：

```js
if (n.x < -20) n.x = w + 20;
if (n.x > w + 20) n.x = -20;
```

留 20px 缓冲，节点是「走出去再回来」，不会有闪烁。

## 三个必须做的性能开关

### 1. 标签页隐藏时停绘

```js
document.addEventListener("visibilitychange", function () {
  visible = !document.hidden;
});
function step() {
  if (!visible) { requestAnimationFrame(step); return; }  // 空转，不绘制
  /* ... */
}
```

浏览器切到后台本来就会降频 `requestAnimationFrame`，但显式跳过绘制能省下可观的电量。注意仍然要保住 rAF 循环，否则切回来就停了。

### 2. resize 要防抖

```js
window.addEventListener("resize", function () {
  clearTimeout(canvas._t);
  canvas._t = setTimeout(resize, 180);
});
```

拖动窗口时会触发上百次 resize，每次都重建数组 + 重设 canvas 尺寸，会明显卡顿。

### 3. 指针监听用 passive

```js
window.addEventListener("pointermove", function (e) {
  mouse.x = e.clientX;
  mouse.y = e.clientY;
}, { passive: true });
```

只是读坐标，不需要阻止滚动，`passive: true` 让浏览器不必等回调执行就能滚动。

## 不要用 shadowBlur

这是 canvas 里最容易踩的性能坑：

```js
// 90 个节点 × 每帧高斯模糊 = 掉到 25fps
ctx.shadowBlur = 18;
ctx.shadowColor = "#22f0ff";
```

需要发光感，正确做法是**在 CSS 层做**：canvas 上面叠一层 `radial-gradient` 暗角、一层 `feTurbulence` 噪点，视觉上就有辉光与颗粒，而 canvas 只负责画实心小圆点。

```css
#bg-canvas { opacity: .85; }
.fx--vignette { background: radial-gradient(115% 85% at 50% 0%, transparent 38%, rgba(0,0,0,.62) 100%); }
.fx--grain { opacity: .038; }
```

## 降级：只画一帧

```js
if (reduceMotion) { draw(); return; }   // 静态星网，不动
```

用户开了「减少动态效果」时，画面依然有星网，只是静止。这比直接隐藏要好——氛围在，干扰没有。

## 验收数据

在 1440×900、Chrome 124、M2 MacBook Air 上的实测：

| 指标 | 数值 |
|---|---|
| 节点数 | 65 |
| 单帧绘制耗时 | 1.1 ~ 1.4ms |
| 稳定帧率 | 60fps |
| 内存占用 | < 6MB |
| 隐藏标签页 CPU | ~0% |

1.4ms 意味着 16.7ms 的预算里还剩 15ms 给主线程做别的事——这才是动画能「跑满 60 帧」的真实含义：**不是动画本身快，而是它给别的东西留了余量。**
