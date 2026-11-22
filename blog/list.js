// The blog's post list, built from manifest.json (newest first).
(function () {
  const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const formatDate = iso => { const [y, m] = iso.split('-'); return `${MONTHS[Number(m) - 1]} ${y}`; };
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const box = document.getElementById('post-list');

  function drawMotif(canvas, kind) {
    const dpr = window.devicePixelRatio || 1, size = 150, n = 6, s = size / n;
    canvas.width = size * dpr; canvas.height = size * dpr;
    const g = canvas.getContext('2d'); g.scale(dpr, dpr);
    for (let q = 0; q < n; q++) for (let k = 0; k < n; k++) {
      if (kind === 'causal') { if (k > q) continue; g.fillStyle = k < q ? 'rgba(232,235,244,.18)' : '#FFB000'; }
      else g.fillStyle = ((q >> 1) + (k >> 1)) % 2 ? 'rgba(255,255,255,.22)' : 'rgba(255,176,0,.85)';
      g.fillRect(k * s + 2, q * s + 2, s - 4, s - 4);
    }
  }

  fetch('manifest.json', { cache: 'no-store' })
    .then(r => { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then(posts => {
      posts.sort((a, b) => b.date.localeCompare(a.date));
      box.innerHTML = posts.map((p, i) => `
        <a class="post-card" href="../${esc(p.path)}">
          <div><h2>${esc(p.title)}</h2><p>${esc(p.description)}</p></div>
          <div>
            <span class="meta">${formatDate(p.date)}, ${esc(p.format || `${p.readingTime} min read`)}</span>
            <div class="tags">${p.tags.map(t => `<span>${esc(t)}</span>`).join('')}</div>
          </div>
          <canvas data-motif="${i % 2 ? 'tiles' : 'causal'}" aria-hidden="true"></canvas>
        </a>`).join('');
      box.querySelectorAll('canvas').forEach(c => drawMotif(c, c.dataset.motif));
    })
    .catch(() => { box.innerHTML = '<p class="list-empty">The post list could not load. Refresh the page to try again.</p>'; });
})();
