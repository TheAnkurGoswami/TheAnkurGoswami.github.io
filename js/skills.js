// "What I work with": skills.json grouped by the job each tool does.

import { fetchJSON, esc } from './lib.js';

export async function initSkills() {
  const box = document.getElementById('skills-list');
  if (!box) return;
  const groups = await fetchJSON('skills.json');
  box.innerHTML = groups.map(g => `
    <div>
      <h3>${esc(g.group)}</h3>
      <ul>${g.skills.map(s => `<li>${s.logoUrl ? `<img src="${esc(s.logoUrl)}" alt="" width="18" height="18" loading="lazy">` : ''}${esc(s.name)}</li>`).join('')}</ul>
    </div>`).join('');
}
