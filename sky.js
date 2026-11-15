// Slicesky — animated weather-condition sky backdrop (canvas).
// Modes: clear | partly | overcast | rain | thunder | snow | fog, with a day/night variant.
window.SliceskySky = (function () {
  const canvas = document.getElementById("sky");
  const ctx = canvas.getContext("2d");
  let W = 0, H = 0, dpr = 1;

  // ---- Palettes: [top, middle, bottom] as rgb arrays + scene params ----
  // Bottom stops are kept deep so white text over the content zone stays readable (WCAG AA+).
  const PALETTES = {
    clear: {
      day:   { colors: [[40, 110, 190], [70, 140, 205], [16, 42, 66]],    cloudCount: 0, cloudColor: [255, 255, 255], cloudAlpha: 0.55 },
      night: { colors: [[8, 12, 38], [18, 28, 66], [38, 52, 92]],          cloudCount: 0, cloudColor: [200, 214, 240], cloudAlpha: 0.25 },
    },
    partly: {
      day:   { colors: [[36, 104, 176], [96, 150, 200], [18, 40, 60]],    cloudCount: 4, cloudColor: [225, 232, 238], cloudAlpha: 0.65 },
      night: { colors: [[10, 16, 40], [24, 36, 70], [50, 64, 98]],          cloudCount: 3, cloudColor: [190, 205, 235], cloudAlpha: 0.35 },
    },
    overcast: {
      day:   { colors: [[60, 74, 92], [100, 114, 128], [22, 30, 40]],     cloudCount: 9, cloudColor: [150, 158, 166], cloudAlpha: 0.8 },
      night: { colors: [[16, 20, 28], [30, 38, 48], [48, 58, 68]],          cloudCount: 8, cloudColor: [160, 170, 185], cloudAlpha: 0.5 },
    },
    rain: {
      day:   { colors: [[40, 54, 70], [68, 86, 104], [14, 22, 30]],       cloudCount: 8, cloudColor: [130, 142, 152], cloudAlpha: 0.85 },
      night: { colors: [[12, 16, 24], [26, 34, 44], [40, 52, 64]],          cloudCount: 8, cloudColor: [150, 160, 172], cloudAlpha: 0.55 },
    },
    thunder: {
      day:   { colors: [[30, 36, 50], [48, 56, 72], [8, 12, 18]],         cloudCount: 9, cloudColor: [110, 118, 130], cloudAlpha: 0.9 },
      night: { colors: [[6, 8, 14], [16, 20, 30], [30, 36, 46]],            cloudCount: 9, cloudColor: [130, 138, 152], cloudAlpha: 0.6 },
    },
    snow: {
      day:   { colors: [[90, 108, 130], [130, 150, 170], [30, 42, 56]],   cloudCount: 6, cloudColor: [200, 208, 216], cloudAlpha: 0.8 },
      night: { colors: [[20, 28, 44], [40, 54, 74], [70, 88, 110]],          cloudCount: 5, cloudColor: [200, 210, 225], cloudAlpha: 0.5 },
    },
    fog: {
      day:   { colors: [[100, 112, 120], [140, 152, 160], [30, 38, 44]],  cloudCount: 2, cloudColor: [205, 210, 213], cloudAlpha: 0.5 },
      night: { colors: [[18, 22, 28], [36, 42, 48], [58, 64, 70]],           cloudCount: 2, cloudColor: [150, 156, 162], cloudAlpha: 0.4 },
    },
  };

  // Current (animated) state, lerped toward target every frame
  const cur = {
    colors: PALETTES.clear.day.colors.map((c) => [...c]),
    cloudCount: 0,
    cloudColor: [...PALETTES.clear.day.cloudColor],
    cloudAlpha: 0.55,
  };
  const target = JSON.parse(JSON.stringify(cur));
  let mode = "clear", isDay = true;

  // Scene objects
  let clouds = [], raindrops = [], flakes = [], stars = [], fogBands = [];
  let flash = 0, nextFlashAt = 0;

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = W + "px";
    canvas.style.height = H + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function rand(min, max) { return min + Math.random() * (max - min); }

  function makeClouds() {
    clouds = [];
    for (let i = 0; i < 10; i++) {
      clouds.push({
        x: rand(-0.1, 1.1) * W,
        y: rand(0.24, 0.55) * H, // below the header text zone
        s: rand(0.6, 1.5),
        v: rand(6, 18), // px/s
      });
    }
  }

  function makeParticles() {
    raindrops = [];
    flakes = [];
    for (let i = 0; i < 90; i++) {
      raindrops.push({ x: rand(0, W), y: rand(0, H), l: rand(10, 22), v: rand(420, 700) });
    }
    for (let i = 0; i < 70; i++) {
      flakes.push({ x: rand(0, W), y: rand(0, H), r: rand(1.4, 3.6), v: rand(28, 70), sway: rand(0.5, 1.6), phase: rand(0, Math.PI * 2) });
    }
  }

  function makeStars() {
    stars = [];
    for (let i = 0; i < 90; i++) {
      stars.push({ x: rand(0, W), y: rand(0, H * 0.7), r: rand(0.5, 1.6), phase: rand(0, Math.PI * 2), speed: rand(0.5, 1.5) });
    }
  }

  function makeFog() {
    fogBands = [];
    for (let i = 0; i < 4; i++) {
      fogBands.push({ y: rand(0.25, 0.95) * H, h: rand(60, 130), v: rand(-14, -4) * (i % 2 ? -1 : 1), x: rand(0, W) });
    }
  }

  function set(newMode, day) {
    mode = newMode;
    isDay = day !== false;
    const p = (PALETTES[mode] || PALETTES.partly)[isDay ? "day" : "night"];
    target.colors = p.colors.map((c) => [...c]);
    target.cloudCount = p.cloudCount;
    target.cloudColor = [...p.cloudColor];
    target.cloudAlpha = p.cloudAlpha;
    if (mode === "thunder") nextFlashAt = performance.now() + rand(800, 3000);
  }

  function activeClouds() {
    // Render the first N clouds of the pool
    return clouds.slice(0, Math.round(cur.cloudCount));
  }

  function drawCloud(c, alpha) {
    const [r, g, b] = cur.cloudColor;
    const base = c.s * Math.min(W, 900) / 40;
    ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`;
    ctx.beginPath();
    ctx.ellipse(c.x, c.y, base * 2.2, base * 0.9, 0, 0, Math.PI * 2);
    ctx.ellipse(c.x - base * 1.1, c.y + base * 0.25, base * 1.2, base * 0.6, 0, 0, Math.PI * 2);
    ctx.ellipse(c.x + base * 1.0, c.y + base * 0.2, base * 1.4, base * 0.65, 0, 0, Math.PI * 2);
    ctx.ellipse(c.x + base * 0.2, c.y - base * 0.55, base * 1.1, base * 0.7, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  function lerpColor(a, b, t) {
    return a.map((v, i) => v + (b[i] - v) * t);
  }

  let last = performance.now();
  function frame(now) {
    const dt = Math.min((now - last) / 1000, 0.1);
    last = now;

    // Ease palette toward target
    const t = Math.min(1, dt * 1.5);
    cur.colors = cur.colors.map((c, i) => lerpColor(c, target.colors[i], t));
    cur.cloudCount += (target.cloudCount - cur.cloudCount) * t;
    cur.cloudColor = lerpColor(cur.cloudColor, target.cloudColor, t);
    cur.cloudAlpha += (target.cloudAlpha - cur.cloudAlpha) * t;

    // Sky gradient
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    cur.colors.forEach((c, i) => grad.addColorStop(i / (cur.colors.length - 1), `rgb(${c.map(Math.round).join(",")})`));
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // Clouds drift (before the scrim so text zones stay dark over them)
    for (const c of activeClouds()) {
      c.x += c.v * dt;
      if (c.x - c.s * 100 > W + 200) c.x = -150;
      drawCloud(c, cur.cloudAlpha);
    }

    // Dark scrim at top and bottom so bare text (header, footer) stays readable over bright skies
    const scrimTop = ctx.createLinearGradient(0, 0, 0, H * 0.45);
    scrimTop.addColorStop(0, "rgba(2, 8, 18, 0.6)");
    scrimTop.addColorStop(1, "rgba(2, 8, 18, 0)");
    ctx.fillStyle = scrimTop;
    ctx.fillRect(0, 0, W, H * 0.45);
    const scrimBottom = ctx.createLinearGradient(0, H * 0.72, 0, H);
    scrimBottom.addColorStop(0, "rgba(2, 8, 18, 0)");
    scrimBottom.addColorStop(1, "rgba(2, 8, 18, 0.5)");
    ctx.fillStyle = scrimBottom;
    ctx.fillRect(0, H * 0.72, W, H * 0.28);

    // Sun or moon
    if (mode === "clear" || mode === "partly") {
      const cx = W * 0.78, cy = H * 0.16, R = Math.min(W, H) * 0.055;
      if (isDay) {
        const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * 5);
        glow.addColorStop(0, "rgba(255, 238, 170, 0.9)");
        glow.addColorStop(0.25, "rgba(255, 230, 140, 0.35)");
        glow.addColorStop(1, "rgba(255, 230, 140, 0)");
        ctx.fillStyle = glow;
        ctx.fillRect(cx - R * 5, cy - R * 5, R * 10, R * 10);
        ctx.fillStyle = "rgba(255, 244, 200, 0.95)";
        ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.fill();
      } else {
        ctx.fillStyle = "rgba(235, 240, 250, 0.95)";
        ctx.beginPath(); ctx.arc(cx, cy, R * 0.8, 0, Math.PI * 2); ctx.fill();
        // bite out a crescent
        ctx.fillStyle = `rgb(${cur.colors[1].map(Math.round).join(",")})`;
        ctx.beginPath(); ctx.arc(cx - R * 0.55, cy - R * 0.3, R * 0.68, 0, Math.PI * 2); ctx.fill();
      }
    }

    // Stars at night
    if (!isDay && (mode === "clear" || mode === "partly" || mode === "snow")) {
      const t2 = now / 1000;
      for (const s of stars) {
        const tw = 0.4 + 0.6 * Math.abs(Math.sin(t2 * s.speed + s.phase));
        ctx.fillStyle = `rgba(255, 255, 255, ${0.7 * tw})`;
        ctx.fillRect(s.x, s.y, s.r, s.r);
      }
    }

    // Rain
    if (mode === "rain" || mode === "thunder") {
      ctx.strokeStyle = isDay ? "rgba(220, 235, 250, 0.45)" : "rgba(190, 210, 235, 0.35)";
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      for (const d of raindrops) {
        d.y += d.v * dt;
        d.x -= d.v * dt * 0.08;
        if (d.y > H + 20) { d.y = -20; d.x = rand(0, W * 1.1); }
        ctx.moveTo(d.x, d.y);
        ctx.lineTo(d.x + d.l * 0.08, d.y + d.l);
      }
      ctx.stroke();
    }

    // Snow
    if (mode === "snow") {
      ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
      const t3 = now / 1000;
      for (const f of flakes) {
        f.y += f.v * dt;
        const x = f.x + Math.sin(t3 * f.sway + f.phase) * 14;
        if (f.y > H + 5) { f.y = -5; f.x = rand(0, W); }
        ctx.beginPath(); ctx.arc(x, f.y, f.r, 0, Math.PI * 2); ctx.fill();
      }
    }

    // Fog bands
    if (mode === "fog") {
      for (const b of fogBands) {
        b.x += b.v * dt;
        if (b.x > W + b.h) b.x = -b.h * 3;
        if (b.x < -b.h * 3) b.x = W + b.h;
        const g2 = ctx.createLinearGradient(b.x, b.y, b.x + b.h * 2, b.y);
        g2.addColorStop(0, "rgba(235, 240, 242, 0)");
        g2.addColorStop(0.5, `rgba(235, 240, 242, ${isDay ? 0.35 : 0.18})`);
        g2.addColorStop(1, "rgba(235, 240, 242, 0)");
        ctx.fillStyle = g2;
        ctx.fillRect(b.x, b.y, b.h * 2, b.h);
      }
    }

    // Lightning flashes
    if (mode === "thunder") {
      if (now >= nextFlashAt) {
        flash = 0.85;
        nextFlashAt = now + rand(2500, 8000);
      }
      if (flash > 0.01) {
        ctx.fillStyle = `rgba(255, 255, 255, ${flash})`;
        ctx.fillRect(0, 0, W, H);
        flash *= Math.pow(0.05, dt); // fast decay
      }
    }

    requestAnimationFrame(frame);
  }

  function start() {
    resize();
    makeClouds();
    makeParticles();
    makeStars();
    makeFog();
    window.addEventListener("resize", () => {
      resize();
      makeClouds(); makeParticles(); makeStars(); makeFog();
    });
    set("clear", true);
    if (reducedMotion) {
      // Static gradient only, no animation loop
      const g = ctx.createLinearGradient(0, 0, 0, H);
      cur.colors.forEach((c, i) => g.addColorStop(i / (cur.colors.length - 1), `rgb(${c.join(",")})`));
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
      window.SliceskySky = { set: (m, d) => { set(m, d); const g2 = ctx.createLinearGradient(0, 0, 0, H); target.colors.forEach((c, i) => g2.addColorStop(i / (target.colors.length - 1), `rgb(${c.join(",")})`)); ctx.fillStyle = g2; ctx.fillRect(0, 0, W, H); } };
      return;
    }
    requestAnimationFrame(frame);
  }

  start();

  return { set, frame: () => frame(performance.now()) };
})();
