// "Writing": cards for the latest blog posts, read from blog/manifest.json
// so a new post shows up here without touching the home page.

import { fetchJSON, esc } from './lib.js';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const formatDate = iso => { const [y, m] = iso.split('-'); return `${MONTHS[Number(m) - 1]} ${y}`; };

// A small grid motif in the corner of each card: a causal triangle or
// Flash-Attention-style tiles, alternating.
function drawMotif(canvas, kind) {
  const dpr = window.devicePixelRatio || 1, size = 150, n = 6, s = size / n;
  canvas.width = size * dpr; canvas.height = size * dpr;
  const g = canvas.getContext('2d');
  g.scale(dpr, dpr);
  for (let q = 0; q < n; q++) for (let k = 0; k < n; k++) {
    if (kind === 'causal') {
      if (k > q) continue;
      g.fillStyle = k < q ? 'rgba(232,235,244,.18)' : '#FFB000';
    } else {
      g.fillStyle = ((q >> 1) + (k >> 1)) % 2 ? 'rgba(255,255,255,.22)' : 'rgba(255,176,0,.85)';
    }
    g.fillRect(k * s + 2, q * s + 2, s - 4, s - 4);
  }
}

export async function initWriting() {
  const box = document.getElementById('posts');
  if (!box) return;
  const posts = (await fetchJSON('blog/manifest.json'))
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 2);

  box.innerHTML = posts.map((p, i) => `
    <a class="post" href="${esc(p.path)}">
      <h3>${esc(p.title)}</h3>
      <p>${esc(p.description)}</p>
      <span class="meta">${formatDate(p.date)}, ${esc(p.format || `${p.readingTime} min read`)}</span>
      <canvas data-motif="${i % 2 ? 'tiles' : 'causal'}" aria-hidden="true"></canvas>
    </a>`).join('');
  box.querySelectorAll('canvas').forEach(c => drawMotif(c, c.dataset.motif));
}
