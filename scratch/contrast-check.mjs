// WCAG Contrast Ratio Checker for Midnight Indigo theme tokens

function hslToRgb(h, s, l) {
  s /= 100;
  l /= 100;
  const k = n => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = n => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return [Math.round(f(0) * 255), Math.round(f(8) * 255), Math.round(f(4) * 255)];
}

function relativeLuminance([r, g, b]) {
  const [rs, gs, bs] = [r, g, b].map(c => {
    c /= 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function contrastRatio(rgb1, rgb2) {
  const l1 = relativeLuminance(rgb1);
  const l2 = relativeLuminance(rgb2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

const darkTokens = {
  background: [234, 33, 6],       // #0A0B14
  surface: [232, 32, 9],          // #10121F
  surfaceRaised: [232, 30, 13],    // #171A2B
  card: [232, 32, 9],
  foreground: [230, 45, 94],      // #E8EAF5
  mutedForeground: [230, 20, 66],  // #9399B8
  subtleForeground: [230, 15, 47], // #636987
  primary: [248, 95, 64],         // #6952FF (Nudged to 64% lightness for 5.21:1 pass with white text)
  primaryFg: [0, 0, 100],         // #FFFFFF
  primarySubtle: [247, 60, 15],
  accent2: [171, 77, 58],         // #4FE3CC
  accent2Subtle: [171, 50, 12],
  success: [158, 64, 52],
  successFg: [152, 76, 88],
  successSubtle: [158, 45, 11],
  warning: [43, 96, 56],
  warningFg: [45, 93, 86],
  warningSubtle: [40, 50, 11],
  danger: [351, 95, 71],
  dangerFg: [355, 100, 91],
  dangerSubtle: [350, 45, 12],
  info: [213, 94, 68],
  infoFg: [214, 95, 91],
  infoSubtle: [215, 45, 12],
};

const lightTokens = {
  background: [228, 45, 98],      // #F7F8FC
  surface: [0, 0, 100],           // #FFFFFF
  surfaceRaised: [228, 45, 96],   // #F0F2F9
  card: [0, 0, 100],
  foreground: [231, 39, 10],      // #0F1222
  mutedForeground: [230, 17, 42],
  subtleForeground: [229, 16, 60],
  primary: [246, 85, 60],         // #5544F0
  primaryFg: [0, 0, 100],         // #FFFFFF
  primarySubtle: [244, 89, 96],
  accent2: [175, 84, 26],         // #0B7369 (Calibrated to 26% lightness for 4.86:1 pass)
  accent2Subtle: [170, 70, 95],
  success: [161, 94, 30],
  successFg: [163, 88, 18],
  successSubtle: [152, 76, 95],
  warning: [32, 95, 44],
  warningFg: [26, 90, 25],
  warningSubtle: [48, 100, 95],
  danger: [347, 77, 50],
  dangerFg: [345, 80, 28],
  dangerSubtle: [356, 100, 97],
  info: [221, 83, 53],
  infoFg: [224, 76, 30],
  infoSubtle: [214, 100, 97],
};

function runAudit(name, tokens) {
  console.log(`\n=== ${name} Theme Contrast Audit ===`);

  const tests = [
    { label: 'Foreground on Background', fg: tokens.foreground, bg: tokens.background, req: 4.5 },
    { label: 'Foreground on Card', fg: tokens.foreground, bg: tokens.card, req: 4.5 },
    { label: 'Foreground on Surface Raised', fg: tokens.foreground, bg: tokens.surfaceRaised, req: 4.5 },
    { label: 'Muted Foreground on Background', fg: tokens.mutedForeground, bg: tokens.background, req: 4.5 },
    { label: 'Muted Foreground on Card', fg: tokens.mutedForeground, bg: tokens.card, req: 4.5 },
    { label: 'Primary Foreground on Primary (Button text)', fg: tokens.primaryFg, bg: tokens.primary, req: 4.5 },
    { label: 'Primary on Background (Large text & UI)', fg: tokens.primary, bg: tokens.background, req: 3.0 },
    { label: 'Accent-2 on Background (Large text & UI)', fg: tokens.accent2, bg: tokens.background, req: 3.0 },
    { label: 'Success FG on Success Subtle (Badges)', fg: tokens.successFg, bg: tokens.successSubtle, req: 4.5 },
    { label: 'Warning FG on Warning Subtle (Badges)', fg: tokens.warningFg, bg: tokens.warningSubtle, req: 4.5 },
    { label: 'Danger FG on Danger Subtle (Badges)', fg: tokens.dangerFg, bg: tokens.dangerSubtle, req: 4.5 },
    { label: 'Info FG on Info Subtle (Badges)', fg: tokens.infoFg, bg: tokens.infoSubtle, req: 4.5 },
  ];

  let allPassed = true;
  for (const t of tests) {
    const fgRgb = hslToRgb(...t.fg);
    const bgRgb = hslToRgb(...t.bg);
    const ratio = contrastRatio(fgRgb, bgRgb);
    const passed = ratio >= t.req;
    if (!passed) allPassed = false;
    console.log(
      `${passed ? '✓ PASS' : '✗ FAIL'} ${ratio.toFixed(2)}:1 (req ${t.req}:1) - ${t.label}`
    );
  }
  return allPassed;
}

const darkOk = runAudit('Dark (Midnight Indigo)', darkTokens);
const lightOk = runAudit('Light (Airy Navy)', lightTokens);

if (darkOk && lightOk) {
  console.log('\n🎉 ALL CONTRAST TESTS PASSED WCAG AA (4.5:1 body text, 3.0:1 UI/large text)!');
} else {
  console.error('\n⚠️ SOME TESTS FAILED');
  process.exit(1);
}
