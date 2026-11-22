/*
 * Light/dark theme toggle, shared by the home page and the blog.
 *
 * The initial theme is applied by a tiny inline script in each page's <head>
 * (stored choice, else the OS preference) so there is no flash of the wrong
 * theme. This file wires up the toggle button (#theme-toggle), remembers the
 * choice, and fires a `themechange` event so canvases can redraw.
 */
(function () {
  const root = document.documentElement;
  const btn = document.getElementById('theme-toggle');
  if (!btn) return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const label = () => btn.setAttribute('aria-label',
    root.dataset.theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
  label();

  btn.addEventListener('click', () => {
    const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
    const apply = () => {
      root.dataset.theme = next;
      label();
      window.dispatchEvent(new Event('themechange'));
    };
    try { localStorage.setItem('theme', next); } catch (e) { /* storage may be blocked */ }

    // Circular reveal from the button where View Transitions are supported.
    if (!document.startViewTransition || reduce) { apply(); return; }
    const r = btn.getBoundingClientRect();
    const x = r.left + r.width / 2, y = r.top + r.height / 2;
    const radius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
    document.startViewTransition(apply).ready.then(() => {
      root.animate(
        { clipPath: [`circle(0 at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
        { duration: 650, easing: 'cubic-bezier(.4,0,.2,1)', pseudoElement: '::view-transition-new(root)' }
      );
    });
  });
})();
