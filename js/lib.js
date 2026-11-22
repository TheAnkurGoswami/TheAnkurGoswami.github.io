// Small helpers shared by the section modules.

export const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Fetch a JSON file from the site root. */
export async function fetchJSON(path) {
  const res = await fetch(path, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Could not load ${path} (${res.status})`);
  return res.json();
}

/** Read a CSS custom property from :root, e.g. css('--ink'). */
export const css = name => getComputedStyle(document.documentElement).getPropertyValue(name).trim();

/** "21, 24, 58" style triple for the current ink colour, for canvas rgba(). */
export const inkRGB = () => css('--ink-rgb').replace(/\s+/g, '');

/** "#C9CEE3" → [201, 206, 227] */
export const hexToRGB = hex => [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16));

/** Run fn once the element is at least `threshold` visible (immediately if motion is reduced). */
export function onVisible(el, fn, threshold = 0.35) {
  if (reduceMotion || !('IntersectionObserver' in window)) { fn(); return; }
  const io = new IntersectionObserver((entries, obs) => {
    if (entries[0].isIntersecting) { fn(); obs.disconnect(); }
  }, { threshold });
  io.observe(el);
}

/** Parse "Aug 2024" into a fractional year (2024 + 7/12). "Present" → now. */
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export function parseMonth(label) {
  if (!label || /present/i.test(label)) {
    const d = new Date();
    return d.getFullYear() + d.getMonth() / 12;
  }
  const [mon, year] = label.split(' ');
  return Number(year) + MONTHS.indexOf(mon.slice(0, 3)) / 12;
}
export const formatMonth = t => {
  const y = Math.floor(t + 1e-6);
  const m = Math.min(11, Math.floor((t - y) * 12 + 1e-6));
  return `${MONTHS[m]} ${y}`;
};

/** Escape text for safe insertion into innerHTML. */
export const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
