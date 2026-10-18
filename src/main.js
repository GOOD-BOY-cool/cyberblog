/* ==========================================================================
   NEON//EDGE — interaction layer
   ES module · 无运行时依赖 · 全部动画都在 motion-ok 的前提下启用
   入口由 /src/main.js 被 Vite 处理（打包、压缩、加 hash）
   ========================================================================== */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  var $ = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };
  var raf = window.requestAnimationFrame || function (fn) { return setTimeout(fn, 16); };

  /* ---------------- 1. 背景粒子星网 ---------------- */
  function initCanvas() {
    var canvas = $("#bg-canvas");
    if (!canvas || !canvas.getContext) return;
    var ctx = canvas.getContext("2d", { alpha: true });
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = 0, h = 0, nodes = [], mouse = { x: -999, y: -999 }, visible = true;

    function resize() {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = w + "px";
      canvas.style.height = h + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      build();
    }

    function build() {
      // 粒子数量与画布面积成正比，并设置上下限：小屏省电，大屏不空
      var count = Math.round(Math.min(Math.max((w * h) / 20000, 26), 90));
      nodes = [];
      for (var i = 0; i < count; i++) {
        nodes.push({
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() - 0.5) * 0.28,
          vy: (Math.random() - 0.5) * 0.28,
          r: Math.random() * 1.5 + 0.6,
          hue: Math.random() > 0.72 ? "magenta" : "cyan"
        });
      }
      if (reduceMotion) draw();
    }

    function draw() {
      ctx.clearRect(0, 0, w, h);

      // 星网连线
      for (var i = 0; i < nodes.length; i++) {
        var a = nodes[i];
        for (var j = i + 1; j < nodes.length; j++) {
          var b = nodes[j];
          var dx = a.x - b.x, dy = a.y - b.y;
          var d2 = dx * dx + dy * dy;
          if (d2 < 19600) {
            var alpha = (1 - d2 / 19600) * 0.22;
            ctx.strokeStyle = "rgba(34,240,255," + alpha.toFixed(3) + ")";
            ctx.lineWidth = 0.6;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }

      // 粒子
      for (var k = 0; k < nodes.length; k++) {
        var n = nodes[k];
        ctx.beginPath();
        ctx.fillStyle = n.hue === "magenta"
          ? "rgba(255,45,120,.85)"
          : "rgba(34,240,255,.85)";
        ctx.arc(n.x, n.y, n.r, 0, 6.2832);
        ctx.fill();
      }
    }

    function step() {
      if (!visible) { raf(step); return; }
      for (var i = 0; i < nodes.length; i++) {
        var n = nodes[i];
        n.x += n.vx;
        n.y += n.vy;
        if (n.x < -20) n.x = w + 20;
        if (n.x > w + 20) n.x = -20;
        if (n.y < -20) n.y = h + 20;
        if (n.y > h + 20) n.y = -20;

        // 鼠标轻微排斥
        var dx = n.x - mouse.x, dy = n.y - mouse.y;
        var d2 = dx * dx + dy * dy;
        if (d2 < 26000 && d2 > 1) {
          var f = (1 - d2 / 26000) * 0.9;
          n.x += (dx / Math.sqrt(d2)) * f;
          n.y += (dy / Math.sqrt(d2)) * f;
        }
      }
      draw();
      raf(step);
    }

    resize();
    window.addEventListener("resize", function () {
      clearTimeout(canvas._t);
      canvas._t = setTimeout(resize, 180);
    });
    window.addEventListener("pointermove", function (e) {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    }, { passive: true });
    window.addEventListener("pointerleave", function () { mouse.x = mouse.y = -999; });
    document.addEventListener("visibilitychange", function () {
      visible = !document.hidden;
    });

    if (!reduceMotion) raf(step);
  }

  /* ---------------- 2. 打字机 ---------------- */
  function initTypewriter() {
    var el = $("#typewriter");
    if (!el) return;
    var words = (el.dataset.words || "").split("|").filter(Boolean);
    if (!words.length) return;
    if (reduceMotion) { el.textContent = words[0]; return; }

    var wi = 0, ci = 0, deleting = false;
    el.textContent = "";

    function tick() {
      var word = words[wi];
      if (!deleting) {
        el.textContent = word.slice(0, ++ci);
        if (ci === word.length) {
          deleting = true;
          return setTimeout(tick, 1900);
        }
        return setTimeout(tick, 62 + Math.random() * 40);
      }
      el.textContent = word.slice(0, --ci);
      if (ci === 0) {
        deleting = false;
        wi = (wi + 1) % words.length;
        return setTimeout(tick, 380);
      }
      setTimeout(tick, 28);
    }
    setTimeout(tick, 900);
  }

  /* ---------------- 3. 滚动进场 ---------------- */
  function initReveal() {
    var items = $$("[data-reveal]");
    if (!items.length) return;
    if (reduceMotion || !("IntersectionObserver" in window)) {
      items.forEach(function (el) { el.classList.add("is-visible"); });
      return;
    }
    // threshold 必须是 0：用 0.08 时，比视口高很多倍的元素（比如整篇正文）
    // 可见比例永远到不了 8%，动画不会触发，内容就永久隐身了。
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        io.unobserve(entry.target);
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0 });
    items.forEach(function (el) { io.observe(el); });
  }

  /* ---------------- 4. 数字滚动 ---------------- */
  function initCounters() {
    var els = $$("[data-count]");
    if (!els.length) return;
    var easeOut = function (t) { return 1 - Math.pow(1 - t, 3); };

    function run(el) {
      var target = parseInt(el.dataset.count, 10) || 0;
      if (reduceMotion) { el.textContent = target; return; }
      var start = performance.now(), dur = 1400;
      (function frame(now) {
        var p = Math.min((now - start) / dur, 1);
        el.textContent = Math.round(easeOut(p) * target);
        if (p < 1) raf(frame);
      })(start);
    }

    if (!("IntersectionObserver" in window)) { els.forEach(run); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        run(e.target);
        io.unobserve(e.target);
      });
    }, { threshold: 0.4 });
    els.forEach(function (el) { io.observe(el); });
  }

  /* ---------------- 5. 卡片 3D 倾斜 ---------------- */
  function initTilt() {
    if (!finePointer || reduceMotion) return;
    $$("[data-tilt]").forEach(function (card) {
      var inner = $(".card__link", card) || card;
      var frame = null;
      card.addEventListener("pointermove", function (e) {
        if (frame) return;
        frame = raf(function () {
          var r = card.getBoundingClientRect();
          var px = (e.clientX - r.left) / r.width - 0.5;
          var py = (e.clientY - r.top) / r.height - 0.5;
          inner.style.setProperty("--ry", (px * 7).toFixed(2) + "deg");
          inner.style.setProperty("--rx", (-py * 7).toFixed(2) + "deg");
          frame = null;
        });
      });
      card.addEventListener("pointerleave", function () {
        inner.style.setProperty("--ry", "0deg");
        inner.style.setProperty("--rx", "0deg");
      });
    });
  }

  /* ---------------- 6. 光标光晕 ---------------- */
  function initCursorGlow() {
    var glow = $("#cursor-glow");
    if (!glow || !finePointer || reduceMotion) return;
    var x = 0, y = 0, cx = 0, cy = 0, active = false;
    document.addEventListener("pointermove", function (e) {
      x = e.clientX; y = e.clientY;
      if (!active) { active = true; document.body.classList.add("has-pointer"); }
    }, { passive: true });
    (function loop() {
      cx += (x - cx) * 0.14;
      cy += (y - cy) * 0.14;
      glow.style.transform = "translate3d(" + cx.toFixed(1) + "px," + cy.toFixed(1) + "px,0)";
      raf(loop);
    })();
  }

  /* ---------------- 7. 页头 / 导航 ---------------- */
  function initHeader() {
    var header = $("#site-header");
    var toggle = $("#nav-toggle");
    var nav = $("#nav");

    if (header) {
      var onScroll = function () {
        header.classList.toggle("is-scrolled", window.scrollY > 12);
      };
      window.addEventListener("scroll", onScroll, { passive: true });
      onScroll();
    }

    if (toggle && nav) {
      toggle.addEventListener("click", function () {
        var open = nav.classList.toggle("is-open");
        toggle.classList.toggle("is-open", open);
        toggle.setAttribute("aria-expanded", String(open));
      });
      nav.addEventListener("click", function (e) {
        if (e.target.tagName === "A" && nav.classList.contains("is-open")) {
          nav.classList.remove("is-open");
          toggle.classList.remove("is-open");
          toggle.setAttribute("aria-expanded", "false");
        }
      });
    }
  }

  /* ---------------- 8. 开机遮罩 ---------------- */
  function initBoot() {
    var boot = $("#boot");
    if (!boot) return;
    if (reduceMotion) { boot.remove(); return; }
    var done = function () {
      boot.classList.add("is-done");
      setTimeout(function () { boot.remove(); }, 800);
    };
    if (document.readyState === "complete") setTimeout(done, 620);
    else window.addEventListener("load", function () { setTimeout(done, 620); });
  }

  /* ---------------- 9. 阅读进度 / 目录高亮 ---------------- */
  function initProgress() {
    var bar = $("#progress-bar");
    var article = $(".post");
    if (!bar || !article) return;
    var ticking = false;
    var update = function () {
      var r = article.getBoundingClientRect();
      var total = r.height - window.innerHeight * 0.6;
      var p = Math.min(Math.max(-r.top / Math.max(total, 1), 0), 1);
      bar.style.transform = "scaleX(" + p.toFixed(4) + ")";
      ticking = false;
    };
    window.addEventListener("scroll", function () {
      if (ticking) return;
      ticking = true;
      raf(update);
    }, { passive: true });
    update();
  }

  function initToc() {
    var links = $$(".toc a");
    if (!links.length || !("IntersectionObserver" in window)) return;
    var map = {};
    links.forEach(function (a) {
      map[a.getAttribute("href").slice(1)] = a;
    });
    var heads = $$(".prose h2");
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        links.forEach(function (a) { a.classList.remove("is-active"); });
        var link = map[e.target.id];
        if (link) link.classList.add("is-active");
      });
    }, { rootMargin: "-96px 0px -70% 0px" });
    heads.forEach(function (h) { io.observe(h); });
  }

  /* ---------------- 10. 代码复制 ---------------- */
  function initCopy() {
    $$(".codeblock__copy").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var block = btn.closest(".codeblock");
        var code = $("code", block);
        if (!code) return;
        var text = code.innerText;
        var finish = function () {
          btn.textContent = "COPIED";
          btn.classList.add("is-done");
          setTimeout(function () {
            btn.textContent = "COPY";
            btn.classList.remove("is-done");
          }, 1600);
        };
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(finish, function () {});
        } else {
          var ta = document.createElement("textarea");
          ta.value = text;
          ta.style.position = "fixed";
          ta.style.opacity = "0";
          document.body.appendChild(ta);
          ta.select();
          try { document.execCommand("copy"); finish(); } catch (err) {}
          ta.remove();
        }
      });
    });
  }

  /* ---------------- 11. 归档页：标签过滤 + 搜索 ---------------- */
  function initArchive() {
    var grid = $("#post-grid");
    if (!grid) return;
    var cards = $$(".card", grid);
    var empty = $("#empty-state");
    var filters = $$(".chip-btn");
    var input = $("#post-search");
    var activeTag = "all";

    function apply() {
      var q = (input && input.value || "").trim().toLowerCase();
      var shown = 0;
      cards.forEach(function (card) {
        var tags = (card.dataset.tags || "").toLowerCase();
        var text = (card.dataset.title || "").toLowerCase();
        var okTag = activeTag === "all" || tags.indexOf(activeTag.toLowerCase()) !== -1;
        var okText = !q || text.indexOf(q) !== -1 || tags.indexOf(q) !== -1;
        var ok = okTag && okText;
        card.hidden = !ok;
        if (ok) shown++;
      });
      if (empty) empty.hidden = shown !== 0;
    }

    filters.forEach(function (btn) {
      btn.addEventListener("click", function () {
        filters.forEach(function (b) { b.classList.remove("is-active"); });
        btn.classList.add("is-active");
        activeTag = btn.dataset.filter || "all";
        apply();
      });
    });
    if (input) input.addEventListener("input", apply);
  }

  /* ---------------- 12. 背景主题切换（经典暗色 ⇄ 二次元亮色） ---------------- */
  function initTheme() {
    var btn = $("#theme-toggle");
    if (!btn) return;

    var root = document.documentElement;
    var label = $(".theme-toggle__label", btn);
    var KEY = "neon-theme";
    var timer = null;

    function paint(theme) {
      var isAnime = theme === "anime";
      if (isAnime) root.setAttribute("data-theme", "anime");
      else root.removeAttribute("data-theme");
      btn.setAttribute("aria-pressed", isAnime ? "true" : "false");
      btn.setAttribute("aria-label", isAnime ? "切换到经典暗色背景" : "切换到二次元亮色背景");
      if (label) label.textContent = isAnime ? "经典" : "二次元";
      // 移动端地址栏 / 状态栏也一起换色
      var meta = document.querySelector('meta[name="theme-color"]');
      if (meta) meta.setAttribute("content", isAnime ? "#fdf8fb" : "#05060a");
    }

    // 首屏由 <head> 里的内联脚本提前写好 data-theme，这里只同步按钮状态
    paint(root.getAttribute("data-theme") === "anime" ? "anime" : "dark");

    btn.addEventListener("click", function () {
      var next = root.getAttribute("data-theme") === "anime" ? "dark" : "anime";

      // 只在切换的那 620ms 打开全局颜色过渡，避免影响 hover / 折叠等常规动画
      if (!reduceMotion) {
        root.classList.add("is-theme-switching");
        clearTimeout(timer);
        timer = setTimeout(function () { root.classList.remove("is-theme-switching"); }, 620);
      }

      paint(next);
      try { localStorage.setItem(KEY, next); } catch (e) {}
    });
  }

  /* ---------------- 13. 初始化 ---------------- */
  function boot() {
    // 首屏关键动效（打字机 / 进场 / 导航）立刻上；粒子画布延后到浏览器空闲，
    // 避免和 LCP 抢主线程 —— 背景晚 300ms 出现，肉眼几乎无感。
    initTypewriter();
    initReveal();
    initCounters();
    initTilt();
    initCursorGlow();
    initHeader();
    initBoot();
    initProgress();
    initToc();
    initCopy();
    initArchive();
    initTheme();

    var idle = window.requestIdleCallback || function (fn) { return setTimeout(fn, 260); };
    idle(function () { initCanvas(); }, { timeout: 1400 });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
