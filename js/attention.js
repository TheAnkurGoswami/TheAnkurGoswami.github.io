// The hero headline, decoded word by word, next to a causal attention map
// over those same words.
//
// The words come from the headline's aria-label. Attention weights are
// hand-tuned so the map reads sensibly (e.g. "matters" looks back at "what"
// and "time"); they are illustrative, not from a real model. After the
// headline finishes, the map fills in tile by tile the way Flash Attention
// visits blocks. Hovering a cell or a word shows who attends to whom.
// The animation waits until the headline is on screen.

import { reduceMotion, css, inkRGB, hexToRGB, esc, onVisible } from './lib.js';

const TILE = 4;
// For each query word, the earlier words it should attend to strongly.
const LINKS = { 2: [1], 4: [2, 1], 6: [0, 2], 8: [6, 7], 10: [8, 9], 12: [6], 13: [12, 10, 4, 6] };
const HEAT = [null, [91, 63, 224], [242, 85, 44], [255, 176, 0]]; // [0] is the empty-cell colour, set per theme

export async function initAttention() {
  const headline = document.getElementById('headline');
  const canvas = document.getElementById('attention-canvas');
  const readout = document.getElementById('attention-readout');
  if (!headline || !canvas) return;

  const words = headline.getAttribute('aria-label').split(/\s+/);
  const N = words.length;
  const bare = w => w.replace(/[.,]/g, '');

  // Softmax over hand-set scores, causal (no attending to later words).
  const weights = words.map((_, q) => {
    const row = [];
    for (let k = 0; k <= q; k++) {
      const score = 0.25 + (k === q ? 2.2 : 0) + (q - k === 1 ? 0.6 : 0)
        + ((LINKS[q] || []).includes(k) ? 2.4 : 0) + (k === 0 ? 0.5 : 0);
      row.push(Math.exp(score));
    }
    const sum = row.reduce((a, b) => a + b, 0);
    return row.map(v => v / sum);
  });

  // Headline tokens (visual only; the aria-label carries the sentence).
  const tokens = words.map(w => {
    const s = document.createElement('span');
    s.className = 'tok pending'; s.textContent = w; s.setAttribute('aria-hidden', 'true');
    headline.append(s, ' ');
    return s;
  });
  const caret = document.createElement('span');
  caret.className = 'caret'; caret.setAttribute('aria-hidden', 'true');

  const g = canvas.getContext('2d');
  const defaultReadout = readout.innerHTML;
  let size = 0, cell = 0, pad = 0, hover = null;
  let revealed = reduceMotion ? N : 0, tileProgress = reduceMotion ? Infinity : 0;

  const heat = t => {
    HEAT[0] = hexToRGB(css('--cold'));
    t = Math.min(1, Math.max(0, t));
    const x = t * (HEAT.length - 1), i = Math.min(HEAT.length - 2, Math.floor(x)), f = x - i;
    return `rgb(${HEAT[i].map((v, j) => Math.round(v + (HEAT[i + 1][j] - v) * f)).join(',')})`;
  };
  const tileIndex = (q, k) => Math.floor(q / TILE) * Math.ceil(N / TILE) + Math.floor(k / TILE);
  const roundRect = (x, y, w, h, r) => {
    g.beginPath(); g.moveTo(x + r, y);
    g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r);
    g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath();
  };

  function resize() {
    const dpr = window.devicePixelRatio || 1;
    size = canvas.clientWidth;
    canvas.width = size * dpr; canvas.height = size * dpr;
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    pad = Math.max(64, size * 0.2);
    cell = (size - pad - 30) / N;
    draw();
  }

  function draw() {
    const ink = css('--ink'), ir = inkRGB(), cold = css('--cold');
    g.clearRect(0, 0, size, size);
    g.font = `600 ${Math.max(9, Math.min(13, cell * 0.42))}px "Atkinson Hyperlegible", sans-serif`;
    const r = Math.min(4, cell * 0.14);

    for (let q = 0; q < N; q++) for (let k = 0; k < N; k++) {
      const x = pad + k * cell, y = pad + q * cell;
      if (k > q) { // masked future: a short dash
        g.strokeStyle = `rgba(${ir},.14)`; g.lineWidth = 1;
        g.beginPath(); g.moveTo(x + cell * .3, y + cell * .5); g.lineTo(x + cell * .7, y + cell * .5); g.stroke();
        continue;
      }
      const shown = q < revealed && tileIndex(q, k) < tileProgress;
      const t = shown ? Math.pow(weights[q][k] / Math.max(...weights[q]), 1.6) : 0;
      let fill = shown ? heat(t) : cold;
      if (hover && hover[0] !== q && shown) fill = heat(t * 0.35);
      g.fillStyle = fill; roundRect(x + 1.5, y + 1.5, cell - 3, cell - 3, r); g.fill();
      if (hover && hover[0] === q && hover[1] === k) {
        g.strokeStyle = ink; g.lineWidth = 2; roundRect(x + .5, y + .5, cell - 1, cell - 1, r + 1); g.stroke();
      }
    }

    g.textBaseline = 'middle';
    for (let i = 0; i < N; i++) {
      const isQuery = hover && hover[0] === i, isKey = hover && hover[1] === i;
      g.fillStyle = isQuery ? css('--ember') : isKey ? css('--violet') : (i < revealed ? ink : `rgba(${ir},.25)`);
      g.textAlign = 'right';
      g.fillText(bare(words[i]), pad - 8, pad + i * cell + cell / 2);
      g.save(); g.translate(pad + i * cell + cell / 2, pad - 8); g.rotate(-Math.PI / 3.2);
      g.textAlign = 'left'; g.fillText(bare(words[i]), 0, 0); g.restore();
    }
  }

  function setHover(q, k) {
    tokens.forEach(t => t.classList.remove('lit', 'near'));
    if (q === null) { hover = null; readout.innerHTML = defaultReadout; draw(); return; }
    hover = [q, k];
    tokens[q].classList.add('lit');
    if (k !== q) tokens[k].classList.add('near');
    const pct = Math.round(weights[q][k] * 100);
    readout.innerHTML = `<b>“${esc(bare(words[q]))}”</b> puts <b>${pct}%</b> of its attention on <b>“${esc(bare(words[k]))}”</b>`;
    draw();
  }

  function locate(e) {
    const b = canvas.getBoundingClientRect();
    const k = Math.floor((e.clientX - b.left - pad) / cell), q = Math.floor((e.clientY - b.top - pad) / cell);
    return (q < 0 || k < 0 || q >= N || k > q || q >= revealed) ? null : [q, k];
  }

  canvas.addEventListener('pointermove', e => { const p = locate(e); p ? setHover(...p) : setHover(null); });
  canvas.addEventListener('pointerleave', () => setHover(null));
  tokens.forEach((t, i) => {
    t.addEventListener('mouseenter', () => {
      if (i >= revealed) return;
      // highlight the earlier word this one attends to most
      let best = 0;
      weights[i].forEach((v, k) => { if (k < i && v > weights[i][best]) best = k; });
      setHover(i, i === 0 ? 0 : best);
    });
    t.addEventListener('mouseleave', () => setHover(null));
  });
  window.addEventListener('resize', resize);
  window.addEventListener('themechange', draw);

  await document.fonts.ready;
  resize();

  if (reduceMotion) { tokens.forEach(t => t.classList.remove('pending')); return; }

  // The one orchestrated moment: decode the headline, then sweep the tiles.
  // It starts when the headline scrolls into view, since it sits below the
  // full-screen title.
  let i = 0;
  const step = () => {
    if (i >= N) {
      const total = Math.ceil(N / TILE) ** 2;
      let p = 0; tileProgress = 0;
      const sweep = () => { tileProgress = ++p; draw(); if (p < total) setTimeout(sweep, 70); else setTimeout(() => caret.remove(), 900); };
      sweep();
      return;
    }
    tokens[i].classList.remove('pending'); tokens[i].after(caret);
    revealed = i + 1; tileProgress = Infinity; draw();
    i++; setTimeout(step, 90 + Math.random() * 120);
  };
  onVisible(headline, () => setTimeout(step, 250), 0.6);
}
