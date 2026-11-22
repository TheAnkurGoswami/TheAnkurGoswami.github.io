// Small line drawings for the front of each project folder, keyed by the
// "icon" field in projects.json / contributions.json. All use currentColor.

const causalGrid = [...Array(16)].map((_, i) => {
  const r = i >> 2, c = i & 3;
  return c <= r ? `<rect x="${c * 10 + 1}" y="${r * 10 + 1}" width="8" height="8" rx="2" opacity="${c === r ? 1 : 0.45}"/>` : '';
}).join('');

export const ICONS = {
  attention: `<svg viewBox="0 0 40 40" fill="currentColor">${causalGrid}</svg>`,
  network: '<svg viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="1.6"><g opacity=".55"><path d="M6 10 20 6M6 10 20 20M6 10 20 34M6 30 20 6M6 30 20 20M6 30 20 34M20 6 34 20M20 20 34 20M20 34 34 20"/></g><g fill="currentColor" stroke="none"><circle cx="6" cy="10" r="3.4"/><circle cx="6" cy="30" r="3.4"/><circle cx="20" cy="6" r="3.4"/><circle cx="20" cy="20" r="3.4"/><circle cx="20" cy="34" r="3.4"/><circle cx="34" cy="20" r="3.4"/></g></svg>',
  graph: '<svg viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="8" cy="8" r="5"/><circle cx="8" cy="32" r="5"/><circle cx="22" cy="20" r="5"/><circle cx="35" cy="20" r="4"/><path d="M12 11 18 17M12 29 18 23M27 20h4"/><text x="22" y="23" font-size="8" text-anchor="middle" fill="currentColor" stroke="none">×</text></svg>',
  face: '<svg viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M4 12V4h8M28 4h8v8M36 28v8h-8M12 36H4v-8"/><g fill="currentColor" stroke="none"><circle cx="15" cy="17" r="2"/><circle cx="25" cy="17" r="2"/><circle cx="20" cy="23" r="1.6"/><circle cx="15" cy="28" r="1.4"/><circle cx="20" cy="29.5" r="1.4"/><circle cx="25" cy="28" r="1.4"/></g></svg>',
  video: '<svg viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="2" y="8" width="11" height="24" rx="2" opacity=".5"/><rect x="15" y="8" width="11" height="24" rx="2"/><rect x="28" y="8" width="10" height="24" rx="2" opacity=".5"/><rect x="17" y="13" width="7" height="12" stroke-dasharray="2 2"/></svg>',
  ocr: '<svg viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="1.6"><text x="20" y="25" font-size="14" text-anchor="middle" fill="currentColor" stroke="none" font-family="serif">∫x²</text><path d="M3 30h34" stroke-dasharray="3 3"/><path d="M4 4h6M4 4v6M36 4h-6M36 4v6"/></svg>',
  chain: '<svg viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="2.2"><rect x="3" y="14" width="18" height="12" rx="6"/><rect x="19" y="14" width="18" height="12" rx="6"/></svg>',
  package: '<svg viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M20 4 35 11v18L20 36 5 29V11z"/><path d="M5 11l15 7 15-7M20 18v18"/></svg>',
};
