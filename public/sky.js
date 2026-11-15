// Animated sky backdrop driven by WeatherAPI condition code + is_day.
// Usage: Sky.set(code, isDay). Respects prefers-reduced-motion (draws one still frame).
const Sky = (() => {
  const cv = document.createElement("canvas");
  cv.id = "sky";
  document.body.prepend(cv);
  const ctx = cv.getContext("2d");
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  let W = 0, H = 0, scene = { kind: "clear", day: true }, t = 0, flash = 0, parts = [], clouds = [], stars = [];

  const SKY = {
    day:   { clear: ["#2f8fe8", "#8fd0ff"], partly: ["#4a95dc", "#a5d4f5"], cloudy: ["#7d8fa3", "#b7c3cf"], rain: ["#4a5a6e", "#7f8e9e"], thunder: ["#2c3442", "#58637a"], snow: ["#9fb1c4", "#dde6ee"], fog: ["#a3adb6", "#d2d8dd"] },
    night: { clear: ["#050b1f", "#1b2a55"], partly: ["#0a1329", "#27365e"], cloudy: ["#161d2b", "#323c50"], rain: ["#0e141f", "#27313f"], thunder: ["#080b12", "#1e2433"], snow: ["#1c2634", "#4a5b70"], fog: ["#1d242d", "#434d58"] },
  };

  function kindOf(code) {
    if (code === 1000) return "clear";
    if (code === 1003) return "partly";
    if (code === 1006 || code === 1009) return "cloudy";
    if ([1030, 1135, 1147].includes(code)) return "fog";
    if ([1087, 1273, 1276, 1279, 1282].includes(code)) return "thunder";
    if ([1066, 1069, 1114, 1117, 1204, 1207, 1210, 1213, 1216, 1219, 1222, 1225, 1237, 1249, 1252, 1255, 1258, 1261, 1264].includes(code)) return "snow";
    if ([1063, 1072, 1150, 1153, 1168, 1171, 1180, 1183, 1186, 1189, 1192, 1195, 1198, 1201, 1240, 1243, 1246].includes(code)) return "rain";
    return "cloudy";
  }

  function resize() {
    const d = devicePixelRatio || 1;
    W = innerWidth; H = innerHeight;
    cv.width = W * d; cv.height = H * d;
    ctx.setTransform(d, 0, 0, d, 0, 0);
    build();
  }

  function build() {
    const k = scene.kind;
    const nClouds = { clear: 0, partly: 5, cloudy: 9, rain: 10, thunder: 11, snow: 8, fog: 4 }[k];
    clouds = Array.from({ length: nClouds }, () => ({ x: Math.random() * W, y: Math.random() * H * 0.45, r: 60 + Math.random() * 90, s: 4 + Math.random() * 10 }));
    const nParts = { rain: 140, thunder: 200, snow: 110 }[k] || 0;
    parts = Array.from({ length: nParts }, () => ({ x: Math.random() * W, y: Math.random() * H, v: k === "snow" ? 25 + Math.random() * 35 : 520 + Math.random() * 300, r: Math.random() * 2 + 1, p: Math.random() * 6 }));
    stars = scene.day ? [] : Array.from({ length: 90 }, () => ({ x: Math.random() * W, y: Math.random() * H * 0.7, r: Math.random() * 1.3 + 0.2, p: Math.random() * 6 }));
  }

  function blob(x, y, r, color) {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, color); g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill();
  }

  function frame(dt) {
    t += dt;
    const { kind: k, day } = scene;
    const [c1, c2] = SKY[day ? "day" : "night"][k];
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, c1); g.addColorStop(1, c2);
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);

    for (const s of stars) {
      ctx.globalAlpha = (k === "clear" ? 0.9 : 0.4) * (0.5 + 0.5 * Math.sin(t * 2 + s.p));
      ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, 7); ctx.fill();
    }
    ctx.globalAlpha = 1;

    if (k === "clear" || k === "partly") {
      const x = W * 0.78, y = H * 0.2, pulse = 1 + 0.04 * Math.sin(t * 1.5);
      if (day) { blob(x, y, 220 * pulse, "rgba(255,244,190,.55)"); blob(x, y, 60, "rgba(255,255,235,1)"); }
      else { blob(x, y, 150, "rgba(200,215,255,.25)"); blob(x, y, 34, "rgba(235,240,255,.95)"); }
    }

    const tone = day ? (k === "cloudy" || k === "rain" || k === "thunder" ? "150,160,172" : k === "snow" ? "235,240,246" : "255,255,255") : "70,80,100";
    const alpha = day ? (k === "thunder" ? 0.55 : 0.4) : 0.45;
    for (const c of clouds) {
      c.x += c.s * dt; if (c.x - c.r * 1.6 > W) c.x = -c.r * 1.6;
      blob(c.x, c.y, c.r, `rgba(${tone},${alpha})`);
      blob(c.x + c.r * 0.7, c.y + c.r * 0.15, c.r * 0.8, `rgba(${tone},${alpha})`);
      blob(c.x - c.r * 0.7, c.y + c.r * 0.2, c.r * 0.7, `rgba(${tone},${alpha})`);
    }

    if (k === "fog") {
      for (let i = 0; i < 5; i++) {
        const y = H * (0.2 + i * 0.17), x = ((t * (8 + i * 3) + i * 200) % (W + 600)) - 300;
        const fg = ctx.createLinearGradient(x - 300, 0, x + 300, 0);
        fg.addColorStop(0, "rgba(255,255,255,0)"); fg.addColorStop(0.5, day ? "rgba(255,255,255,.28)" : "rgba(180,190,200,.16)"); fg.addColorStop(1, "rgba(255,255,255,0)");
        ctx.fillStyle = fg; ctx.fillRect(x - 300, y - 50, 600, 100);
      }
    }

    if (k === "rain" || k === "thunder") {
      ctx.strokeStyle = day ? "rgba(210,225,245,.55)" : "rgba(170,195,230,.5)"; ctx.lineWidth = 1.2; ctx.beginPath();
      for (const p of parts) {
        p.y += p.v * dt; p.x -= p.v * 0.12 * dt;
        if (p.y > H) { p.y = -20; p.x = Math.random() * W + 60; }
        ctx.moveTo(p.x, p.y); ctx.lineTo(p.x + 3, p.y - 16);
      }
      ctx.stroke();
    }
    if (k === "snow") {
      ctx.fillStyle = "rgba(255,255,255,.9)";
      for (const p of parts) {
        p.y += p.v * dt; p.x += Math.sin(t + p.p) * 20 * dt;
        if (p.y > H) { p.y = -5; p.x = Math.random() * W; }
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 7); ctx.fill();
      }
    }
    if (k === "thunder") {
      if (flash <= 0 && Math.random() < dt * 0.25) flash = 1;
      if (flash > 0) { ctx.fillStyle = `rgba(235,240,255,${flash * 0.55})`; ctx.fillRect(0, 0, W, H); flash -= dt * 3.5; }
    }
  }

  let last = 0;
  function loop(now) {
    const dt = Math.min((now - last) / 1000 || 0, 0.05); last = now;
    frame(dt);
    if (!reduce) requestAnimationFrame(loop);
  }

  addEventListener("resize", () => { resize(); if (reduce) frame(0); });
  resize();
  requestAnimationFrame(loop);

  return {
    set(code, isDay) {
      scene = { kind: kindOf(code), day: !!isDay };
      build();
      if (reduce) frame(0);
    },
  };
})();
