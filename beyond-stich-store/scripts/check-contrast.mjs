/**
 * WCAG contrast check for the light palette.
 *
 *   node scripts/check-contrast.mjs
 *
 * The dark tokens in globals.css carry their measured ratios in comments
 * because the audit found text that failed on some surfaces but not others —
 * #808080 passed on the page background and failed on cards. A second palette
 * repeats that risk, so every light pairing is measured here rather than
 * eyeballed, and this script is the record of it.
 *
 * AA requires 4.5:1 for body text and 3:1 for large text and UI borders.
 */

const hex = (h) => {
  const v = h.replace('#', '');
  return [0, 2, 4].map((i) => parseInt(v.slice(i, i + 2), 16));
};

// WCAG relative luminance.
const lum = ([r, g, b]) => {
  const a = [r, g, b].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2];
};

const ratio = (a, b) => {
  const [l1, l2] = [lum(hex(a)), lum(hex(b))].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
};

const LIGHT = {
  bg: '#FFFFFF',
  bgSecondary: '#F7F7F5',
  bgCard: '#FFFFFF',
  bgElevated: '#F2F2EF',
  surface: '#EBEBE7',
  border: '#DEDEDA',
  textPrimary: '#121212',
  textSecondary: '#52525B',
  textMuted: '#5F5F68',
  accent: '#7A5F15',
  accentInk: '#FFFFFF',
  success: '#126B33',
  error: '#B91C1C',
};

const SURFACES = [
  ['bg', LIGHT.bg],
  ['bgSecondary', LIGHT.bgSecondary],
  ['bgCard', LIGHT.bgCard],
  ['bgElevated', LIGHT.bgElevated],
  ['surface', LIGHT.surface],
];

const TEXTS = [
  ['textPrimary', LIGHT.textPrimary, 4.5],
  ['textSecondary', LIGHT.textSecondary, 4.5],
  ['textMuted', LIGHT.textMuted, 4.5],
  ['accent', LIGHT.accent, 4.5],
  ['success', LIGHT.success, 4.5],
  ['error', LIGHT.error, 4.5],
];

let failures = 0;
console.log('\nLight palette — text on every surface (AA needs 4.5:1)\n');

for (const [tName, tHex, min] of TEXTS) {
  const parts = SURFACES.map(([sName, sHex]) => {
    const r = ratio(tHex, sHex);
    if (r < min) failures++;
    return `${sName} ${r.toFixed(2)}${r < min ? ' FAIL' : ''}`;
  });
  console.log(`  ${tName.padEnd(15)} ${parts.join('  ')}`);
}

// An accent fill needs its ink to be readable on top of it.
const inkOnAccent = ratio(LIGHT.accentInk, LIGHT.accent);
if (inkOnAccent < 4.5) failures++;
console.log(`\n  accentInk on accent fill: ${inkOnAccent.toFixed(2)}${inkOnAccent < 4.5 ? ' FAIL' : ''}`);

// Borders are UI, not text: 3:1 against the surface they sit on.
const borderOnBg = ratio(LIGHT.border, LIGHT.bg);
console.log(`  border on bg:             ${borderOnBg.toFixed(2)} (decorative, 3:1 only if load-bearing)`);

console.log(failures ? `\n${failures} failure(s).\n` : '\nAll text pairings pass AA.\n');
process.exit(failures ? 1 : 0);
