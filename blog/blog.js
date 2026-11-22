// Behaviour shared by blog pages: reading progress, the top bar's height
// (for sticky sub-headers) and an auto-built "On this page" list.
(function () {
  const root = document.documentElement;

  // Expose the top bar's height so sticky sub-headers can sit under it.
  const bar = document.querySelector('.topbar');
  const setBarHeight = () => bar && root.style.setProperty('--bar-h', bar.offsetHeight + 'px');
  setBarHeight();
  addEventListener('resize', setBarHeight);

  // Reading progress line along the bottom of the top bar.
  const progress = document.querySelector('.reading-progress');
  if (progress) {
    const update = () => {
      const h = root.scrollHeight - innerHeight;
      progress.style.transform = `scaleX(${h > 0 ? Math.min(1, scrollY / h) : 0})`;
    };
    addEventListener('scroll', update, { passive: true });
    update();
  }

  // Contents list from the post's h2s (and an optional bonus <details>).
  const toc = document.getElementById('toc');
  if (!toc) return;
  const heads = [...document.querySelectorAll('#blog-post h2, #blog-post details[data-toc] > summary')];
  const slug = s => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const links = heads.map(h => {
    const label = h.closest('details[data-toc]')?.dataset.toc || h.textContent.trim();
    h.id = h.id || slug(label);
    const a = document.createElement('a');
    a.href = '#' + h.id;
    a.textContent = label;
    if (h.tagName === 'SUMMARY') a.addEventListener('click', () => { h.parentElement.open = true; });
    const li = document.createElement('li');
    li.appendChild(a);
    toc.appendChild(li);
    return a;
  });
  if (!('IntersectionObserver' in window)) return;
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) links.forEach(a => a.classList.toggle('is-current', a.getAttribute('href') === '#' + e.target.id));
    });
  }, { rootMargin: '-20% 0px -70% 0px' });
  heads.forEach(h => io.observe(h));
})();
