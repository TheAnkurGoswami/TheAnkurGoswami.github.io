// Projects as folders.
//
// Side projects (projects.json) and open-source work (contributions.json)
// render as coloured folders. Clicking one tips its flap open and lays a
// sheet out under that row with the overview, highlights, technologies
// and links. Click again, press Escape or use "Close folder" to put it away.

import { fetchJSON, reduceMotion, esc } from './lib.js';
import { ICONS } from './project-icons.js';

const SIDE_COLOURS = ['', 'violet', 'slate', 'ember']; // cycled across side projects
const LEAD_COUNT = 3; // side projects shown before the open-source folders

const fromProject = (p, i) => ({
  id: p.id, kind: 'Side project', colour: SIDE_COLOURS[i % SIDE_COLOURS.length],
  title: p.title, subtitle: p.subtitle, icon: p.icon,
  description: p.description, highlights: p.highlights || [], technologies: p.technologies || [],
  links: [['View on GitHub', p.repoUrl], ...(p.links || []).map(l => [l.label, l.url])].filter(l => l[1]),
});

const fromContribution = (c, i) => ({
  id: `oss-${i}`, kind: 'Open source', colour: 'oss',
  title: c.projectName, subtitle: c.role, icon: c.icon,
  description: c.description, highlights: c.highlights || [], technologies: c.technologies || [],
  links: [[`View ${c.projectName}`, c.projectUrl]],
});

export async function initProjects() {
  const box = document.getElementById('folders');
  if (!box) return;
  const [projects, { contributions }] = await Promise.all([fetchJSON('projects.json'), fetchJSON('contributions.json')]);

  const side = projects.map(fromProject);
  const oss = contributions.map(fromContribution);
  // Open source sits in the first row so it is seen without scrolling.
  const items = [...side.slice(0, LEAD_COUNT), ...oss, ...side.slice(LEAD_COUNT)];

  const buttons = items.map(item => {
    const b = document.createElement('button');
    b.className = `folder ${item.colour}`;
    b.setAttribute('aria-expanded', 'false');
    b.innerHTML = `
      <span class="back"><span class="tab">${item.kind}</span></span>
      <span class="paper" aria-hidden="true"><i></i><i></i><i></i></span>
      <span class="front">${ICONS[item.icon] || ''}<span class="ft">${esc(item.title)}</span><span class="fs">${esc(item.subtitle || '')}</span></span>`;
    b.addEventListener('click', () => toggle(item, b));
    box.appendChild(b);
    return b;
  });

  let sheet = null, openId = null;

  function close() {
    sheet?.remove(); sheet = null; openId = null;
    buttons.forEach(b => b.setAttribute('aria-expanded', 'false'));
  }

  function toggle(item, button) {
    if (openId === item.id) { close(); button.focus(); return; }
    close();
    openId = item.id;
    button.setAttribute('aria-expanded', 'true');

    // Insert the sheet after the last folder in the clicked folder's row.
    const cols = getComputedStyle(box).gridTemplateColumns.split(' ').length;
    const i = buttons.indexOf(button);
    const rowEnd = buttons[Math.min(buttons.length - 1, Math.floor(i / cols) * cols + cols - 1)];

    sheet = document.createElement('div');
    sheet.className = 'sheet';
    sheet.id = 'project-sheet';
    sheet.setAttribute('role', 'region');
    sheet.setAttribute('aria-label', item.title);
    button.setAttribute('aria-controls', sheet.id);
    sheet.innerHTML = `
      <div>
        <p class="label">${item.kind === 'Open source' ? 'Open source' : 'Project overview'}</p>
        <h3>${esc(item.title)}</h3>
        <p>${esc(item.description)}</p>
      </div>
      <div>
        <p class="label">Details and source</p>
        <ul>${item.highlights.map(h => `<li>${esc(h)}</li>`).join('')}</ul>
        <div class="chips">${item.technologies.map(t => `<span>${esc(t)}</span>`).join('')}</div>
        <div class="actions">
          ${item.links.map(([label, url], k) => `<a class="btn ${k ? 'ghost' : ''}" href="${esc(url)}">${esc(label)}</a>`).join('')}
          <button class="close">Close folder</button>
        </div>
      </div>`;
    rowEnd.after(sheet);
    sheet.querySelector('.close').addEventListener('click', () => { close(); button.focus(); });
    if (sheet.getBoundingClientRect().bottom > innerHeight) {
      sheet.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'nearest' });
    }
  }

  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape' || !openId) return;
    const b = buttons[items.findIndex(it => it.id === openId)];
    close(); b.focus();
  });

  // Re-place an open sheet when the number of columns changes.
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      if (!openId) return;
      const idx = items.findIndex(it => it.id === openId);
      openId = null;
      toggle(items[idx], buttons[idx]);
    }, 150);
  });
}

export async function initEducation() {
  const box = document.getElementById('education');
  if (!box) return;
  const education = await fetchJSON('education.json');
  box.innerHTML = education.map(e => `<p><b>${esc(e.institution)}</b>, ${esc(e.degree)}. ${esc(e.summary || '')}</p>`).join('');
}
