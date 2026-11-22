// Section headings rise into place the first time they scroll into view.
// The hiding class is added here, so headings stay visible without
// JavaScript, and nothing moves for reduced-motion users.
(function () {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) return;
  const heads = document.querySelectorAll('main > section .sec-head');
  const io = new IntersectionObserver((entries, obs) => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      e.target.classList.add('is-in');
      obs.unobserve(e.target);
    });
  }, { threshold: 0.4 });
  heads.forEach(h => { h.classList.add('reveal'); io.observe(h); });
})();
