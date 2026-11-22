// Work experience drawn as a training run.
//
// Two loss curves over the years: "train" (what I learned) and
// "validation" (what I shipped). Roles from experience.json become shaded
// epochs; the gap between the internship and the first job is labelled
// with the education entry. Notes along the curve read like training
// events. Moving along the chart (pointer, touch or arrow keys) shows the
// month and switches the details panel to that role.

import { fetchJSON, reduceMotion, parseMonth, formatMonth, onVisible, esc } from './lib.js';

// Training events along the curve: [when, label]. Positions are fractional years.
const NOTES = [
  [2020.0, 'Warmup: IISc internship'],
  [2020.8, 'Plateau: final year at NIT'],
  [2023.25, 'LR bump: switched to LLMs'],
  [2025.4, 'Fine-tuning on agents'],
  [2026.3, 'Best checkpoint so far'],
  [2026.75, 'New run: Gartner'],
];

export async function initTimeline() {
  const box = document.getElementById('run-chart');
  if (!box) return;
  const panel = document.getElementById('role-panel');
  const readout = document.getElementById('run-readout');

  const [experience, education] = await Promise.all([fetchJSON('experience.json'), fetchJSON('education.json')]);

  // Oldest first, with numeric start/end (end is exclusive: the month after).
  const roles = experience.map(r => ({
    ...r,
    s: parseMonth(r.startDate),
    e: parseMonth(r.endDate) + 1 / 12,
    current: /present/i.test(r.endDate),
  })).sort((a, b) => a.s - b.s);

  // Fill gaps between roles with the education entry, if there is one.
  const spans = [];
  roles.forEach((r, i) => {
    const prev = roles[i - 1];
    if (prev && r.s - prev.e > 2 / 12 && education[0]) {
      spans.push({ company: education[0].institution, role: education[0].degree, gap: true,
        summary: education[0].summary, s: prev.e, e: r.s });
    }
    spans.push(r);
  });

  const T0 = roles[0].s - 0.05;
  const NOW = roles[roles.length - 1].e;
  const T1 = NOW + 0.3;
  const latest = roles[roles.length - 1];

  // The curve: exponential decay with a plateau during the gap year and a
  // learning-rate bump when the work moved to LLMs.
  const train = t => {
    const u = (t - T0) / (T1 - T0);
    let v = 0.9 * Math.exp(-2.4 * u) + 0.07;
    if (t > 2020.2 && t < 2021.4) v += 0.03 * Math.sin((t - 2020.2) / 1.2 * Math.PI);
    v += 0.07 * Math.exp(-Math.pow((t - 2023.25) / 0.12, 2));
    return v;
  };
  const val = t => train(t) + 0.07 + 0.035 * Math.sin(t * 8.1) + 0.02 * Math.sin(t * 19);

  const roleAt = t => spans.find(r => t >= r.s && t < r.e) || latest;

  let shown = null;
  function showRole(r) {
    if (r === shown) return;
    shown = r;
    const when = r.gap ? esc(r.role) : `${esc(r.role)}<br>${esc(r.startDate)} to ${esc(r.endDate)}`;
    const items = (r.details && r.details.length)
      ? r.details.map(d => `<div><h4>${esc(d.title)}</h4><p>${esc(d.description)}</p></div>`).join('')
      : `<div><p>${esc(r.summary || '')}</p></div>`;
    panel.innerHTML = `<div class="role"><div><h3>${esc(r.company)}</h3><div class="when">${when}</div></div><div class="items">${items}</div></div>`;
  }

  let svg, g, Y, cursor, cursorLine, cursorDot, cursorLabel, drawn = false;
  let tCur = Math.max(T0 + 0.01, latest.s - 0.6);

  function build() {
    const W = box.clientWidth, narrow = W < 640;
    const H = narrow ? 300 : 420;
    g = { x0: narrow ? 8 : 56, x1: W - (narrow ? 8 : 12), y0: narrow ? 40 : 96, y1: H - 30 };
    g.X = t => g.x0 + (t - T0) / (T1 - T0) * (g.x1 - g.x0);
    Y = v => g.y0 + (1 - v / 1.05) * (g.y1 - g.y0);
    const path = (f, a, b) => {
      let d = '';
      for (let t = a; t <= b + 1e-9; t += 0.02) d += (d ? 'L' : 'M') + g.X(t).toFixed(1) + ' ' + Y(f(t)).toFixed(1);
      return d;
    };

    let h = '';
    roles.forEach((r, i) => {
      const fill = r.current ? 'rgba(255,176,0,.16)' : i % 2 ? 'rgba(var(--ink-rgb),.04)' : 'rgba(91,63,224,.08)';
      h += `<rect x="${g.X(r.s)}" y="${g.y0 - 16}" width="${g.X(Math.min(r.e, NOW)) - g.X(r.s)}" height="${g.y1 - g.y0 + 16}" style="fill:${fill}"/>`;
      if (i > 0) {
        const x = r.current ? g.X(NOW) - 4 : g.X(r.s) + (narrow ? 4 : 8);
        h += `<text class="band" x="${x}" y="${g.y0 + 2}" ${r.current ? 'text-anchor="end"' : ''}>${esc(r.company)}</text>`;
      }
    });
    h += `<line x1="${g.x0}" y1="${g.y1}" x2="${g.x1}" y2="${g.y1}" style="stroke:var(--ink)" stroke-width="1.5"/>`;
    if (!narrow) {
      h += `<line x1="${g.x0}" y1="${g.y0 - 16}" x2="${g.x0}" y2="${g.y1}" style="stroke:var(--ink)" stroke-width="1.5"/>`;
      h += `<text x="${g.x0 - 10}" y="${g.y0}" text-anchor="end">high</text><text x="${g.x0 - 10}" y="${g.y1}" text-anchor="end">low</text>`;
    }
    for (let y = Math.ceil(T0); y <= Math.floor(NOW); y++) {
      if (!narrow || y % 2 === 0) h += `<text x="${g.X(y)}" y="${g.y1 + 20}" text-anchor="middle">${y}</text>`;
    }
    h += `<path class="draw" d="${path(val, T0, NOW)}" fill="none" style="stroke:var(--ember)" stroke-width="2" opacity=".85"/>`;
    h += `<path class="draw" d="${path(train, T0, NOW)}" fill="none" style="stroke:var(--line)" stroke-width="3"/>`;
    h += `<path d="${path(train, NOW, T1)}" fill="none" style="stroke:var(--ink)" stroke-width="2" stroke-dasharray="5 6" opacity=".55"/>`;

    const placed = []; // label boxes already drawn, to avoid overlaps
    NOTES.forEach(([t, label], i) => {
      if (t < T0 || t > NOW) return;
      const x = g.X(t), y = Y(train(t)), last = i === NOTES.length - 1;
      h += `<circle cx="${x}" cy="${y}" r="${last ? 7 : 4}" style="fill:${last ? '#FFB000' : 'var(--ink)'};stroke:var(--ink)" stroke-width="${last ? 1.5 : 0}"/>`;
      if (!narrow) {
        const anchor = x > g.x1 - 160 ? 'end' : x < g.x0 + 90 ? 'start' : 'middle';
        const w = label.length * 6.6;
        const left = anchor === 'start' ? x : anchor === 'end' ? x - w : x - w / 2;
        let ly = Math.max(22, y - (70 + (i % 2) * 34));
        // lift the label above any earlier label it would collide with
        for (const p of placed) {
          if (left < p.right + 8 && left + w > p.left - 8 && Math.abs(ly - p.ly) < 22) ly = Math.max(14, p.ly - 24);
        }
        placed.push({ left, right: left + w, ly });
        h += `<line x1="${x}" y1="${y}" x2="${x}" y2="${ly}" style="stroke:var(--ink)" stroke-width="1"/>`;
        h += `<text class="note" x="${x}" y="${ly - 6}" text-anchor="${anchor}">${esc(label)}</text>`;
      }
    });

    h += `<g class="cursor" style="display:none"><line y1="${g.y0 - 16}" y2="${g.y1}" style="stroke:var(--ink)" stroke-width="1" stroke-dasharray="3 3"/>`
       + `<circle r="6" style="fill:var(--line);stroke:var(--paper)" stroke-width="2"/><text class="note" y="${g.y1 - 8}"></text></g>`;

    box.innerHTML = `<svg viewBox="0 0 ${W} ${H}" height="${H}" tabindex="0" role="slider" aria-label="Career timeline. Use the left and right arrow keys to move by month." aria-valuemin="0" aria-valuemax="100">${h}</svg>`;
    svg = box.querySelector('svg');
    cursor = svg.querySelector('.cursor');
    [cursorLine, cursorDot, cursorLabel] = cursor.children;

    const paths = svg.querySelectorAll('.draw');
    paths.forEach(p => {
      const L = p.getTotalLength();
      p.style.strokeDasharray = L;
      p.style.strokeDashoffset = (reduceMotion || drawn) ? 0 : L;
      p.style.transition = 'stroke-dashoffset 2.4s cubic-bezier(.3,.6,.2,1)';
    });
    if (!drawn) onVisible(svg, () => { drawn = true; paths.forEach(p => { p.style.strokeDashoffset = 0; }); });

    const toT = e => { const b = svg.getBoundingClientRect(); return T0 + (e.clientX - b.left - g.x0) / (g.x1 - g.x0) * (T1 - T0); };
    svg.addEventListener('pointermove', e => moveTo(toT(e)));
    svg.addEventListener('pointerdown', e => moveTo(toT(e)));
    svg.addEventListener('keydown', e => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        e.preventDefault();
        moveTo(tCur + (e.key === 'ArrowRight' ? 1 : -1) / 12);
      }
    });
    moveTo(tCur);
  }

  function moveTo(t) {
    t = Math.min(NOW - 0.001, Math.max(T0 + 0.001, t));
    tCur = t;
    const x = g.X(t), flip = x > g.x1 - 90;
    cursor.style.display = '';
    cursorLine.setAttribute('x1', x); cursorLine.setAttribute('x2', x);
    cursorDot.setAttribute('cx', x); cursorDot.setAttribute('cy', Y(train(t)));
    cursorLabel.textContent = formatMonth(t);
    cursorLabel.setAttribute('x', x + (flip ? -8 : 8));
    cursorLabel.setAttribute('text-anchor', flip ? 'end' : 'start');

    const r = roleAt(t);
    showRole(r);
    svg.setAttribute('aria-valuenow', Math.round((t - T0) / (NOW - T0) * 100));
    svg.setAttribute('aria-valuetext', `${formatMonth(t)}, ${r.company}`);

    const note = NOTES.reduce((best, n) => Math.abs(n[0] - t) < Math.abs(best[0] - t) ? n : best);
    readout.innerHTML = Math.abs(note[0] - t) < 0.25
      ? `<b>${esc(note[1])}</b>, ${formatMonth(note[0])}`
      : `<b>${formatMonth(t)}</b>, ${esc(r.company)}`;
  }

  build();
  let resizeTimer;
  window.addEventListener('resize', () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(build, 150); });
}
