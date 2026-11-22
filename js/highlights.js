// "Numbers I'm proud of": the GPU-utilisation bar fills from 25% to 90%
// the first time it scrolls into view.

import { onVisible } from './lib.js';

export async function initHighlights() {
  const bar = document.getElementById('gpu-bar');
  if (bar) onVisible(bar, () => bar.classList.add('is-filled'), 0.6);
}
