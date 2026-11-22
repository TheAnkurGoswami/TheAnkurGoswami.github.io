// The big title, drawn as a grid of square cells like the attention map.
//
// Each title in data-titles ("DATA SCIENTIST|AI RESEARCHER") is rendered
// off-screen and sampled into an on/off grid. The grid fills in tile by
// tile on load, then cycles between titles. A heat glow follows the
// pointer, or drifts on its own when nobody is pointing (so phones get it too).

import { reduceMotion, inkRGB } from './lib.js';

const HEAT = [[91, 63, 224], [242, 85, 44], [255, 176, 0]]; // violet → ember → amber
const TILE_COLS = 8;          // reveal/swap sweeps move in 8-column tiles
const HOLD_MS = 3600;         // how long each title stays up
const SWAP_MS = 1100;
const REVEAL_MS = 1400;

export async function initTitle() {
  const canvas = document.getElementById('title-canvas');
  if (!canvas) return;
  const g = canvas.getContext('2d');
  const titles = (canvas.dataset.titles || 'DATA SCIENTIST').split('|').map(s => s.trim().toUpperCase());

  let cells = [], cols = 0, cell = 0, gap = 0, height = 0;
  let pointer = null, drift = null, visible = true;
  let reveal = reduceMotion ? 1.1 : 0;
  let cur = 0, next = Math.min(1, titles.length - 1), swap = 0;

  function build() {
    const W = canvas.clientWidth;
    const narrow = W < 640;
    // On phones, two-word titles stack onto two lines.
    const sets = titles.map(t => narrow ? t.split(' ') : [t]);
    const lines = Math.max(...sets.map(s => s.length));
    const rows = narrow ? 13 : 18;
    const lineGap = narrow ? 3 : 0;
    const S = 12; // sampling pixels per cell

    const off = document.createElement('canvas');
    const o = off.getContext('2d', { willReadFrequently: true });
    const font = `800 ${rows * S * 1.32}px "Bricolage Grotesque", "Helvetica Neue", Arial, sans-serif`;
    o.font = font;
    const maxW = Math.max(...sets.flat().map(l => o.measureText(l).width));
    cols = Math.ceil(maxW / S) + 1;
    const totalRows = rows * lines + lineGap * (lines - 1);
    off.width = cols * S; off.height = totalRows * S;

    const masks = sets.map(textLines => {
      o.clearRect(0, 0, off.width, off.height);
      o.font = font; o.fillStyle = '#000';
      textLines.forEach((l, i) => o.fillText(l, 0, (i * (rows + lineGap) + rows) * S - S * 0.4));
      const d = o.getImageData(0, 0, off.width, off.height).data;
      const m = [];
      for (let r = 0; r < totalRows; r++) for (let c = 0; c < cols; c++) {
        let a = 0;
        for (let y = 0; y < S; y += 2) for (let x = 0; x < S; x += 2) a += d[((r * S + y) * off.width + (c * S + x)) * 4 + 3];
        m.push(a / ((S / 2) * (S / 2) * 255) > 0.42);
      }
      return m;
    });

    cells = [];
    for (let r = 0, i = 0; r < totalRows; r++) for (let c = 0; c < cols; c++, i++) {
      cells.push({ r, c, on: masks.map(m => m[i]), seed: Math.random() });
    }
    cell = W / cols;
    gap = Math.max(0.8, cell * 0.14);
    height = cell * totalRows;
    const dpr = window.devicePixelRatio || 1;
    canvas.style.height = height + 'px';
    canvas.width = W * dpr; canvas.height = height * dpr;
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    draw();
  }

  function roundRect(x, y, w, h, r) {
    g.beginPath(); g.moveTo(x + r, y);
    g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r);
    g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath();
  }

  function draw() {
    const W = canvas.clientWidth;
    const ink = inkRGB(), inkArr = ink.split(',').map(Number);
    g.clearRect(0, 0, W, height);
    const radius = Math.min(3, cell * 0.22), tiles = Math.ceil(cols / TILE_COLS);
    const focus = pointer || drift;
    const sigma = Math.max(cell * 5, W * 0.07);

    for (const k of cells) {
      const x = k.c * cell, y = k.r * cell, s = cell - gap;
      const tile = Math.floor(k.c / TILE_COLS) / tiles + k.seed * 0.06;
      const on = (swap >= tile ? k.on[next] : k.on[cur]);
      const flipping = swap > 0 && Math.abs(swap - tile) < 0.05 && k.on[cur] !== k.on[next];

      if (!on && !flipping) { // empty cell: a faint dot keeps the grid visible
        g.fillStyle = `rgba(${ink},.07)`;
        g.fillRect(x + s * 0.38, y + s * 0.38, s * 0.24, s * 0.24);
        continue;
      }
      if (reveal < tile) { g.fillStyle = `rgba(${ink},.1)`; roundRect(x, y, s, s, radius); g.fill(); continue; }

      let colour = flipping ? '#FFB000' : `rgb(${ink})`;
      if (focus && !flipping) {
        const dx = x + s / 2 - focus[0], dy = y + s / 2 - focus[1];
        const t = Math.exp(-(dx * dx + dy * dy) / (2 * sigma * sigma));
        if (t > 0.06) {
          const f = t * (HEAT.length - 1), i = Math.min(HEAT.length - 2, Math.floor(f)), m = f - i;
          const hc = HEAT[i].map((v, j) => v + (HEAT[i + 1][j] - v) * m);
          const mix = Math.min(1, t * 1.6);
          colour = `rgb(${inkArr.map((v, j) => Math.round(v + (hc[j] - v) * mix)).join(',')})`;
        }
      }
      g.fillStyle = colour; roundRect(x, y, s, s, radius); g.fill();
    }
  }

  function cycle() {
    if (titles.length < 2) return;
    if (reduceMotion || document.hidden) { setTimeout(cycle, HOLD_MS); return; }
    const t0 = performance.now();
    const run = now => {
      swap = Math.min(1.12, (now - t0) / SWAP_MS); draw();
      if (swap < 1.12) requestAnimationFrame(run);
      else { cur = next; next = (next + 1) % titles.length; swap = 0; draw(); setTimeout(cycle, HOLD_MS); }
    };
    requestAnimationFrame(run);
  }

  function driftLoop(now) {
    if (!reduceMotion && visible && !pointer && reveal >= 1.1 && cells.length) {
      const W = canvas.clientWidth, t = now / 1000;
      drift = [W * (0.5 + 0.46 * Math.sin(t * 0.42)), height * (0.5 + 0.38 * Math.sin(t * 0.9 + 1))];
      draw();
    }
    requestAnimationFrame(driftLoop);
  }

  const setPointer = e => { const b = canvas.getBoundingClientRect(); pointer = [e.clientX - b.left, e.clientY - b.top]; draw(); };
  canvas.addEventListener('pointerdown', setPointer);
  canvas.addEventListener('pointermove', setPointer);
  canvas.addEventListener('pointerleave', () => { pointer = null; draw(); });
  canvas.addEventListener('pointerup', e => { if (e.pointerType !== 'mouse') { pointer = null; draw(); } });
  if ('IntersectionObserver' in window) new IntersectionObserver(es => { visible = es[0].isIntersecting; }).observe(canvas);
  let resizeTimer;
  window.addEventListener('resize', () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(build, 120); });
  window.addEventListener('themechange', draw);

  await document.fonts.load('800 100px "Bricolage Grotesque"').catch(() => {});
  build();
  requestAnimationFrame(driftLoop);
  if (!reduceMotion) {
    const t0 = performance.now();
    const run = now => {
      reveal = Math.min(1.1, (now - t0) / REVEAL_MS); draw();
      if (reveal < 1.1) requestAnimationFrame(run); else setTimeout(cycle, 3200);
    };
    requestAnimationFrame(run);
  }
}
