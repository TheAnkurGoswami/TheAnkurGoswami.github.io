// Entry point for the home page. Each section lives in its own module
// and renders into its own <section>; a failure in one does not stop the rest.

import { initTitle } from './title.js';
import { initAttention } from './attention.js?v=2';
import { initTimeline } from './timeline.js';
import { initHighlights } from './highlights.js';

const sections = [initTitle, initAttention, initTimeline, initHighlights];

for (const load of sections) {
  load().catch(err => console.error(err));
}
