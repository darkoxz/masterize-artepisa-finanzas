/**
 * MASTERIZE · ARTEPISA — AGENTIC OS V4.7 FINANCIAL DECK & CALCULATOR
 * Arquitectado por /moranza-ux-ui (Jack Roberts Agentic OS V4.7) + /finance-team + /web-presentation-pro
 * - Motor financiero 100% determinista ($150k / 3 Hitos / 3 Bolsas / 4 Socios / Iguala MRR)
 * - Presentación interactiva de 7 diapositivas (Teclado ← →, Grid [ESC], Notas [S], Fullscreen [F], Pausa [B])
 * - WebGL 3D VoiceOrbCanvas (4-octave FBM, Fresnel pow(1.0 - z, 2.4), cycleAt(t) 4.5s, uPoint) + Nebula Backdrop
 * - Canvas 2D Liquid Surge Spheres 60fps (22 burbujas + doble onda + cáusticas lighter + salpicaduras 320 px/s²)
 */

const DEFAULTS = {
  contractGross: 150000,
  chkOmarReimb: true,
  omarReimb: 10660,
  chkMon30: true,
  mon30: 3199,
  chkMon15: true,
  mon15: 973.50,
  chkViaticos: true,
  viaticos: 1167.50,
  igualaGross: 10000,
  azure: 2000,
  claude: 2000,
  googleAi: 2000,
  selectedHito: 'total', // 'total' | 'h1' | 'h2' | 'h3'
  unitMode: 'mxn',       // 'mxn' | 'pct'
  orbGroup: 'partners',  // 'partners' | 'buckets'
  renderMode: 'orb',     // 'orb' | 'bar'
  activeView: 'all',     // 'all' | 'orbs' | 'dials' | 'spei'
  orbMood: 'idle',       // 'idle' | 'listening' | 'thinking' | 'working' | 'speaking' | 'error'
  currentSlide: 0,       // 0..6
  activeSubstepIndex: 0,
  hasActiveSpotlight: false,
  isOverview: false,
  showNotes: false,
  isBlackout: false,
  isAutoPlaying: false,
};

const ORB_PALETTES = {
  idle:      { c: ['#2a0d2a', '#d45bb6', '#f386a1'], speed: 0.3, swirl: 0.7 },
  listening: { c: ['#04403c', '#2ee6c8', '#f2fffc'], speed: 0.8, swirl: 1.1 },
  thinking:  { c: ['#3a0b33', '#d45bb6', '#f386a1'], speed: 1.8, swirl: 2.3 },
  working:   { c: ['#4a1c04', '#f5a524', '#fff1c7'], speed: 1.1, swirl: 1.6 },
  speaking:  { c: ['#1f1a6e', '#8f7cff', '#f1efff'], speed: 0.9, swirl: 1.2 },
  error:     { c: ['#3a1614', '#f2957a', '#ffe6d6'], speed: 0.35, swirl: 0.5 },
};

// Harmonic Resting Drift Stops (interpolated every 4.5s in 'idle' mood via cycleAt(t))
const IDLE_DRIFT_STOPS = [
  ['#2a0d2a', '#d45bb6', '#f386a1'], // Cosmic Purple
  ['#1e1338', '#9b78cf', '#e3d3f7'], // Lavender Indigo
  ['#0b2239', '#38a3d1', '#d4f1ff'], // Deep Sea Blue
  ['#072e27', '#40b89b', '#d9fff5'], // Emerald Mint
  ['#3b1a08', '#e8932c', '#ffedd1'], // Warm Amber
];

// 22 Seeded Rising Effervescent Bubbles & Ballistic Gravity (320 px/s²)
const LIQUID_GRAVITY = 320;
const BUBBLE_SEEDS = Array.from({ length: 22 }, (_, i) => {
  const s1 = Math.sin((i + 1) * 12.9898) * 43758.5453;
  const s2 = Math.sin((i + 1) * 78.233) * 19341.1123;
  const f1 = s1 - Math.floor(s1);
  const f2 = s2 - Math.floor(s2);
  return {
    index: i,
    xFrac: -0.78 + (i / 21) * 1.56 + (f1 - 0.5) * 0.08,
    r: 1.25 + (i % 4) * 0.55 + f2 * 0.35,
    speed: 16 + (i % 5) * 4.2 + f1 * 5,
    wobbleFreq: 1.6 + (i % 3) * 0.75,
    wobbleAmp: 2.2 + (i % 4) * 1.1,
    phase: i * 0.85 + f2 * Math.PI,
  };
});

const SLIDES_META = [
  {
    index: 0,
    name: 'Contrato',
    getNote: (c) =>
      `${fmtMXN(c.gross)}: 70% Pool Socios (${fmtMXN(c.hitos.total.pool)}) · 20% Inversión/Caja (${fmtMXN(c.caja.gross)}) · 10% Closer (${fmtMXN(c.hitos.total.closer)}).`,
  },
  {
    index: 1,
    name: 'Hitos',
    getNote: (c) =>
      `Primeros ${fmtMXN(c.hitos.h1.gross)} (H1): ${fmtMXN(c.hitos.h1.caja)} cubren 100% Inversión/Caja y los siguientes ${fmtMXN(c.hitos.h1.sociosTotal)} se dividen entre socios; H2 (${fmtMXN(c.hitos.h2.gross)}) y H3 (${fmtMXN(c.hitos.h3.gross)}) liquidan al 100%.`,
  },
  {
    index: 2,
    name: 'Socios',
    getNote: (c) =>
      `Total liquidado: Daniel ${fmtMXN(c.consolidated.danielTotalBenefit)} · Omar ${fmtMXN(c.consolidated.omarTotalCash)} · Pedro ${fmtMXN(c.consolidated.pedroTotalCash)} · Octavio ${fmtMXN(c.partners.octavio.total)}.`,
  },
  {
    index: 3,
    name: 'Caja',
    getNote: (c) =>
      `Primeros ${fmtMXN(c.caja.gross)} en H1: -${fmtMXN(c.caja.expenses)} de gastos/reembolsos = ${fmtMXN(c.caja.free)} libres en Caja (${c.caja.marginPct.toFixed(1)}%).`,
  },
  {
    index: 4,
    name: 'Iguala',
    getNote: (c) =>
      `Iguala ${fmtMXN(c.iguala.gross)}/mes - ${fmtMXN(c.iguala.costTotal)}/mes Stack IA = ${fmtMXN(c.iguala.freeMonthly)}/mes libres (${fmtMXN(c.iguala.freeAnnual)}/año).`,
  },
  {
    index: 5,
    name: 'SPEI',
    getNote: (c) =>
      `Dispersión por hito: H1 ${fmtMXN(c.hitos.h1.gross)} (${fmtShortK(c.hitos.h1.caja)} Caja + ${fmtShortK(c.hitos.h1.sociosTotal)} Socios) · H2 ${fmtMXN(c.hitos.h2.gross)} (100% Socios) · H3 ${fmtMXN(c.hitos.h3.gross)} (100% Socios) = ${fmtMXN(c.gross)}.`,
  },
  {
    index: 6,
    name: 'Pasos',
    getNote: (c) =>
      `Tesorería Libre Año 1: ${fmtMXN(c.caja.free)} (Caja H1) + ${fmtMXN(c.iguala.freeAnnual)} (12m Iguala) = ${fmtMXN(c.year1FreeTreasury)}.`,
  },
];

/**
 * Pure deterministic financial calculator for ARTEPISA ERP contract.
 * Rule for Hito 1 ($60,000 MXN):
 * - First $30,000 MXN (100% of the 20% Caja / Inversión bucket) go to Inversión y Caja MASTERIZE in Hito 1
 *   (covering $10,660 Omar IA + $4,172.50 2 Monitores Daniel + $1,167.50 Viáticos Pedro = $16,000 + $14,000 Caja Libre).
 * - Next $30,000 MXN of Hito 1 go to the partners according to percentages ($6,000 Closer 10% + $24,000 Pool 50%/25%/15%/10%).
 * - Hito 2 ($45,000) and Hito 3 ($45,000) go 100% to the partners ($0 Caja) until everyone is 100% liquidated ($150,000 total).
 */
function calculateFinancials(rawState) {
  const s = { ...DEFAULTS, ...rawState };
  const gross = Math.max(0, Number(s.contractGross) || 0);
  const iva = gross * 0.16;
  const totalWithIva = gross + iva;

  // Milestone gross amounts (40% / 30% / 30%)
  const h1Gross = gross * 0.40;
  const h2Gross = gross * 0.30;
  const h3Gross = gross * 0.30;

  // Master Buckets (20% Caja/Inversión, 10% Closer Omar, 70% Pool Neto Equipo)
  const cajaTotal = gross * 0.20;
  const closerTotal = gross * 0.10;
  const poolTotal = gross * 0.70;

  // First $30k of the first $60k (H1) covers 100% of Inversión / Caja MASTERIZE ($30k in H1, $0 in H2, $0 in H3)
  const cajaH1 = cajaTotal;
  const cajaH2 = 0;
  const cajaH3 = 0;

  // Closer Omar (10% per milestone: $6k in H1, $4.5k in H2, $4.5k in H3 = $15k total)
  const closerH1 = h1Gross * 0.10;
  const closerH2 = h2Gross * 0.10;
  const closerH3 = h3Gross * 0.10;

  // Pool Neto Equipo per milestone ($24k in H1 + $40.5k in H2 + $40.5k in H3 = $105k total)
  // Notice that in H1: closerH1 ($6k) + poolH1 ($24k) = $30,000 (the exact second $30k of the first $60k!)
  const poolH1 = h1Gross - cajaH1 - closerH1;
  const poolH2 = h2Gross - cajaH2 - closerH2;
  const poolH3 = h3Gross - cajaH3 - closerH3;

  const sociosH1 = poolH1 + closerH1;
  const sociosH2 = poolH2 + closerH2;
  const sociosH3 = poolH3 + closerH3;
  const sociosTotal = poolTotal + closerTotal;

  // Partner splits inside Pool Neto (50% Daniel, 25% Omar, 15% Pedro, 10% Octavio)
  const partners = {
    daniel: {
      sharePool: 0.50,
      h1: poolH1 * 0.50,
      h2: poolH2 * 0.50,
      h3: poolH3 * 0.50,
      total: poolTotal * 0.50,
    },
    omarPool: {
      sharePool: 0.25,
      h1: poolH1 * 0.25,
      h2: poolH2 * 0.25,
      h3: poolH3 * 0.25,
      total: poolTotal * 0.25,
    },
    omarTotal: {
      h1: poolH1 * 0.25 + closerH1,
      h2: poolH2 * 0.25 + closerH2,
      h3: poolH3 * 0.25 + closerH3,
      total: poolTotal * 0.25 + closerTotal,
    },
    pedro: {
      sharePool: 0.15,
      h1: poolH1 * 0.15,
      h2: poolH2 * 0.15,
      h3: poolH3 * 0.15,
      total: poolTotal * 0.15,
    },
    octavio: {
      sharePool: 0.10,
      h1: poolH1 * 0.10,
      h2: poolH2 * 0.10,
      h3: poolH3 * 0.10,
      total: poolTotal * 0.10,
    },
  };

  // Caja MASTERIZE Deductions (paid 100% from the first $30,000 in Hito 1)
  const omarReimbEff = s.chkOmarReimb ? Math.max(0, Number(s.omarReimb) || 0) : 0;
  const mon30Eff = s.chkMon30 ? Math.max(0, Number(s.mon30) || 0) : 0;
  const mon15Eff = s.chkMon15 ? Math.max(0, Number(s.mon15) || 0) : 0;
  const monitorsTotal = mon30Eff + mon15Eff;
  const viaticosEff = s.chkViaticos ? Math.max(0, Number(s.viaticos) || 0) : 0;

  const cajaExpensesTotal = omarReimbEff + monitorsTotal + viaticosEff;
  const cajaFree = cajaTotal - cajaExpensesTotal;
  const cajaMarginPct = cajaTotal > 0 ? (cajaFree / cajaTotal) * 100 : 0;

  // Consolidated Partner Metrics
  const omarNetProfit = closerTotal + partners.omarPool.total; // $41,250 on $150k
  const omarTotalCash = omarNetProfit + omarReimbEff;          // $51,910 on $150k
  const danielTotalBenefit = partners.daniel.total + monitorsTotal; // $56,672.50 on $150k
  const pedroTotalCash = partners.pedro.total + viaticosEff;   // $16,917.50 on $150k

  // Monthly Retainer (Iguala MRR)
  const igualaGross = Math.max(0, Number(s.igualaGross) || 0);
  const azure = Math.max(0, Number(s.azure) || 0);
  const claude = Math.max(0, Number(s.claude) || 0);
  const googleAi = Math.max(0, Number(s.googleAi) || 0);
  const igualaCostTotal = azure + claude + googleAi;
  const igualaFreeMonthly = igualaGross - igualaCostTotal;
  const igualaFreeAnnual = igualaFreeMonthly * 12;
  const igualaMarginPct = igualaGross > 0 ? (igualaFreeMonthly / igualaGross) * 100 : 0;

  // Consolidated Year 1 Free Treasury (Caja Free + 12m Free Iguala)
  const year1FreeTreasury = cajaFree + igualaFreeAnnual;

  return {
    gross,
    iva,
    totalWithIva,
    hitos: {
      h1: { gross: h1Gross, caja: cajaH1, closer: closerH1, pool: poolH1, sociosTotal: sociosH1 },
      h2: { gross: h2Gross, caja: cajaH2, closer: closerH2, pool: poolH2, sociosTotal: sociosH2 },
      h3: { gross: h3Gross, caja: cajaH3, closer: closerH3, pool: poolH3, sociosTotal: sociosH3 },
      total: { gross, caja: cajaTotal, closer: closerTotal, pool: poolTotal, sociosTotal },
    },
    partners,
    caja: {
      gross: cajaTotal,
      omarReimb: omarReimbEff,
      mon30: mon30Eff,
      mon15: mon15Eff,
      monitorsTotal,
      viaticos: viaticosEff,
      expenses: cajaExpensesTotal,
      free: cajaFree,
      marginPct: cajaMarginPct,
    },
    consolidated: {
      omarNetProfit,
      omarTotalCash,
      danielTotalBenefit,
      pedroTotalCash,
      octavioTotalCash: partners.octavio.total,
    },
    iguala: {
      gross: igualaGross,
      azure,
      claude,
      googleAi,
      costTotal: igualaCostTotal,
      freeMonthly: igualaFreeMonthly,
      freeAnnual: igualaFreeAnnual,
      marginPct: igualaMarginPct,
    },
    year1FreeTreasury,
  };
}

// Formatters
const fmtMXN = (val, decimals = 2) => {
  const num = Number(val) || 0;
  const sign = num < 0 ? '-' : '';
  return (
    sign +
    '$' +
    Math.abs(num).toLocaleString('es-MX', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    })
  );
};

const fmtCompactMXN = (val) => {
  const num = Number(val) || 0;
  if (Math.abs(num) >= 1000 && num % 1 === 0) {
    return fmtMXN(num, 0);
  }
  return fmtMXN(num, 2);
};

const fmtShortK = (val) => {
  const num = Number(val) || 0;
  const sign = num < 0 ? '-' : '';
  const abs = Math.abs(num);
  if (abs >= 1000) {
    const k = abs / 1000;
    const kStr = Math.abs(k - Math.round(k)) < 0.05 ? String(Math.round(k)) : k.toFixed(1);
    return `${sign}$${kStr}k`;
  }
  return fmtMXN(num, num % 1 === 0 ? 0 : 2);
};

/**
 * Jack Roberts Agentic OS V4.7 Law 2 — Auto-Bold Scanning (emphasise(text)):
 * Wraps dollar amounts, percentages, and key entities in <b> tags for 0.5s glanceability.
 */
function emphasise(text) {
  const safe = String(text || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  return safe.replace(
    /(-?\$[\d,]+(?:\.\d+)?(?:k|m|\/mes|\/año)?|\b\d+(?:\.\d+)?%|\b(?:MASTERIZE|ARTEPISA|Azure|Claude|Google AI|Gemini|SPEI|Pool|Caja|Closer|Daniel|Omar|Pedro|Octavio|H1|H2|H3|Iguala|Libre)\b)/g,
    '<b>$1</b>'
  );
}

function isDarkMode() {
  if (typeof document !== 'undefined' && document.documentElement && document.documentElement.classList) {
    return document.documentElement.classList.contains('dark');
  }
  return true;
}

/* ============================================================================
   COLOR & HARMONIC DRIFT UTILITIES (cycleAt(t) every 4.5s)
   ============================================================================ */

function hexToRgb(hex) {
  const clean = String(hex || '#c8afe9').replace('#', '');
  const n = parseInt(clean, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function hexToVec3(hex) {
  const rgb = hexToRgb(hex);
  return [rgb[0] / 255, rgb[1] / 255, rgb[2] / 255];
}

function lerpVec3(a, b, t) {
  return [
    a[0] + (b[0] - a[0]) * t,
    a[1] + (b[1] - a[1]) * t,
    a[2] + (b[2] - a[2]) * t,
  ];
}

function rgbaStr(rgb, a) {
  return `rgba(${Math.round(rgb[0])},${Math.round(rgb[1])},${Math.round(rgb[2])},${a})`;
}

/**
 * Harmonic Resting Drift (cycleAt(t)):
 * Interpolates smoothly every 4.5 seconds across Cosmic Purple, Lavender Indigo,
 * Deep Sea Blue, Emerald Mint, and Warm Amber when in 'idle' mood.
 */
function cycleAt(tSec, mood = 'idle') {
  if (mood !== 'idle' && ORB_PALETTES[mood]) {
    const pal = ORB_PALETTES[mood];
    return {
      c0: hexToVec3(pal.c[0]),
      c1: hexToVec3(pal.c[1]),
      c2: hexToVec3(pal.c[2]),
      speed: pal.speed,
      swirl: pal.swirl,
    };
  }
  const period = 4.5;
  const scaled = Math.max(0, tSec) / period;
  const idx = Math.floor(scaled) % IDLE_DRIFT_STOPS.length;
  const nextIdx = (idx + 1) % IDLE_DRIFT_STOPS.length;
  const frac = scaled - Math.floor(scaled);
  // Smoothstep interpolation
  const smooth = frac * frac * (3 - 2 * frac);
  const stopA = IDLE_DRIFT_STOPS[idx];
  const stopB = IDLE_DRIFT_STOPS[nextIdx];
  return {
    c0: lerpVec3(hexToVec3(stopA[0]), hexToVec3(stopB[0]), smooth),
    c1: lerpVec3(hexToVec3(stopA[1]), hexToVec3(stopB[1]), smooth),
    c2: lerpVec3(hexToVec3(stopA[2]), hexToVec3(stopB[2]), smooth),
    speed: ORB_PALETTES.idle.speed,
    swirl: ORB_PALETTES.idle.swirl,
  };
}

/* ============================================================================
   PILLAR 3B: CANVAS 2D LIQUID SURGE SPHERE (DrawOrbLiquidPhysics.ts)
   - Double sinusoidal wave surface: body(x, ph, k, sp, amp)
   - Damped spring velocity on surge: springVel(t, target)
   - Internal caustics with ctx.globalCompositeOperation = "lighter"
   - 22 seeded rising effervescent bubbles
   - Dynamic ballistic splash droplets with gravity (320 px/s²)
   ============================================================================ */

function roundedRectPath(ctx, x, y, w, h, r) {
  const rad = Math.min(r, w / 2, h / 2);
  if (typeof ctx.roundRect === 'function') {
    ctx.roundRect(x, y, w, h, rad);
    return;
  }
  ctx.moveTo(x + rad, y);
  ctx.arcTo(x + w, y, x + w, y + h, rad);
  ctx.arcTo(x + w, y + h, x, y + h, rad);
  ctx.arcTo(x, y + h, x, y, rad);
  ctx.arcTo(x, y, x + w, y, rad);
  ctx.closePath();
}

/**
 * Double sinusoidal wave surface (body(ph, k, sp, amp))
 */
function body(x, ph, k, sp, amp) {
  return (
    Math.sin(x * k - ph * sp) * amp +
    Math.cos(x * (k * 1.82) + ph * (sp * 1.36) + 1.15) * (amp * 0.48)
  );
}

/**
 * Damped spring velocity step for liquid level & surge slosh energy
 */
function stepSpringVel(cell, dt) {
  const clampedDt = Math.min(0.05, Math.max(0.001, dt));
  const stiffness = 18.0;
  const damping = 5.8;
  const disp = cell.toRatio - cell.currentRatio;
  cell.springVel = (cell.springVel || 0) + disp * stiffness * clampedDt;
  cell.springVel *= Math.exp(-damping * clampedDt);
  cell.currentRatio += cell.springVel * clampedDt;

  // Surge energy decays smoothly over time
  cell.surgeEnergy = Math.max(0, (cell.surgeEnergy || 0) * Math.exp(-2.6 * clampedDt));

  // Update ballistic splash droplets with gravity = 320 px/s²
  if (Array.isArray(cell.splashes)) {
    for (let i = cell.splashes.length - 1; i >= 0; i--) {
      const p = cell.splashes[i];
      p.x += p.vx * clampedDt;
      p.y += p.vy * clampedDt;
      p.vy += LIQUID_GRAVITY * clampedDt; // 320 px/s²
      p.life -= clampedDt;
      if (p.life <= 0 || p.y > 140) {
        cell.splashes.splice(i, 1);
      }
    }
  }
}

function spawnSplashDroplets(cell, size, fillRatio, count = 6) {
  if (!cell.splashes) cell.splashes = [];
  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.43;
  const clamped = Math.max(0.06, Math.min(0.93, fillRatio));
  const waterY = cy + r - clamped * (r * 2);

  for (let i = 0; i < count; i++) {
    const spread = (Math.random() - 0.5) * r * 1.1;
    cell.splashes.push({
      x: cx + spread,
      y: waterY - 1,
      vx: (Math.random() - 0.5) * 44,
      vy: -(48 + Math.random() * 68),
      r: 1.3 + Math.random() * 1.7,
      life: 0.42 + Math.random() * 0.35,
      maxLife: 0.75,
    });
  }
}

function drawLiquidOrb(ctx, size, cell, tSec) {
  const fillRatio = cell.currentRatio;
  const rgb = hexToRgb(cell.item.color);
  const lightRgb = hexToRgb(cell.item.light);
  const dark = isDarkMode();
  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.43;

  ctx.clearRect(0, 0, size, size);

  // Outer ambient aura
  const auraGrad = ctx.createRadialGradient(cx, cy, r * 0.55, cx, cy, r * 1.14);
  auraGrad.addColorStop(0, rgbaStr(lightRgb, dark ? 0.16 : 0.22));
  auraGrad.addColorStop(1, rgbaStr(rgb, 0));
  ctx.fillStyle = auraGrad;
  ctx.beginPath();
  ctx.arc(cx, cy, r * 1.14, 0, Math.PI * 2);
  ctx.fill();

  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.clip();

  // Glass sphere cavity (dark obsidian vs light crystal cavity)
  const bgGrad = ctx.createRadialGradient(cx, cy - r * 0.3, r * 0.06, cx, cy, r);
  bgGrad.addColorStop(0, dark ? '#1c1a27' : '#2a2438');
  bgGrad.addColorStop(1, dark ? '#09090d' : '#14111d');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(cx - r, cy - r, r * 2, r * 2);

  if (fillRatio > 0.002) {
    const clamped = Math.max(0.06, Math.min(0.94, fillRatio));
    const waterY = cy + r - clamped * (r * 2);
    const waveAmp = 2.6 + (cell.surgeEnergy || 0) * 5.2 + Math.abs(cell.springVel || 0) * 8;
    const k = 0.072;
    const sp = 2.8;

    // 1. Secondary Back Wave (volumetric depth)
    ctx.beginPath();
    ctx.moveTo(cx - r - 4, cy + r + 4);
    for (let x = cx - r - 4; x <= cx + r + 4; x += 3) {
      const wy = waterY + body(x, tSec + 1.4, k * 0.92, sp * 0.85, waveAmp * 0.82) - 2.5;
      ctx.lineTo(x, wy);
    }
    ctx.lineTo(cx + r + 4, cy + r + 4);
    ctx.closePath();
    ctx.fillStyle = rgbaStr(rgb, 0.45);
    ctx.fill();

    // 2. Primary Front Double-Sinusoidal Liquid Body
    ctx.beginPath();
    ctx.moveTo(cx - r - 4, cy + r + 4);
    for (let x = cx - r - 4; x <= cx + r + 4; x += 2.5) {
      const wy = waterY + body(x, tSec, k, sp, waveAmp);
      ctx.lineTo(x, wy);
    }
    ctx.lineTo(cx + r + 4, cy + r + 4);
    ctx.closePath();

    const liqGrad = ctx.createLinearGradient(cx, waterY - waveAmp, cx, cy + r);
    liqGrad.addColorStop(0, rgbaStr(lightRgb, 0.94));
    liqGrad.addColorStop(0.38, rgbaStr(rgb, 0.90));
    liqGrad.addColorStop(1, rgbaStr(rgb, 0.98));
    ctx.fillStyle = liqGrad;
    ctx.fill();

    // 3. Internal Caustics with ctx.globalCompositeOperation = "lighter"
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const causticY = waterY + (cy + r - waterY) * 0.42;
    const causticX = cx + Math.sin(tSec * 1.7 + cell.phaseOffset) * (r * 0.22);
    const causticGrad = ctx.createRadialGradient(
      causticX,
      causticY,
      2,
      causticX,
      causticY,
      r * 0.72
    );
    causticGrad.addColorStop(0, rgbaStr(lightRgb, 0.34));
    causticGrad.addColorStop(0.55, rgbaStr(rgb, 0.14));
    causticGrad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = causticGrad;
    ctx.beginPath();
    ctx.arc(causticX, causticY, r * 0.72, 0, Math.PI * 2);
    ctx.fill();

    // Secondary caustic ribbon near meniscus
    ctx.beginPath();
    for (let x = cx - r; x <= cx + r; x += 3) {
      const wy = waterY + body(x, tSec, k, sp, waveAmp) + 4;
      if (x === cx - r) ctx.moveTo(x, wy);
      else ctx.lineTo(x, wy);
    }
    ctx.lineWidth = 3;
    ctx.strokeStyle = rgbaStr(lightRgb, 0.28);
    ctx.stroke();
    ctx.restore();

    // 4. 22 Seeded Rising Effervescent Bubbles
    const liqHeight = Math.max(12, cy + r - waterY);
    for (let i = 0; i < BUBBLE_SEEDS.length; i++) {
      const b = BUBBLE_SEEDS[i];
      const travel = ((tSec * b.speed + b.phase * 14) % liqHeight);
      const by = cy + r - travel;
      const bx =
        cx +
        b.xFrac * (r * 0.82) +
        Math.sin(tSec * b.wobbleFreq + b.phase) * b.wobbleAmp;

      // Keep bubble inside the sphere chord and below the wave crest
      const dyCenter = by - cy;
      const maxChord = Math.sqrt(Math.max(0, r * r - dyCenter * dyCenter)) - b.r - 2;
      const localWaveY = waterY + body(bx, tSec, k, sp, waveAmp);
      if (Math.abs(bx - cx) < maxChord && by > localWaveY + b.r + 1) {
        ctx.beginPath();
        ctx.arc(bx, by, b.r, 0, Math.PI * 2);
        ctx.fillStyle = rgbaStr(lightRgb, 0.28);
        ctx.fill();
        ctx.lineWidth = 0.7;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
        ctx.stroke();
      }
    }

    // 5. Crisp Glowing Meniscus Crest Line
    ctx.beginPath();
    for (let x = cx - r - 2; x <= cx + r + 2; x += 2.5) {
      const wy = waterY + body(x, tSec, k, sp, waveAmp);
      if (x === cx - r - 2) ctx.moveTo(x, wy);
      else ctx.lineTo(x, wy);
    }
    ctx.lineWidth = 1.9;
    ctx.strokeStyle = rgbaStr(lightRgb, 0.96);
    ctx.stroke();

    // 6. Dynamic Ballistic Splash Droplets (320 px/s² gravity)
    if (Array.isArray(cell.splashes)) {
      for (const p of cell.splashes) {
        if (p.y < waterY + 3) {
          const alpha = Math.max(0, Math.min(1, p.life / p.maxLife));
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fillStyle = rgbaStr(lightRgb, alpha * 0.92);
          ctx.fill();
        }
      }
    }
  }

  // 7. 3D Glass Sphere Specular Arc Highlight
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.9, -Math.PI * 0.78, -Math.PI * 0.28);
  ctx.lineWidth = 2.2;
  ctx.lineCap = 'round';
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
  ctx.stroke();

  ctx.restore();

  // Outer crystal rim stroke
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = rgbaStr(dark ? lightRgb : rgb, dark ? 0.52 : 0.68);
  ctx.stroke();
  ctx.restore();
}

function drawLiquidBar(ctx, size, cell, tSec) {
  const fillRatio = cell.currentRatio;
  const rgb = hexToRgb(cell.item.color);
  const lightRgb = hexToRgb(cell.item.light);
  const dark = isDarkMode();

  ctx.clearRect(0, 0, size, size);
  const w = size * 0.42;
  const h = size * 0.84;
  const x = (size - w) / 2;
  const y = (size - h) / 2;
  const rad = w / 2;

  ctx.save();
  ctx.beginPath();
  roundedRectPath(ctx, x, y, w, h, rad);
  ctx.clip();

  ctx.fillStyle = dark ? '#111016' : '#1b1726';
  ctx.fillRect(x, y, w, h);

  if (fillRatio > 0.002) {
    const clamped = Math.max(0.06, Math.min(0.95, fillRatio));
    const fillH = h * clamped;
    const topY = y + h - fillH;
    const waveAmp = 1.8 + (cell.surgeEnergy || 0) * 3.5 + Math.abs(cell.springVel || 0) * 5;
    const k = 0.09;
    const sp = 3.0;

    // 1. Secondary Back Wave
    ctx.beginPath();
    ctx.moveTo(x - 2, y + h + 2);
    for (let px = x - 2; px <= x + w + 2; px += 2.5) {
      const wy = topY + body(px, tSec + 1.2, k * 0.9, sp * 0.85, waveAmp * 0.8) - 2;
      ctx.lineTo(px, wy);
    }
    ctx.lineTo(x + w + 2, y + h + 2);
    ctx.closePath();
    ctx.fillStyle = rgbaStr(rgb, 0.45);
    ctx.fill();

    // 2. Primary Front Double-Sinusoidal Liquid Body
    ctx.beginPath();
    ctx.moveTo(x - 2, y + h + 2);
    for (let px = x - 2; px <= x + w + 2; px += 2) {
      const wy = topY + body(px, tSec, k, sp, waveAmp);
      ctx.lineTo(px, wy);
    }
    ctx.lineTo(x + w + 2, y + h + 2);
    ctx.closePath();

    const colGrad = ctx.createLinearGradient(x, topY, x, y + h);
    colGrad.addColorStop(0, rgbaStr(lightRgb, 0.94));
    colGrad.addColorStop(1, rgbaStr(rgb, 0.96));
    ctx.fillStyle = colGrad;
    ctx.fill();

    // 3. Internal Caustics with ctx.globalCompositeOperation = "lighter"
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = rgbaStr(lightRgb, 0.22);
    ctx.fillRect(x + w * 0.25, topY, w * 0.5, fillH);
    ctx.restore();

    // 4. All 22 Seeded Rising Effervescent Bubbles inside bar
    const liqHeight = Math.max(10, fillH);
    for (let i = 0; i < BUBBLE_SEEDS.length; i++) {
      const b = BUBBLE_SEEDS[i];
      const travel = (tSec * b.speed + b.phase * 10) % liqHeight;
      const by = y + h - travel;
      const bx =
        x +
        w / 2 +
        b.xFrac * (w * 0.36) +
        Math.sin(tSec * b.wobbleFreq + b.phase) * (b.wobbleAmp * 0.45);
      const localWaveY = topY + body(bx, tSec, k, sp, waveAmp);
      if (by > localWaveY + b.r + 1 && bx > x + 3 && bx < x + w - 3) {
        ctx.beginPath();
        ctx.arc(bx, by, b.r * 0.85, 0, Math.PI * 2);
        ctx.fillStyle = rgbaStr(lightRgb, 0.32);
        ctx.fill();
      }
    }

    // 5. Crisp Glowing Meniscus Crest Line
    ctx.beginPath();
    for (let px = x - 2; px <= x + w + 2; px += 2) {
      const wy = topY + body(px, tSec, k, sp, waveAmp);
      if (px === x - 2) ctx.moveTo(px, wy);
      else ctx.lineTo(px, wy);
    }
    ctx.lineWidth = 1.6;
    ctx.strokeStyle = rgbaStr(lightRgb, 0.95);
    ctx.stroke();

    // 6. Dynamic Ballistic Splash Droplets (320 px/s² gravity)
    if (Array.isArray(cell.splashes)) {
      for (const p of cell.splashes) {
        const clampedX = x + w / 2 + (p.x - size / 2) * 0.48;
        if (p.y < topY + 3 && clampedX > x + 2 && clampedX < x + w - 2) {
          const alpha = Math.max(0, Math.min(1, p.life / p.maxLife));
          ctx.beginPath();
          ctx.arc(clampedX, p.y, p.r * 0.9, 0, Math.PI * 2);
          ctx.fillStyle = rgbaStr(lightRgb, alpha * 0.92);
          ctx.fill();
        }
      }
    }
  }

  ctx.restore();

  ctx.save();
  ctx.beginPath();
  roundedRectPath(ctx, x, y, w, h, rad);
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = rgbaStr(dark ? lightRgb : rgb, dark ? 0.48 : 0.64);
  ctx.stroke();
  ctx.restore();
}

/* ============================================================================
   PILLAR 3A: WEBGL 3D VOICE ORB SHADER + NEBULA BACKDROP (VoiceOrbCanvas.tsx)
   - Reconstructs 3D sphere from UV coordinates (z = sqrt(1.0 - rr*rr))
   - 4 octaves of Fractional Brownian Motion (fbm)
   - Fresnel reflection: pow(1.0 - z, 2.4)
   - Dynamic cursor lighting (uPoint) & cycleAt(t) 4.5s harmonic drift
   ============================================================================ */

function initVoiceOrbEngine(getAppState, getEffectiveMood) {
  const orbCanvas = document.getElementById('voiceOrbCanvas');
  const nebulaCanvas = document.getElementById('nebulaCanvas');
  if (!orbCanvas) return null;

  const pointer = { x: 0.35, y: 0.35, targetX: 0.35, targetY: 0.35 };
  const stageEl = document.getElementById('voiceDockStage') || orbCanvas;

  stageEl.addEventListener('pointermove', (e) => {
    const rect = stageEl.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      const rawX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const rawY = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      pointer.targetX = Math.max(-1, Math.min(1, rawX));
      pointer.targetY = Math.max(-1, Math.min(1, rawY));
    }
  });
  stageEl.addEventListener('pointerleave', () => {
    pointer.targetX = 0.35;
    pointer.targetY = 0.35;
  });

  const nebCtx = nebulaCanvas ? nebulaCanvas.getContext('2d') : null;

  // Initialize WebGL on #voiceOrbCanvas (with graceful 2D fallback)
  let gl = null;
  try {
    gl =
      orbCanvas.getContext('webgl', { alpha: true, antialias: true, premultipliedAlpha: false }) ||
      orbCanvas.getContext('experimental-webgl');
  } catch (_) {
    gl = null;
  }

  let program = null;
  let uniforms = {};
  let fallbackCtx = null;

  if (gl) {
    const vsSource = `
      attribute vec2 aPos;
      varying vec2 vUv;
      void main() {
        vUv = aPos;
        gl_Position = vec4(aPos, 0.0, 1.0);
      }
    `;
    const fsSource = `
      precision mediump float;
      varying vec2 vUv;
      uniform float uTime;
      uniform float uSpeed;
      uniform float uSwirl;
      uniform vec2 uPoint;
      uniform vec3 uC0;
      uniform vec3 uC1;
      uniform vec3 uC2;

      float hash(vec2 p) {
        return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
      }

      float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        vec2 u = f * f * (3.0 - 2.0 * f);
        return mix(
          mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), u.x),
          mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
          u.y
        );
      }

      // 4-Octave Fractional Brownian Motion (fbm)
      float fbm(vec2 p) {
        float v = 0.0;
        float a = 0.5;
        mat2 rot = mat2(0.8, -0.6, 0.6, 0.8);
        for (int i = 0; i < 4; i++) {
          v += a * noise(p);
          p = rot * p * 2.02 + vec2(1.7, 9.2);
          a *= 0.5;
        }
        return v;
      }

      void main() {
        vec2 uv = vUv * 1.12;
        float rr = length(uv);
        if (rr > 1.0) {
          gl_FragColor = vec4(0.0);
          return;
        }

        // Reconstruct 3D sphere normal from UV coordinates
        float z = sqrt(max(0.0, 1.0 - rr * rr));
        vec3 normal = normalize(vec3(uv, z));

        float t = uTime * uSpeed;
        float angle = atan(uv.y, uv.x) + uSwirl * (1.0 - z) + t * 0.55;
        vec2 swirledUv = vec2(cos(angle), sin(angle)) * rr * 2.4 + normal.xy * 1.3;

        float n1 = fbm(swirledUv + vec2(t * 0.7, -t * 0.5));
        float n2 = fbm(swirledUv * 1.6 - vec2(t * 0.4, t * 0.8) + n1 * uSwirl);

        vec3 col = mix(uC0, uC1, smoothstep(0.18, 0.78, n1));
        col = mix(col, uC2, smoothstep(0.35, 0.92, n2));

        // Dynamic cursor lighting (uPoint)
        vec3 lightDir = normalize(vec3(uPoint.x, uPoint.y, 0.85));
        float diff = max(0.0, dot(normal, lightDir));
        float spec = pow(max(0.0, dot(reflect(-lightDir, normal), vec3(0.0, 0.0, 1.0))), 18.0);

        // Fresnel rim reflection pow(1.0 - z, 2.4)
        float fresnel = pow(1.0 - z, 2.4);

        col += uC2 * diff * 0.28 + vec3(1.0) * spec * 0.36;
        col = mix(col, uC2, fresnel * 0.68);

        float edgeAlpha = smoothstep(1.0, 0.94, rr);
        gl_FragColor = vec4(col, edgeAlpha);
      }
    `;

    const compile = (type, src) => {
      const sh = gl.createShader(type);
      gl.shaderSource(sh, src);
      gl.compileShader(sh);
      return gl.getShaderParameter(sh, gl.COMPILE_STATUS) ? sh : null;
    };

    const vs = compile(gl.VERTEX_SHADER, vsSource);
    const fs = compile(gl.FRAGMENT_SHADER, fsSource);
    if (vs && fs) {
      program = gl.createProgram();
      gl.attachShader(program, vs);
      gl.attachShader(program, fs);
      gl.linkProgram(program);
      if (gl.getProgramParameter(program, gl.LINK_STATUS)) {
        gl.useProgram(program);
        const buf = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buf);
        gl.bufferData(
          gl.ARRAY_BUFFER,
          new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
          gl.STATIC_DRAW
        );
        const aPos = gl.getAttribLocation(program, 'aPos');
        gl.enableVertexAttribArray(aPos);
        gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

        uniforms = {
          uTime: gl.getUniformLocation(program, 'uTime'),
          uSpeed: gl.getUniformLocation(program, 'uSpeed'),
          uSwirl: gl.getUniformLocation(program, 'uSwirl'),
          uPoint: gl.getUniformLocation(program, 'uPoint'),
          uC0: gl.getUniformLocation(program, 'uC0'),
          uC1: gl.getUniformLocation(program, 'uC1'),
          uC2: gl.getUniformLocation(program, 'uC2'),
        };
      } else {
        program = null;
      }
    }
  }

  if (!program) {
    fallbackCtx = orbCanvas.getContext('2d');
  }

  function renderFrame(tSec) {
    const state = getAppState();
    const effectiveMood =
      typeof getEffectiveMood === 'function' ? getEffectiveMood() : state.orbMood || 'idle';
    const pal = cycleAt(tSec, effectiveMood);

    pointer.x += (pointer.targetX - pointer.x) * 0.08;
    pointer.y += (pointer.targetY - pointer.y) * 0.08;

    // 1. Render Nebula Backdrop (#nebulaCanvas)
    if (nebCtx && nebulaCanvas) {
      const nw = nebulaCanvas.width;
      const nh = nebulaCanvas.height;
      nebCtx.clearRect(0, 0, nw, nh);

      const c1Rgb = pal.c1.map((v) => v * 255);
      const c2Rgb = pal.c2.map((v) => v * 255);

      const g1x = nw * 0.5 + Math.cos(tSec * 0.7) * 26;
      const g1y = nh * 0.5 + Math.sin(tSec * 0.9) * 18;
      const nebGrad = nebCtx.createRadialGradient(g1x, g1y, 4, nw * 0.5, nh * 0.5, nw * 0.55);
      nebGrad.addColorStop(0, rgbaStr(c2Rgb, 0.30));
      nebGrad.addColorStop(0.5, rgbaStr(c1Rgb, 0.16));
      nebGrad.addColorStop(1, 'rgba(0,0,0,0)');
      nebCtx.fillStyle = nebGrad;
      nebCtx.fillRect(0, 0, nw, nh);

      // Subtle cosmic dust particles
      for (let i = 0; i < 14; i++) {
        const px = ((i * 37 + tSec * (6 + (i % 4) * 2)) % nw);
        const py = ((i * 23 + Math.sin(tSec + i) * 12 + nh) % nh);
        const alpha = 0.2 + 0.25 * Math.sin(tSec * 2 + i);
        nebCtx.fillStyle = rgbaStr(c2Rgb, alpha);
        nebCtx.beginPath();
        nebCtx.arc(px, py, 1.1 + (i % 2) * 0.6, 0, Math.PI * 2);
        nebCtx.fill();
      }
    }

    // 2. Render WebGL 3D VoiceOrb (#voiceOrbCanvas)
    if (gl && program) {
      gl.viewport(0, 0, orbCanvas.width, orbCanvas.height);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.useProgram(program);
      gl.uniform1f(uniforms.uTime, tSec);
      gl.uniform1f(uniforms.uSpeed, pal.speed);
      gl.uniform1f(uniforms.uSwirl, pal.swirl);
      gl.uniform2f(uniforms.uPoint, pointer.x, pointer.y);
      gl.uniform3fv(uniforms.uC0, pal.c0);
      gl.uniform3fv(uniforms.uC1, pal.c1);
      gl.uniform3fv(uniforms.uC2, pal.c2);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
    } else if (fallbackCtx) {
      const w = orbCanvas.width;
      const h = orbCanvas.height;
      const cx = w / 2;
      const cy = h / 2;
      const r = w * 0.44;
      fallbackCtx.clearRect(0, 0, w, h);
      const c0 = pal.c0.map((v) => v * 255);
      const c1 = pal.c1.map((v) => v * 255);
      const c2 = pal.c2.map((v) => v * 255);
      const gx = cx + pointer.x * 22 + Math.cos(tSec * pal.speed * 2) * 14;
      const gy = cy - pointer.y * 22 + Math.sin(tSec * pal.speed * 2) * 14;
      const grad = fallbackCtx.createRadialGradient(gx, gy, r * 0.08, cx, cy, r);
      grad.addColorStop(0, rgbaStr(c2, 0.98));
      grad.addColorStop(0.5, rgbaStr(c1, 0.92));
      grad.addColorStop(1, rgbaStr(c0, 0.96));
      fallbackCtx.fillStyle = grad;
      fallbackCtx.beginPath();
      fallbackCtx.arc(cx, cy, r, 0, Math.PI * 2);
      fallbackCtx.fill();
    }
  }

  return { renderFrame, pointer };
}

/* ============================================================================
   260° 52-TICK SVG INSTRUMENT DIALS & VISIBLE SPARKLINE CURVE (.biz-bank-art)
   ============================================================================ */

function renderInstrumentDial(svgEl, ratio, activeColor) {
  if (!svgEl) return;
  const clamped = Math.max(0, Math.min(1, ratio));
  const dark = isDarkMode();
  const unlitTickColor = dark ? 'rgba(200, 175, 233, 0.14)' : 'rgba(40, 35, 47, 0.16)';
  const ringStrokeColor = dark ? 'rgba(200, 175, 233, 0.08)' : 'rgba(40, 35, 47, 0.12)';
  const totalTicks = 52;
  const activeTicks = Math.round(clamped * totalTicks);
  const startAngle = -220;
  const sweep = 260;
  const cx = 100;
  const cy = 104;
  const rOuter = 86;
  const rInner = 74;

  let ticksHtml = '';
  for (let i = 0; i < totalTicks; i++) {
    const frac = i / (totalTicks - 1);
    const angleDeg = startAngle + frac * sweep;
    const rad = (angleDeg * Math.PI) / 180;
    const isMajor = i % 13 === 0;
    const rIn = isMajor ? rInner - 3 : rInner;
    const x1 = cx + Math.cos(rad) * rIn;
    const y1 = cy + Math.sin(rad) * rIn;
    const x2 = cx + Math.cos(rad) * rOuter;
    const y2 = cy + Math.sin(rad) * rOuter;

    const isLit = i <= activeTicks && clamped > 0;
    const stroke = isLit ? activeColor : unlitTickColor;
    const width = isMajor ? 2.4 : 1.6;
    ticksHtml += `<line class="dial-tick ${isLit ? 'is-lit' : ''}" style="--tick-idx:${i}" x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="${stroke}" stroke-width="${width}" stroke-linecap="round" />`;
  }

  svgEl.innerHTML = `
    <circle cx="${cx}" cy="${cy}" r="${rInner - 10}" fill="none" stroke="${ringStrokeColor}" stroke-width="1" stroke-dasharray="3 3" />
    ${ticksHtml}
  `;
}

function renderBankSparkline(container, h1, h2, h3, total, year1Treasury = 0) {
  if (!container) return;
  const peak = Math.max(1, total, h1 + h2 + h3 + Math.max(0, year1Treasury));
  const yFor = (val) => {
    if (total <= 0 && val <= 0) return 42;
    const norm = Math.max(0, Math.min(1, val / peak));
    return Math.round(42 - norm * 32);
  };

  const pts = [
    { x: 0, y: 42, label: 'Día 0' },
    { x: 130, y: yFor(h1), label: `H1 ${fmtCompactMXN(h1)}` },
    { x: 260, y: yFor(h1 + h2), label: `H2 ${fmtCompactMXN(h1 + h2)}` },
    { x: 390, y: yFor(total), label: `H3 ${fmtCompactMXN(total)}` },
    { x: 500, y: yFor(total + Math.max(0, year1Treasury * 0.35)), label: `Año 1` },
  ];

  const dPath = `M ${pts[0].x},${pts[0].y} C 60,${pts[0].y} 75,${pts[1].y} ${pts[1].x},${pts[1].y} C 185,${pts[1].y} 205,${pts[2].y} ${pts[2].x},${pts[2].y} C 315,${pts[2].y} 335,${pts[3].y} ${pts[3].x},${pts[3].y} C 435,${pts[3].y} 468,${pts[4].y} ${pts[4].x},${pts[4].y}`;
  const areaPath = `${dPath} L 500,48 L 0,48 Z`;

  container.innerHTML = `
    <svg viewBox="0 0 500 48" preserveAspectRatio="none">
      <defs>
        <linearGradient id="bankAreaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#a2d1bf" stop-opacity="0.30" />
          <stop offset="100%" stop-color="#c8afe9" stop-opacity="0.0" />
        </linearGradient>
        <linearGradient id="bankStrokeGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stop-color="#a2d1bf" />
          <stop offset="65%" stop-color="#c8afe9" />
          <stop offset="100%" stop-color="#d2b5ef" />
        </linearGradient>
      </defs>
      <path class="spark-area-path" d="${areaPath}" fill="url(#bankAreaGrad)" />
      <path class="spark-line-path" d="${dPath}" fill="none" stroke="url(#bankStrokeGrad)" stroke-width="2.2" stroke-linecap="round" />
      <circle class="spark-dot" style="--dot-idx:1" cx="${pts[1].x}" cy="${pts[1].y}" r="3.5" fill="#a2d1bf" />
      <circle class="spark-dot" style="--dot-idx:2" cx="${pts[2].x}" cy="${pts[2].y}" r="3.5" fill="#c8afe9" />
      <circle class="spark-dot" style="--dot-idx:3" cx="${pts[3].x}" cy="${pts[3].y}" r="3.5" fill="#d2b5ef" />
      <circle class="spark-dot" style="--dot-idx:4" cx="${pts[4].x - 4}" cy="${pts[4].y}" r="3" fill="#a2d1bf" />
    </svg>
  `;
}

/* ============================================================================
   DYNAMIC ORB TELEMETRY BUILDER (Pure function, exported for testing)
   ============================================================================ */

function buildOrbItems(calc, state = DEFAULTS) {
  const hKey = state.selectedHito || 'total';
  const rawHGross = calc.hitos[hKey] ? calc.hitos[hKey].gross : calc.gross;
  const hasContract = rawHGross > 0;
  const hGross = hasContract ? rawHGross : 1;
  const isTotal = hKey === 'total';

  // Strictly monotonic visual fill mapping: larger share ALWAYS yields larger fill ratio
  const ratioFromShare = (share) => {
    if (!hasContract || share <= 0) return 0;
    return Math.min(0.92, Math.max(0.08, Math.pow(Math.min(1, share), 0.72)));
  };

  const cajaSplitTag = `${fmtShortK(calc.hitos.h1.caja)} / ${fmtShortK(calc.hitos.h2.caja)} / ${fmtShortK(calc.hitos.h3.caja)}`;

  if (state.orbGroup === 'buckets') {
    const cajaVal = calc.hitos[hKey].caja;
    const closerVal = calc.hitos[hKey].closer;
    const poolVal = calc.hitos[hKey].pool;

    return [
      {
        id: 'pool',
        name: 'POOL SOCIOS',
        role: '50% Dan · 25% Omar · 15% Ped · 10% Oct',
        tag: hasContract ? `${((poolVal / hGross) * 100).toFixed(1)}%` : '0.0%',
        amount: poolVal,
        pct: hasContract ? (poolVal / hGross) * 100 : 0,
        ratio: ratioFromShare(poolVal / hGross),
        hitosStrip: [
          { key: 'h1', label: 'H1', val: calc.hitos.h1.pool },
          { key: 'h2', label: 'H2', val: calc.hitos.h2.pool },
          { key: 'h3', label: 'H3', val: calc.hitos.h3.pool },
        ],
        sub: isTotal ? `Total a repartir: ${fmtCompactMXN(poolVal)}` : `En este hito: ${fmtCompactMXN(poolVal)}`,
        color: '#9b78cf',
        light: '#c8afe9',
        glow: 'rgba(200, 175, 233, 0.12)',
      },
      {
        id: 'caja',
        name: 'INVERSIÓN Y CAJA',
        role: 'Se cubre 100% en Hito 1',
        tag: hasContract ? `${((cajaVal / hGross) * 100).toFixed(1)}%` : '0.0%',
        amount: cajaVal,
        pct: hasContract ? (cajaVal / hGross) * 100 : 0,
        ratio: ratioFromShare(cajaVal / hGross),
        hitosStrip: [
          { key: 'h1', label: 'H1', val: calc.hitos.h1.caja },
          { key: 'h2', label: 'H2', val: calc.hitos.h2.caja },
          { key: 'h3', label: 'H3', val: calc.hitos.h3.caja },
        ],
        sub: isTotal
          ? `-${fmtCompactMXN(calc.caja.expenses)} Gastos = ${fmtCompactMXN(calc.caja.free)} Libre`
          : cajaSplitTag,
        color: '#408374',
        light: '#a2d1bf',
        glow: 'rgba(162, 209, 191, 0.12)',
      },
      {
        id: 'closer',
        name: 'CLOSER COMERCIAL',
        role: 'Comisión Cierre · Omar Moranza',
        tag: hasContract ? `${((closerVal / hGross) * 100).toFixed(1)}%` : '0.0%',
        amount: closerVal,
        pct: hasContract ? (closerVal / hGross) * 100 : 0,
        ratio: ratioFromShare(closerVal / hGross),
        hitosStrip: [
          { key: 'h1', label: 'H1', val: calc.hitos.h1.closer },
          { key: 'h2', label: 'H2', val: calc.hitos.h2.closer },
          { key: 'h3', label: 'H3', val: calc.hitos.h3.closer },
        ],
        sub: isTotal ? `Total Closer: ${fmtCompactMXN(closerVal)}` : `10% del Hito (${fmtCompactMXN(closerVal)})`,
        color: '#d9822b',
        light: '#f5a524',
        glow: 'rgba(245, 165, 36, 0.12)',
      },
    ];
  }

  const danielVal = calc.partners.daniel[hKey];
  const omarPoolVal = calc.partners.omarPool[hKey];
  const omarCloserVal = calc.hitos[hKey].closer;
  const omarNetHito = omarPoolVal + omarCloserVal;
  const pedroVal = calc.partners.pedro[hKey];
  const octavioVal = calc.partners.octavio[hKey];
  const cajaFreeVal = isTotal ? calc.caja.free : calc.hitos[hKey].caja;

  const danielPctGross = hasContract ? (danielVal / hGross) * 100 : 0;
  const omarPctGross = hasContract ? (omarNetHito / hGross) * 100 : 0;
  const pedroPctGross = hasContract ? (pedroVal / hGross) * 100 : 0;
  const octavioPctGross = hasContract ? (octavioVal / hGross) * 100 : 0;
  const cajaPctGross = hasContract ? (cajaFreeVal / hGross) * 100 : 0;

  return [
    {
      id: 'daniel',
      name: 'DANIEL',
      role: 'Líder Técnico · 50% Pool',
      tag: '50% Pool',
      amount: danielVal,
      pct: danielPctGross,
      ratio: ratioFromShare(danielVal / hGross),
      hitosStrip: [
        { key: 'h1', label: 'H1', val: calc.partners.daniel.h1 },
        { key: 'h2', label: 'H2', val: calc.partners.daniel.h2 },
        { key: 'h3', label: 'H3', val: calc.partners.daniel.h3 },
      ],
      sub: isTotal
        ? `+2 Monitores ${fmtCompactMXN(calc.caja.monitorsTotal)} = ${fmtCompactMXN(calc.consolidated.danielTotalBenefit)}`
        : hKey === 'h1'
          ? `+2 Monitores ${fmtCompactMXN(calc.caja.monitorsTotal)} en H1`
          : `50% Pool (${danielPctGross.toFixed(1)}% del Hito)`,
      color: '#9b78cf',
      light: '#c8afe9',
      glow: 'rgba(200, 175, 233, 0.12)',
    },
    {
      id: 'omar',
      name: 'OMAR',
      role: 'Socio 25% + Closer 10%',
      tag: '25%+10%',
      amount: omarNetHito,
      pct: omarPctGross,
      ratio: ratioFromShare(omarNetHito / hGross),
      hitosStrip: [
        { key: 'h1', label: 'H1', val: calc.partners.omarTotal.h1 },
        { key: 'h2', label: 'H2', val: calc.partners.omarTotal.h2 },
        { key: 'h3', label: 'H3', val: calc.partners.omarTotal.h3 },
      ],
      sub: isTotal
        ? `+Reembolso ${fmtCompactMXN(calc.caja.omarReimb)} = ${fmtCompactMXN(calc.consolidated.omarTotalCash)}`
        : hKey === 'h1'
          ? `${fmtShortK(omarPoolVal)} Pool + ${fmtShortK(omarCloserVal)} Closer (+${fmtCompactMXN(calc.caja.omarReimb)} Reemb.)`
          : `${fmtCompactMXN(omarPoolVal)} Pool + ${fmtCompactMXN(omarCloserVal)} Closer`,
      color: '#b07ce8',
      light: '#d2b5ef',
      glow: 'rgba(210, 181, 239, 0.12)',
    },
    {
      id: 'pedro',
      name: 'PEDRO',
      role: 'Legal y Planta · 15% Pool',
      tag: '15% Pool',
      amount: pedroVal,
      pct: pedroPctGross,
      ratio: ratioFromShare(pedroVal / hGross),
      hitosStrip: [
        { key: 'h1', label: 'H1', val: calc.partners.pedro.h1 },
        { key: 'h2', label: 'H2', val: calc.partners.pedro.h2 },
        { key: 'h3', label: 'H3', val: calc.partners.pedro.h3 },
      ],
      sub: isTotal
        ? `+Viáticos ${fmtCompactMXN(calc.caja.viaticos)} = ${fmtCompactMXN(calc.consolidated.pedroTotalCash)}`
        : hKey === 'h1'
          ? `+Viáticos ${fmtCompactMXN(calc.caja.viaticos)} en H1`
          : `15% Pool (${pedroPctGross.toFixed(1)}% del Hito)`,
      color: '#3b9b88',
      light: '#a2d1bf',
      glow: 'rgba(162, 209, 191, 0.12)',
    },
    {
      id: 'octavio',
      name: 'OCTAVIO',
      role: 'Implementación · 10% Pool',
      tag: '10% Pool',
      amount: octavioVal,
      pct: octavioPctGross,
      ratio: ratioFromShare(octavioVal / hGross),
      hitosStrip: [
        { key: 'h1', label: 'H1', val: calc.partners.octavio.h1 },
        { key: 'h2', label: 'H2', val: calc.partners.octavio.h2 },
        { key: 'h3', label: 'H3', val: calc.partners.octavio.h3 },
      ],
      sub: isTotal
        ? `100% Efectivo = ${fmtCompactMXN(calc.partners.octavio.total)}`
        : `10% Pool (${octavioPctGross.toFixed(1)}% del Hito)`,
      color: '#6b63d6',
      light: '#8f7cff',
      glow: 'rgba(143, 124, 255, 0.12)',
    },
    {
      id: 'cajalibre',
      name: 'CAJA LIBRE',
      role: 'Inversión H1 + Tesorería',
      tag: isTotal ? `${calc.caja.marginPct.toFixed(1)}% Libre` : '20% Caja',
      amount: cajaFreeVal,
      pct: cajaPctGross,
      ratio: ratioFromShare(Math.max(0, cajaFreeVal) / hGross),
      hitosStrip: [
        { key: 'h1', label: 'H1', val: calc.hitos.h1.caja },
        { key: 'h2', label: 'H2', val: calc.hitos.h2.caja },
        { key: 'h3', label: 'H3', val: calc.hitos.h3.caja },
      ],
      sub: isTotal
        ? `De ${fmtCompactMXN(calc.caja.gross)} H1 (-${fmtCompactMXN(calc.caja.expenses)} Gastos)`
        : hKey === 'h1'
          ? `-${fmtCompactMXN(calc.caja.expenses)} Gastos = ${fmtCompactMXN(calc.caja.free)} Libre`
          : 'Cubierta 100% en Hito 1',
      color: calc.caja.free < 0 && isTotal ? '#cd6e7c' : '#408374',
      light: calc.caja.free < 0 && isTotal ? '#efb4bd' : '#a2d1bf',
      glow: 'rgba(162, 209, 191, 0.12)',
    },
  ];
}

/**
 * Pure choreography builder for the One-Button Guided Presentation & Grid flow.
 * Returns the animated spotlight sequence and narratives for each slide (0..6) and Grid Overview.
 */
function buildSlideChoreography(slideIdx, calc, isOverview = false, state = DEFAULTS) {
  if (isOverview) {
    return [
      {
        substepLabel: '1/4 · PRIMEROS $60K',
        selector: '.deck-slide[data-slide="0"], .deck-slide[data-slide="1"]',
        narrative: `H1 ${fmtCompactMXN(calc.hitos.h1.gross)}: ${fmtCompactMXN(calc.hitos.h1.caja)} Inversión/Caja + ${fmtCompactMXN(calc.hitos.h1.sociosTotal)} Socios`,
        delayMs: 40,
      },
      {
        substepLabel: '2/4 · REPARTO SOCIOS',
        selector: '.deck-slide[data-slide="2"], .deck-slide[data-slide="3"]',
        narrative: `Daniel ${fmtCompactMXN(calc.consolidated.danielTotalBenefit)} · Omar ${fmtCompactMXN(calc.consolidated.omarTotalCash)} · Pedro ${fmtCompactMXN(calc.consolidated.pedroTotalCash)} · Octavio ${fmtCompactMXN(calc.partners.octavio.total)}`,
        orbIndex: 0,
        delayMs: 1350,
      },
      {
        substepLabel: '3/4 · LIQUIDACIÓN 100%',
        selector: '.deck-slide[data-slide="4"], .deck-slide[data-slide="5"]',
        narrative: `H2 ${fmtCompactMXN(calc.hitos.h2.gross)} + H3 ${fmtCompactMXN(calc.hitos.h3.gross)} van 100% a Socios hasta liquidar ${fmtCompactMXN(calc.gross)}`,
        delayMs: 2700,
      },
      {
        substepLabel: '4/4 · AÑO 1 LIBRE',
        selector: '.deck-slide[data-slide="6"], .vd-card, .orbit-card',
        narrative: `Caja Libre ${fmtCompactMXN(calc.caja.free)} + Iguala ${fmtCompactMXN(calc.iguala.freeAnnual)} = ${fmtCompactMXN(calc.year1FreeTreasury)} Año 1`,
        delayMs: 4050,
      },
    ];
  }

  switch (slideIdx) {
    case 0:
      return [
        {
          substepLabel: '1/3 · POOL 70%',
          selector: '.bucket-card.is-pool, #segPoolBar',
          narrative: `Pool Socios 70% (${fmtCompactMXN(calc.hitos.total.pool)}): Daniel 50% · Omar 25% · Pedro 15% · Octavio 10%`,
          delayMs: 40,
        },
        {
          substepLabel: '2/3 · INVERSIÓN 20%',
          selector: '.bucket-card.is-caja, #segCajaBar',
          narrative: `Inversión y Caja 20% (${fmtCompactMXN(calc.caja.gross)}): se cubre 100% en H1 → quedan ${fmtCompactMXN(calc.caja.free)} Libres`,
          delayMs: 1350,
        },
        {
          substepLabel: '3/3 · CLOSER 10%',
          selector: '.bucket-card.is-closer, #segCloserBar, #bankSparkArt',
          narrative: `Closer 10% (${fmtCompactMXN(calc.hitos.total.closer)} Omar): ${fmtCompactMXN(calc.hitos.h1.closer)} en H1 · ${fmtCompactMXN(calc.hitos.h2.closer)} en H2 · ${fmtCompactMXN(calc.hitos.h3.closer)} en H3`,
          delayMs: 2700,
        },
      ];
    case 1:
      return [
        {
          substepLabel: '1/3 · 1os $30K INVERSIÓN',
          selector: '.h1-half-card.is-caja, [data-bar-hito="h1"], [data-card-hito="h1"]',
          narrative: `Primeros ${fmtCompactMXN(calc.hitos.h1.caja)} de H1: Omar ${fmtCompactMXN(calc.caja.omarReimb)} + Monitores ${fmtCompactMXN(calc.caja.monitorsTotal)} + Pedro ${fmtCompactMXN(calc.caja.viaticos)} + Caja Libre ${fmtCompactMXN(calc.caja.free)}`,
          delayMs: 40,
        },
        {
          substepLabel: '2/3 · 2os $30K SOCIOS',
          selector: '.h1-half-card.is-socios, [data-bar-hito="h1"], [data-card-hito="h1"]',
          narrative: `Siguientes ${fmtCompactMXN(calc.hitos.h1.sociosTotal)} de H1 por %: Daniel ${fmtCompactMXN(calc.partners.daniel.h1)} · Omar ${fmtCompactMXN(calc.partners.omarTotal.h1)} · Pedro ${fmtCompactMXN(calc.partners.pedro.h1)} · Octavio ${fmtCompactMXN(calc.partners.octavio.h1)}`,
          delayMs: 1350,
        },
        {
          substepLabel: '3/3 · H2 Y H3 LIQUIDACIÓN',
          selector: '[data-bar-hito="h2"], [data-card-hito="h2"], [data-bar-hito="h3"], [data-card-hito="h3"], [data-bar-hito="total"]',
          narrative: `H2 (${fmtCompactMXN(calc.hitos.h2.gross)}) y H3 (${fmtCompactMXN(calc.hitos.h3.gross)}) van 100% a Socios hasta liquidar ${fmtCompactMXN(calc.gross)}`,
          delayMs: 2700,
        },
      ];
    case 2:
      if (state && state.orbGroup === 'buckets') {
        return [
          {
            substepLabel: '1/3 · POOL 70%',
            selector: '#orbGrid .au-cell:nth-child(1)',
            narrative: `Pool 70% (${fmtCompactMXN(calc.hitos.total.pool)}): H1 ${fmtCompactMXN(calc.hitos.h1.pool)} · H2 ${fmtCompactMXN(calc.hitos.h2.pool)} · H3 ${fmtCompactMXN(calc.hitos.h3.pool)}`,
            orbIndex: 0,
            delayMs: 40,
          },
          {
            substepLabel: '2/3 · INVERSIÓN 20%',
            selector: '#orbGrid .au-cell:nth-child(2)',
            narrative: `Inversión y Caja 20% (${fmtCompactMXN(calc.caja.gross)} en H1) → ${fmtCompactMXN(calc.caja.free)} Libres`,
            orbIndex: 1,
            delayMs: 1350,
          },
          {
            substepLabel: '3/3 · CLOSER 10%',
            selector: '#orbGrid .au-cell:nth-child(3)',
            narrative: `Closer 10% (${fmtCompactMXN(calc.hitos.total.closer)}): H1 ${fmtCompactMXN(calc.hitos.h1.closer)} · H2 ${fmtCompactMXN(calc.hitos.h2.closer)} · H3 ${fmtCompactMXN(calc.hitos.h3.closer)}`,
            orbIndex: 2,
            delayMs: 2700,
          },
        ];
      }
      return [
        {
          substepLabel: '1/4 · DANIEL 50%',
          selector: '#orbGrid .au-cell:nth-child(1)',
          narrative: `Daniel 50%: H1 ${fmtCompactMXN(calc.partners.daniel.h1)} + H2 ${fmtCompactMXN(calc.partners.daniel.h2)} + H3 ${fmtCompactMXN(calc.partners.daniel.h3)} = ${fmtCompactMXN(calc.partners.daniel.total)} (+${fmtCompactMXN(calc.caja.monitorsTotal)} Monitores = ${fmtCompactMXN(calc.consolidated.danielTotalBenefit)})`,
          orbIndex: 0,
          delayMs: 40,
        },
        {
          substepLabel: '2/4 · OMAR 25%+10%',
          selector: '#orbGrid .au-cell:nth-child(2)',
          narrative: `Omar: H1 ${fmtCompactMXN(calc.partners.omarTotal.h1)} + H2 ${fmtCompactMXN(calc.partners.omarTotal.h2)} + H3 ${fmtCompactMXN(calc.partners.omarTotal.h3)} = ${fmtCompactMXN(calc.consolidated.omarNetProfit)} (+${fmtCompactMXN(calc.caja.omarReimb)} Reembolso = ${fmtCompactMXN(calc.consolidated.omarTotalCash)})`,
          orbIndex: 1,
          delayMs: 1150,
        },
        {
          substepLabel: '3/4 · PEDRO 15%',
          selector: '#orbGrid .au-cell:nth-child(3)',
          narrative: `Pedro 15%: H1 ${fmtCompactMXN(calc.partners.pedro.h1)} + H2 ${fmtCompactMXN(calc.partners.pedro.h2)} + H3 ${fmtCompactMXN(calc.partners.pedro.h3)} = ${fmtCompactMXN(calc.partners.pedro.total)} (+${fmtCompactMXN(calc.caja.viaticos)} Viáticos = ${fmtCompactMXN(calc.consolidated.pedroTotalCash)})`,
          orbIndex: 2,
          delayMs: 2250,
        },
        {
          substepLabel: '4/4 · OCTAVIO 10%',
          selector: '#orbGrid .au-cell:nth-child(4), #orbGrid .au-cell:nth-child(5)',
          narrative: `Octavio 10%: H1 ${fmtCompactMXN(calc.partners.octavio.h1)} + H2 ${fmtCompactMXN(calc.partners.octavio.h2)} + H3 ${fmtCompactMXN(calc.partners.octavio.h3)} = ${fmtCompactMXN(calc.partners.octavio.total)} · Caja Libre ${fmtCompactMXN(calc.caja.free)}`,
          orbIndex: 3,
          delayMs: 3350,
        },
      ];
    case 3:
      return [
        {
          substepLabel: '1/3 · OMAR IA',
          selector: '.deck-slide[data-slide="3"] .ctrl-row:nth-child(1)',
          narrative: `De los primeros ${fmtCompactMXN(calc.caja.gross)} (H1): -${fmtCompactMXN(calc.caja.omarReimb)} reembolso IA a Omar`,
          delayMs: 40,
        },
        {
          substepLabel: '2/3 · 2 MONITORES',
          selector: '.deck-slide[data-slide="3"] .ctrl-row:nth-child(2), .deck-slide[data-slide="3"] .ctrl-row:nth-child(3)',
          narrative: `De los primeros ${fmtCompactMXN(calc.caja.gross)} (H1): -${fmtCompactMXN(calc.caja.monitorsTotal)} para 2 monitores de Daniel`,
          delayMs: 1350,
        },
        {
          substepLabel: '3/3 · CAJA LIBRE',
          selector: '.deck-slide[data-slide="3"] .ctrl-slider-row, .deck-slide[data-slide="3"] .dial-wrap',
          narrative: `Viáticos Pedro -${fmtCompactMXN(calc.caja.viaticos)} → Quedan ${fmtCompactMXN(calc.caja.free)} Libres en Caja (${calc.caja.marginPct.toFixed(1)}%)`,
          delayMs: 2700,
        },
      ];
    case 4:
      return [
        {
          substepLabel: '1/3 · IGUALA',
          selector: '.deck-slide[data-slide="4"] .ctrl-row:nth-child(1)',
          narrative: `Al liquidar Hito 3 inicia Iguala de ${fmtCompactMXN(calc.iguala.gross)}/mes`,
          delayMs: 40,
        },
        {
          substepLabel: '2/3 · STACK IA',
          selector: '.deck-slide[data-slide="4"] .ctrl-row:nth-child(2), .deck-slide[data-slide="4"] .ctrl-row:nth-child(3), .deck-slide[data-slide="4"] .ctrl-row:nth-child(4)',
          narrative: `Stack IA (Azure + Claude + Gemini): -${fmtCompactMXN(calc.iguala.costTotal)}/mes`,
          delayMs: 1350,
        },
        {
          substepLabel: '3/3 · LIBRE',
          selector: '.deck-slide[data-slide="4"] .dial-wrap, #igualaAnnualPill',
          narrative: `Quedan ${fmtCompactMXN(calc.iguala.freeMonthly)}/mes Libres → ${fmtCompactMXN(calc.iguala.freeAnnual)}/año`,
          delayMs: 2700,
        },
      ];
    case 5:
      return [
        {
          substepLabel: '1/3 · CAJA & CLOSER',
          selector: '#speiTableBody tr:nth-child(1), #speiTableBody tr:nth-child(2)',
          narrative: `H1 cubre 100% de Inversión/Caja (${fmtCompactMXN(calc.caja.gross)}) y Closer cobra 10% por hito (${fmtCompactMXN(calc.hitos.total.closer)})`,
          delayMs: 40,
        },
        {
          substepLabel: '2/3 · SOCIOS POOL',
          selector: '#speiTableBody tr:nth-child(3), #speiTableBody tr:nth-child(4), #speiTableBody tr:nth-child(5), #speiTableBody tr:nth-child(6)',
          narrative: `Pool (${fmtCompactMXN(calc.hitos.total.pool)}): H1 ${fmtCompactMXN(calc.hitos.h1.pool)} + H2 ${fmtCompactMXN(calc.hitos.h2.pool)} + H3 ${fmtCompactMXN(calc.hitos.h3.pool)} liquidan a Daniel, Omar, Pedro y Octavio`,
          delayMs: 1350,
        },
        {
          substepLabel: '3/3 · 100% LIQUIDADO',
          selector: '#speiTableFoot tr',
          narrative: `H1 ${fmtCompactMXN(calc.hitos.h1.gross)} + H2 ${fmtCompactMXN(calc.hitos.h2.gross)} + H3 ${fmtCompactMXN(calc.hitos.h3.gross)} = ${fmtCompactMXN(calc.gross)} (100% Liquidado)`,
          delayMs: 2700,
        },
      ];
    case 6:
    default:
      return [
        {
          substepLabel: '1/3 · PRIMEROS $60K',
          selector: '#nextStepsGrid .step-card:nth-child(1), #nextStepsGrid .step-card:nth-child(2)',
          narrative: `Hito 1 (${fmtCompactMXN(calc.hitos.h1.gross)}): ${fmtCompactMXN(calc.hitos.h1.caja)} Inversión/Caja + ${fmtCompactMXN(calc.hitos.h1.sociosTotal)} 1er Pago a Socios`,
          delayMs: 40,
        },
        {
          substepLabel: '2/3 · LIQUIDACIÓN H2 Y H3',
          selector: '#nextStepsGrid .step-card:nth-child(3), #nextStepsGrid .step-card:nth-child(4)',
          narrative: `H2 (${fmtCompactMXN(calc.hitos.h2.gross)}) y H3 (${fmtCompactMXN(calc.hitos.h3.gross)}) liquidan a Socios + Iguala ${fmtCompactMXN(calc.iguala.gross)}/mes`,
          delayMs: 1350,
        },
        {
          substepLabel: '3/3 · TOTAL POR SOCIO',
          selector: '.exec-kpi-strip',
          narrative: `Daniel ${fmtCompactMXN(calc.consolidated.danielTotalBenefit)} · Omar ${fmtCompactMXN(calc.consolidated.omarTotalCash)} · Pedro ${fmtCompactMXN(calc.consolidated.pedroTotalCash)} · Octavio ${fmtCompactMXN(calc.partners.octavio.total)} · Año 1 ${fmtCompactMXN(calc.year1FreeTreasury)}`,
          delayMs: 2700,
        },
      ];
  }
}

/* ============================================================================
   BROWSER PRESENTATION & CALCULATOR CONTROLLER
   ============================================================================ */

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  const appState = { ...DEFAULTS };
  let latestCalc = calculateFinancials(appState);
  let orbCells = [];
  let masterRafId = 0;
  let lastFrameMs = performance.now();
  let voiceOrbEngine = null;
  let moodRevertTimer = 0;
  let manualMoodOverride = false;
  let speakerStartTime = Date.now();
  let speakerTimerId = 0;
  let choreoTimers = [];
  let autoPlayTimerId = 0;

  function setText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  }

  function isReducedMotion() {
    return (
      typeof window.matchMedia === 'function' &&
      Boolean(window.matchMedia('(prefers-reduced-motion: reduce)').matches)
    );
  }

  function hasTreasuryDeficit() {
    return latestCalc.caja.free < 0 || latestCalc.iguala.freeMonthly < 0;
  }

  function getEffectiveOrbMood() {
    if (hasTreasuryDeficit() && !manualMoodOverride) {
      return 'error';
    }
    return appState.orbMood || 'idle';
  }

  function pulseOrbMood(tempMood = 'working', durationMs = 1400) {
    if (moodRevertTimer) clearTimeout(moodRevertTimer);
    manualMoodOverride = false;
    appState.orbMood = tempMood;
    syncControlButtons();
    moodRevertTimer = window.setTimeout(() => {
      appState.orbMood = 'idle';
      syncControlButtons();
    }, durationMs);
  }

  function updateSpeakerTimerDisplay() {
    const elapsedSec = Math.max(0, Math.floor((Date.now() - speakerStartTime) / 1000));
    const mins = String(Math.floor(elapsedSec / 60)).padStart(2, '0');
    const secs = String(elapsedSec % 60).padStart(2, '0');
    setText('speakerTimer', `${mins}:${secs}`);
  }

  function syncSpeakerTimerLoop() {
    if (appState.showNotes) {
      updateSpeakerTimerDisplay();
      if (!speakerTimerId) {
        speakerTimerId = window.setInterval(updateSpeakerTimerDisplay, 1000);
      }
    } else if (speakerTimerId) {
      clearInterval(speakerTimerId);
      speakerTimerId = 0;
    }
  }

  /**
   * Master 60fps render(t) loop driving:
   * 1. WebGL 3D VoiceOrbCanvas + Nebula Backdrop
   * 2. Canvas 2D Liquid Surge Spheres (22 bubbles + double wave + lighter caustics + 320 px/s² splashes)
   */
  function masterRenderLoop(nowMs) {
    const dt = Math.min(0.05, Math.max(0.001, (nowMs - lastFrameMs) / 1000));
    lastFrameMs = nowMs;
    const tSec = nowMs / 1000;

    const reducedMotion = isReducedMotion();

    if (voiceOrbEngine) {
      voiceOrbEngine.renderFrame(reducedMotion ? 0 : tSec);
    }

    for (const cell of orbCells) {
      if (reducedMotion) {
        cell.currentRatio = cell.toRatio;
        cell.springVel = 0;
        cell.surgeEnergy = 0;
        cell.splashes = [];
      } else {
        stepSpringVel(cell, dt);
      }

      if (appState.renderMode === 'bar') {
        drawLiquidBar(cell.ctx, 136, cell, reducedMotion ? 0 : tSec);
      } else {
        drawLiquidOrb(cell.ctx, 136, cell, reducedMotion ? 0 : tSec);
      }
    }

    if (!reducedMotion) {
      masterRafId = requestAnimationFrame(masterRenderLoop);
    } else {
      masterRafId = 0;
    }
  }

  function ensureMasterLoopRunning() {
    if (!masterRafId) {
      lastFrameMs = performance.now();
      masterRafId = requestAnimationFrame(masterRenderLoop);
    }
  }

  function syncOrbGridDOM(items, forceReset = false) {
    const grid = document.getElementById('orbGrid');
    if (!grid) return;

    const existingIds = orbCells.map((c) => c.id).join(',');
    const nextIds = items.map((i) => i.id).join(',');
    const reducedMotion = isReducedMotion();

    if (existingIds !== nextIds) {
      grid.innerHTML = '';
      orbCells = items.map((item, idx) => {
        const cell = document.createElement('div');
        cell.className = 'au-cell';
        cell.innerHTML = `
          <div class="design-render-rim" aria-hidden="true"></div>
          <div class="au-cell-top">
            <span class="au-cell-name">${item.name}</span>
            <span class="au-cell-tag" data-role="tag">${item.tag}</span>
          </div>
          <div class="au-cell-role" data-role="role">${item.role || ''}</div>
          <div class="au-canvas-wrap">
            <canvas class="au-canvas" width="272" height="272"></canvas>
          </div>
          <div class="au-metric" data-role="metric"></div>
          <div class="au-hito-strip" data-role="hito-strip"></div>
          <div class="au-sub" data-role="sub"></div>
        `;
        const canvas = cell.querySelector('canvas');
        const ctx = canvas.getContext('2d');
        ctx.scale(2, 2); // 136x136 logical

        const stateObj = {
          id: item.id,
          el: cell,
          canvas,
          ctx,
          fromRatio: 0.08,
          toRatio: item.ratio,
          currentRatio: reducedMotion ? item.ratio : 0.12,
          springVel: 0,
          surgeEnergy: reducedMotion ? 0 : 1.0,
          phaseOffset: idx * 1.1,
          splashes: [],
          item,
        };

        if (!reducedMotion) {
          spawnSplashDroplets(stateObj, 136, item.ratio, 7);
        }

        cell.addEventListener('click', () => {
          if (!isReducedMotion()) {
            stateObj.surgeEnergy = 1.25;
            stateObj.springVel = 0.85;
            spawnSplashDroplets(stateObj, 136, stateObj.currentRatio, 9);
          } else {
            stateObj.splashes = [];
          }
          if (!appState.isOverview && appState.currentSlide === 2) {
            clearChoreographyTimers();
            const subIdx = appState.orbGroup === 'buckets' ? Math.min(2, idx) : Math.min(3, idx);
            activateSubstep(subIdx, { scrollIntoView: false, skipOrbSurge: true });
          }
          ensureMasterLoopRunning();
        });

        grid.appendChild(cell);
        return stateObj;
      });
    }

    items.forEach((item, idx) => {
      const c = orbCells[idx];
      if (!c) return;
      if (forceReset || Math.abs(c.toRatio - item.ratio) > 0.002) {
        if (forceReset && !reducedMotion) {
          c.currentRatio = Math.max(0.06, item.ratio * 0.35);
        }
        c.toRatio = item.ratio;
        if (!reducedMotion) {
          c.surgeEnergy = Math.min(1.4, (c.surgeEnergy || 0) + 0.85);
          spawnSplashDroplets(c, 136, item.ratio, 6);
        } else {
          c.currentRatio = item.ratio;
          c.surgeEnergy = 0;
          c.splashes = [];
        }
      }
      c.item = item;
      c.el.querySelector('.au-cell-name').textContent = item.name;
      c.el.querySelector('[data-role="tag"]').textContent = item.tag;
      const roleEl = c.el.querySelector('[data-role="role"]');
      if (roleEl) roleEl.textContent = item.role || '';
      c.el.querySelector('[data-role="metric"]').textContent =
        appState.unitMode === 'pct'
          ? `${item.pct.toFixed(1)}%`
          : fmtCompactMXN(item.amount);
      const stripEl = c.el.querySelector('[data-role="hito-strip"]');
      if (stripEl && Array.isArray(item.hitosStrip)) {
        stripEl.innerHTML = item.hitosStrip
          .map((hs) => {
            const isActiveHito = appState.selectedHito === hs.key;
            return `<span class="au-hito-chip ${isActiveHito ? 'is-active' : ''}"><em>${hs.label}</em><b>${fmtShortK(hs.val)}</b></span>`;
          })
          .join('');
      }
      c.el.querySelector('[data-role="sub"]').textContent = item.sub;
    });

    ensureMasterLoopRunning();
  }

  function renderCajaBreakdownBar(calc) {
    const wrap = document.getElementById('cajaBreakdownBarWrap');
    if (!wrap) return;
    const gross = Math.max(1, calc.caja.gross);
    const omarPct = Math.max(0, Math.min(100, (calc.caja.omarReimb / gross) * 100));
    const monPct = Math.max(0, Math.min(100, (calc.caja.monitorsTotal / gross) * 100));
    const viatPct = Math.max(0, Math.min(100, (calc.caja.viaticos / gross) * 100));
    const freePct = Math.max(0, Math.min(100, (Math.max(0, calc.caja.free) / gross) * 100));

    wrap.innerHTML = `
      <div class="caja-split-bar" aria-label="Desglose de primeros $30,000 en Hito 1">
        <div class="caja-seg seg-reimb is-omar" style="width:${omarPct.toFixed(1)}%" title="Reembolso Omar: ${fmtMXN(calc.caja.omarReimb)}">${omarPct >= 14 ? `${Math.round(omarPct)}%` : ''}</div>
        <div class="caja-seg seg-mon is-mon" style="width:${monPct.toFixed(1)}%" title="2 Monitores Daniel: ${fmtMXN(calc.caja.monitorsTotal)}">${monPct >= 11 ? `${Math.round(monPct)}%` : ''}</div>
        <div class="caja-seg seg-viat is-viat" style="width:${viatPct.toFixed(1)}%" title="Viáticos Pedro: ${fmtMXN(calc.caja.viaticos)}"></div>
        <div class="caja-seg seg-libre is-free" style="width:${freePct.toFixed(1)}%" title="Caja Libre: ${fmtMXN(calc.caja.free)}">${freePct >= 14 ? `${Math.round(freePct)}% Libre` : ''}</div>
      </div>
      <div class="caja-split-chips">
        <span class="caja-chip" data-caja-sub="0"><span class="caja-dot dot-reimb"></span>Omar IA <b>${fmtCompactMXN(calc.caja.omarReimb)}</b></span>
        <span class="caja-chip" data-caja-sub="1"><span class="caja-dot dot-mon"></span>2 Monitores <b>${fmtCompactMXN(calc.caja.monitorsTotal)}</b></span>
        <span class="caja-chip" data-caja-sub="2"><span class="caja-dot dot-viat"></span>Viáticos Pedro <b>${fmtCompactMXN(calc.caja.viaticos)}</b></span>
        <span class="caja-chip is-free-chip" data-caja-sub="2"><span class="caja-dot dot-libre"></span>Caja Libre <b>${fmtCompactMXN(calc.caja.free)}</b></span>
      </div>
    `;

    wrap.querySelectorAll('[data-caja-sub]').forEach((chipEl) => {
      chipEl.addEventListener('click', () => {
        if (appState.isOverview || appState.currentSlide !== 3) return;
        clearChoreographyTimers();
        const subIdx = parseInt(chipEl.getAttribute('data-caja-sub'), 10) || 0;
        activateSubstep(subIdx, { scrollIntoView: false });
      });
    });
  }

  function renderMilestoneBars(calc) {
    const container = document.getElementById('milestoneBarChart');
    if (!container) return;

    const isPct = appState.unitMode === 'pct';
    const hasContract = calc.gross > 0;

    // 1. Visual 50/50 Showcase for Hito 1 ($60,000 = $30,000 Inversión/Caja + $30,000 Socios)
    const h1Showcase = document.getElementById('h1SplitShowcase');
    if (h1Showcase) {
      const h1G = Math.max(1, calc.hitos.h1.gross);
      const cajaSharePct = hasContract ? Math.round((calc.hitos.h1.caja / h1G) * 100) : 50;
      const sociosSharePct = hasContract ? Math.max(0, 100 - cajaSharePct) : 50;

      h1Showcase.innerHTML = `
        <div class="h1-split-top-bar">
          <div class="h1-bar-half is-caja" style="width:${cajaSharePct}%">
            <span>1os ${fmtCompactMXN(calc.hitos.h1.caja)} · Inversión y Caja (${cajaSharePct}%)</span>
          </div>
          <div class="h1-bar-half is-socios" style="width:${sociosSharePct}%">
            <span>Siguientes ${fmtCompactMXN(calc.hitos.h1.sociosTotal)} · Socios por % (${sociosSharePct}%)</span>
          </div>
        </div>
        <div class="h1-split-cards">
          <div class="h1-half-card is-caja" data-h1-half="0">
            <div class="h1-half-head">
              <span class="h1-half-badge badge-caja mint">1os ${fmtCompactMXN(calc.hitos.h1.caja)} · INVERSIÓN Y CAJA</span>
              <strong>100% Cubierta en H1</strong>
            </div>
            <div class="h1-chip-grid">
              <div class="h1-item-chip"><span>Reembolso IA Omar</span><b>${fmtCompactMXN(calc.caja.omarReimb)}</b></div>
              <div class="h1-item-chip"><span>2 Monitores Daniel</span><b>${fmtCompactMXN(calc.caja.monitorsTotal)}</b></div>
              <div class="h1-item-chip"><span>Viáticos Pedro</span><b>${fmtCompactMXN(calc.caja.viaticos)}</b></div>
              <div class="h1-item-chip is-mint is-accent"><span>Caja Libre MASTERIZE</span><b>${fmtCompactMXN(calc.caja.free)}</b></div>
            </div>
          </div>
          <div class="h1-half-card is-socios" data-h1-half="1">
            <div class="h1-half-head">
              <span class="h1-half-badge badge-socios">Siguientes ${fmtCompactMXN(calc.hitos.h1.sociosTotal)} · REPARTO SOCIOS</span>
              <strong>Por % en Hito 1</strong>
            </div>
            <div class="h1-chip-grid">
              <div class="h1-item-chip is-lavender"><span>Daniel (50% Pool)</span><b>${fmtCompactMXN(calc.partners.daniel.h1)}</b></div>
              <div class="h1-item-chip is-lavender"><span>Omar (25% + Closer)</span><b>${fmtCompactMXN(calc.partners.omarTotal.h1)}</b></div>
              <div class="h1-item-chip"><span>Pedro (15% Pool)</span><b>${fmtCompactMXN(calc.partners.pedro.h1)}</b></div>
              <div class="h1-item-chip"><span>Octavio (10% Pool)</span><b>${fmtCompactMXN(calc.partners.octavio.h1)}</b></div>
            </div>
          </div>
        </div>
      `;

      h1Showcase.querySelectorAll('.h1-half-card').forEach((card, hIdx) => {
        card.addEventListener('click', () => {
          if (appState.isOverview || appState.currentSlide !== 1) return;
          clearChoreographyTimers();
          appState.selectedHito = 'h1';
          appState.activeSubstepIndex = hIdx === 0 ? 0 : 1;
          appState.hasActiveSpotlight = true;
          updateUI();
        });
      });
    }

    const cols = [
      { key: 'h1', label: 'H1 · 40%', pctLabel: hasContract ? '40.0%' : '0.0%', data: calc.hitos.h1 },
      { key: 'h2', label: 'H2 · 30%', pctLabel: hasContract ? '30.0%' : '0.0%', data: calc.hitos.h2 },
      { key: 'h3', label: 'H3 · 30%', pctLabel: hasContract ? '30.0%' : '0.0%', data: calc.hitos.h3 },
      { key: 'total', label: '100% Total', pctLabel: hasContract ? '100.0%' : '0.0%', data: calc.hitos.total },
    ];
    const maxGross = Math.max(1, calc.gross);
    const maxBarPx = 84;

    container.innerHTML = cols
      .map((c, idx) => {
        const hasVal = c.data.gross > 0;
        const totalRatio = hasVal ? Math.max(0.18, c.data.gross / maxGross) : 0;
        const hPx = Math.round(totalRatio * maxBarPx);
        const g = Math.max(1, c.data.gross);
        const pH = hasVal && c.data.pool > 0 ? Math.max(4, Math.round((c.data.pool / g) * hPx)) : 0;
        const cH = hasVal && c.data.caja > 0 ? Math.max(4, Math.round((c.data.caja / g) * hPx)) : 0;
        const clH = hasVal && c.data.closer > 0 ? Math.max(4, Math.round((c.data.closer / g) * hPx)) : 0;
        const isSel = appState.selectedHito === c.key;
        const valText = isPct ? c.pctLabel : fmtCompactMXN(c.data.gross);

        return `
          <div class="biz-bar-col ${isSel ? 'is-selected' : ''}" data-bar-hito="${c.key}" style="--bar-idx:${idx}">
            <div class="biz-bar-val">${valText}</div>
            <div class="biz-bar-well">
              <div class="biz-bar-seg" style="height:${clH}px;background:#f5a524" title="Closer: ${fmtMXN(c.data.closer)}"></div>
              ${cH > 0 ? `<div class="biz-bar-seg" style="height:${cH}px;background:#a2d1bf" title="Inversión / Caja: ${fmtMXN(c.data.caja)}"></div>` : ''}
              <div class="biz-bar-seg" style="height:${pH}px;background:#c8afe9" title="Pool Socios: ${fmtMXN(c.data.pool)}"></div>
            </div>
            <div class="biz-bar-label">${c.label}</div>
          </div>
        `;
      })
      .join('');

    container.querySelectorAll('[data-bar-hito]').forEach((el) => {
      el.addEventListener('click', () => {
        setHitoFilter(el.getAttribute('data-bar-hito'));
      });
    });

    const cardsEl = document.getElementById('hitoSummaryCards');
    if (cardsEl) {
      const hitosList = [
        {
          key: 'h1',
          title: 'H1 · 40%',
          tag: 'Inversión + 1er Pago',
          pctHead: hasContract ? '40.0%' : '0.0%',
          d: calc.hitos.h1,
          pDan: calc.partners.daniel.h1,
          pOmar: calc.partners.omarTotal.h1,
          pPed: calc.partners.pedro.h1,
          pOct: calc.partners.octavio.h1,
        },
        {
          key: 'h2',
          title: 'H2 · 30%',
          tag: '100% a Socios',
          pctHead: hasContract ? '30.0%' : '0.0%',
          d: calc.hitos.h2,
          pDan: calc.partners.daniel.h2,
          pOmar: calc.partners.omarTotal.h2,
          pPed: calc.partners.pedro.h2,
          pOct: calc.partners.octavio.h2,
        },
        {
          key: 'h3',
          title: 'H3 · 30%',
          tag: 'Liquidación 100%',
          pctHead: hasContract ? '30.0%' : '0.0%',
          d: calc.hitos.h3,
          pDan: calc.partners.daniel.h3,
          pOmar: calc.partners.omarTotal.h3,
          pPed: calc.partners.pedro.h3,
          pOct: calc.partners.octavio.h3,
        },
      ];
      cardsEl.innerHTML = hitosList
        .map((h) => {
          const hg = h.d.gross > 0 ? h.d.gross : 0;
          const headStr = isPct ? h.pctHead : fmtCompactMXN(h.d.gross);
          const cajaStr = isPct
            ? `${hg > 0 ? ((h.d.caja / hg) * 100).toFixed(0) : '0'}%`
            : fmtCompactMXN(h.d.caja);
          const sociosStr = isPct
            ? `${hg > 0 ? ((h.d.sociosTotal / hg) * 100).toFixed(0) : '0'}%`
            : fmtCompactMXN(h.d.sociosTotal);
          const isSel = appState.selectedHito === h.key;
          return `
            <div class="hito-mini-card ${isSel ? 'is-selected' : ''}" data-card-hito="${h.key}">
              <div class="hito-mini-head">
                <span>${h.title} · <em>${h.tag}</em></span>
                <strong>${headStr}</strong>
              </div>
              <div class="hito-mini-split">
                <span>Caja: <b>${cajaStr}</b></span>
                <span>Socios: <b>${sociosStr}</b></span>
              </div>
              <div class="hito-partner-row">
                <span>Dan ${fmtShortK(h.pDan)}</span>
                <span>Omar ${fmtShortK(h.pOmar)}</span>
                <span>Ped ${fmtShortK(h.pPed)}</span>
                <span>Oct ${fmtShortK(h.pOct)}</span>
              </div>
            </div>
          `;
        })
        .join('');

      cardsEl.querySelectorAll('[data-card-hito]').forEach((el) => {
        el.addEventListener('click', () => {
          setHitoFilter(el.getAttribute('data-card-hito'));
        });
      });
    }
  }

  function renderSpeiTable(calc) {
    const tbody = document.getElementById('speiTableBody');
    const tfoot = document.getElementById('speiTableFoot');
    if (!tbody || !tfoot) return;

    const isPct = appState.unitMode === 'pct';
    const fmtCell = (val, colGross) => {
      if (!isPct) return fmtMXN(val);
      return colGross > 0 ? `${((val / colGross) * 100).toFixed(1)}%` : '0.0%';
    };

    const rows = [
      {
        name: 'Inversión y Caja MASTERIZE',
        tag: `${fmtShortK(calc.caja.expenses)} Gastos + ${fmtShortK(calc.caja.free)} Libre`,
        color: '#a2d1bf',
        split: '20% Contrato',
        h1: calc.hitos.h1.caja,
        h2: calc.hitos.h2.caja,
        h3: calc.hitos.h3.caja,
        total: calc.hitos.total.caja,
        highlight: true,
      },
      {
        name: 'Omar · Closer Comercial',
        tag: '10% Cierre',
        color: '#f5a524',
        split: '10% Contrato',
        h1: calc.hitos.h1.closer,
        h2: calc.hitos.h2.closer,
        h3: calc.hitos.h3.closer,
        total: calc.hitos.total.closer,
        highlight: false,
      },
      {
        name: 'Daniel · Líder Técnico',
        tag: `+${fmtCompactMXN(calc.caja.monitorsTotal)} Monitores H1`,
        color: '#c8afe9',
        split: '50% Pool',
        h1: calc.partners.daniel.h1,
        h2: calc.partners.daniel.h2,
        h3: calc.partners.daniel.h3,
        total: calc.partners.daniel.total,
        highlight: true,
      },
      {
        name: 'Omar · Socio Pool',
        tag: `+${fmtCompactMXN(calc.caja.omarReimb)} Reembolso H1`,
        color: '#d2b5ef',
        split: '25% Pool',
        h1: calc.partners.omarPool.h1,
        h2: calc.partners.omarPool.h2,
        h3: calc.partners.omarPool.h3,
        total: calc.partners.omarPool.total,
        highlight: false,
      },
      {
        name: 'Pedro · Legal y Planta',
        tag: `+${fmtCompactMXN(calc.caja.viaticos)} Viáticos H1`,
        color: '#2ee6c8',
        split: '15% Pool',
        h1: calc.partners.pedro.h1,
        h2: calc.partners.pedro.h2,
        h3: calc.partners.pedro.h3,
        total: calc.partners.pedro.total,
        highlight: false,
      },
      {
        name: 'Octavio · Implementación',
        tag: '100% Efectivo',
        color: '#8f7cff',
        split: '10% Pool',
        h1: calc.partners.octavio.h1,
        h2: calc.partners.octavio.h2,
        h3: calc.partners.octavio.h3,
        total: calc.partners.octavio.total,
        highlight: false,
      },
    ];

    tbody.innerHTML = rows
      .map(
        (r) => `
      <tr class="${r.highlight ? 'is-highlight' : ''}">
        <td>
          <span class="role-dot" style="background:${r.color}"></span>
          ${r.name}
          ${r.tag ? `<span class="spei-tag">${r.tag}</span>` : ''}
        </td>
        <td>${r.split}</td>
        <td>${fmtCell(r.h1, calc.hitos.h1.gross)}</td>
        <td>${fmtCell(r.h2, calc.hitos.h2.gross)}</td>
        <td>${fmtCell(r.h3, calc.hitos.h3.gross)}</td>
        <td>${fmtCell(r.total, calc.hitos.total.gross)}</td>
      </tr>
    `
      )
      .join('');

    tfoot.innerHTML = `
      <tr>
        <td>TOTAL LIQUIDADO</td>
        <td>100%</td>
        <td>${fmtCell(calc.hitos.h1.gross, calc.hitos.h1.gross)}</td>
        <td>${fmtCell(calc.hitos.h2.gross, calc.hitos.h2.gross)}</td>
        <td>${fmtCell(calc.hitos.h3.gross, calc.hitos.h3.gross)}</td>
        <td>${fmtCell(calc.hitos.total.gross, calc.hitos.total.gross)}</td>
      </tr>
    `;

    tbody.querySelectorAll('tr').forEach((trEl, rIdx) => {
      trEl.addEventListener('click', () => {
        if (appState.isOverview || appState.currentSlide !== 5) return;
        clearChoreographyTimers();
        activateSubstep(rIdx < 2 ? 0 : 1, { scrollIntoView: false });
      });
    });

    tfoot.querySelectorAll('tr').forEach((trEl) => {
      trEl.addEventListener('click', () => {
        if (appState.isOverview || appState.currentSlide !== 5) return;
        clearChoreographyTimers();
        activateSubstep(2, { scrollIntoView: false });
      });
    });
  }

  function clearChoreographyTimers() {
    while (choreoTimers.length > 0) {
      clearTimeout(choreoTimers.pop());
    }
    appState.hasActiveSpotlight = false;
    document.querySelectorAll('.is-spotlight').forEach((el) => {
      el.classList.remove('is-spotlight');
    });
  }

  function syncAutoPlayUI() {
    const isPlaying = Boolean(appState.isAutoPlaying);
    const autoBtn = document.getElementById('autoPlayBtn');
    if (autoBtn) {
      autoBtn.classList.toggle('is-active', isPlaying);
      autoBtn.classList.toggle('is-playing', isPlaying);
      autoBtn.textContent = isPlaying ? '⏸ Auto' : '▶ Auto';
    }
    const bannerBtn = document.getElementById('autoPlayBannerBtn');
    if (bannerBtn) {
      bannerBtn.classList.toggle('is-playing', isPlaying);
    }
    const bannerIcon = document.getElementById('autoPlayBannerIcon');
    if (bannerIcon) {
      bannerIcon.textContent = isPlaying ? '⏸' : '▶';
    }
    const bannerLabel = document.getElementById('autoPlayBannerLabel');
    if (bannerLabel) {
      bannerLabel.textContent = 'Auto';
    }
    const pulseDot = document.getElementById('guidedPulseDot');
    if (pulseDot) {
      pulseDot.classList.toggle('is-playing', isPlaying);
    }
  }

  function stopAutoPlay() {
    if (autoPlayTimerId) {
      clearTimeout(autoPlayTimerId);
      autoPlayTimerId = 0;
    }
    appState.isAutoPlaying = false;
    syncAutoPlayUI();
  }

  function scrollSpotlightIntoView(els) {
    if (!els || els.length === 0 || typeof window === 'undefined') return;
    const validRects = els
      .map((el) => (el && typeof el.getBoundingClientRect === 'function' ? el.getBoundingClientRect() : null))
      .filter((r) => r && r.height > 0);
    if (validRects.length === 0) return;

    const topbarEl = document.querySelector('.deck-topbar');
    const bannerEl = document.getElementById('guidedBanner');
    const footerEl = document.getElementById('deckFooter');

    const topbarBottom = topbarEl ? topbarEl.getBoundingClientRect().bottom : 64;
    const bannerRect = bannerEl ? bannerEl.getBoundingClientRect() : null;
    const bannerStyle = bannerEl && window.getComputedStyle ? window.getComputedStyle(bannerEl) : null;
    const isBannerSticky = bannerStyle && bannerStyle.position === 'sticky';
    const topSafeBound = isBannerSticky && bannerRect ? bannerRect.bottom + 10 : topbarBottom + 10;
    const bottomSafeBound = footerEl ? footerEl.getBoundingClientRect().top - 10 : window.innerHeight - 64;

    const minTop = Math.min(...validRects.map((r) => r.top));
    const maxBottom = Math.max(...validRects.map((r) => r.bottom));

    if (maxBottom <= bottomSafeBound && minTop >= topSafeBound) {
      return;
    }

    const currentScrollY =
      window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0;
    let deltaY = 0;
    const availableWindow = Math.max(120, bottomSafeBound - topSafeBound);
    const groupHeight = maxBottom - minTop;

    if (groupHeight > availableWindow || minTop < topSafeBound) {
      deltaY = minTop - topSafeBound;
    } else if (maxBottom > bottomSafeBound) {
      deltaY = maxBottom - bottomSafeBound + 8;
    }

    if (Math.abs(deltaY) > 6 && typeof window.scrollTo === 'function') {
      const nextTop = Math.max(0, currentScrollY + deltaY);
      window.scrollTo({
        top: nextTop,
        behavior: isReducedMotion() ? 'auto' : 'smooth',
      });
    }
  }

  function activateSubstep(subIdx, options = {}) {
    const steps = buildSlideChoreography(
      appState.currentSlide,
      latestCalc,
      Boolean(appState.isOverview),
      appState
    );
    if (!steps || steps.length === 0) return;

    const clampedIdx = Math.max(0, Math.min(steps.length - 1, subIdx));
    const step = steps[clampedIdx];
    appState.activeSubstepIndex = clampedIdx;
    appState.hasActiveSpotlight = true;

    document.querySelectorAll('.is-spotlight').forEach((el) => {
      el.classList.remove('is-spotlight');
    });

    const matchedEls = [];
    if (step.selector) {
      document.querySelectorAll(step.selector).forEach((el) => {
        el.classList.add('is-spotlight');
        matchedEls.push(el);
      });
    }

    setText('guidedSubstepPill', step.substepLabel);
    const narrEl = document.getElementById('guidedNarrativeText');
    if (narrEl) narrEl.innerHTML = emphasise(step.narrative);

    const progEl = document.getElementById('guidedProgressFill');
    if (progEl) {
      progEl.style.width = `${Math.round(((clampedIdx + 1) / steps.length) * 100)}%`;
    }

    if (!options.skipOrbSurge && typeof step.orbIndex === 'number' && orbCells[step.orbIndex]) {
      const cell = orbCells[step.orbIndex];
      if (!isReducedMotion()) {
        cell.surgeEnergy = 1.3;
        cell.springVel = 0.85;
        spawnSplashDroplets(cell, 136, cell.currentRatio, 8);
      }
      ensureMasterLoopRunning();
    }

    if (options.scrollIntoView && matchedEls.length > 0) {
      scrollSpotlightIntoView(matchedEls);
    }
  }

  function runSlideChoreography() {
    clearChoreographyTimers();
    appState.activeSubstepIndex = 0;
    const steps = buildSlideChoreography(
      appState.currentSlide,
      latestCalc,
      Boolean(appState.isOverview),
      appState
    );
    if (!steps || steps.length === 0) return;

    const totalSlides = SLIDES_META.length;
    const idx = appState.currentSlide;
    setText(
      'guidedStepBadge',
      appState.isOverview
        ? 'GRID 7/7'
        : `0${idx + 1} / 0${totalSlides}`
    );

    const narrEl = document.getElementById('guidedNarrativeText');
    const progEl = document.getElementById('guidedProgressFill');

    if (isReducedMotion()) {
      const lastIdx = steps.length - 1;
      const last = steps[lastIdx];
      appState.activeSubstepIndex = lastIdx;
      appState.hasActiveSpotlight = false;
      setText('guidedSubstepPill', last.substepLabel);
      if (narrEl) narrEl.innerHTML = emphasise(last.narrative);
      if (progEl) progEl.style.width = '100%';
      return;
    }

    steps.forEach((step, sIdx) => {
      const tId = window.setTimeout(() => {
        activateSubstep(sIdx, { scrollIntoView: sIdx > 0 });
      }, step.delayMs);
      choreoTimers.push(tId);
    });

    const lastDelay = steps[steps.length - 1].delayMs || 0;
    const clearId = window.setTimeout(() => {
      appState.hasActiveSpotlight = false;
      document.querySelectorAll('.is-spotlight').forEach((el) => {
        el.classList.remove('is-spotlight');
      });
    }, lastDelay + 2200);
    choreoTimers.push(clearId);
  }

  function syncSlidePresentation() {
    const totalSlides = SLIDES_META.length;
    const idx = Math.max(0, Math.min(totalSlides - 1, appState.currentSlide));
    appState.currentSlide = idx;

    const shell = document.getElementById('deckShell');
    if (shell) {
      shell.classList.toggle('is-overview', Boolean(appState.isOverview));
    }

    const blackoutEl = document.getElementById('deckBlackout');
    if (blackoutEl) {
      blackoutEl.hidden = !appState.isBlackout;
    }

    document.querySelectorAll('.deck-slide').forEach((slideEl) => {
      const sIdx = parseInt(slideEl.getAttribute('data-slide'), 10);
      slideEl.classList.toggle('is-active', !appState.isOverview && sIdx === idx);
    });

    document.querySelectorAll('[data-slide-to]').forEach((btn) => {
      const bIdx = parseInt(btn.getAttribute('data-slide-to'), 10);
      btn.classList.toggle('is-active', !appState.isOverview && bIdx === idx);
    });

    const stepGridBtn = document.getElementById('stepGridBtn');
    if (stepGridBtn) {
      stepGridBtn.classList.toggle('is-active', Boolean(appState.isOverview));
    }
    const overviewBtn = document.getElementById('overviewToggleBtn');
    if (overviewBtn) {
      overviewBtn.classList.toggle('is-active', Boolean(appState.isOverview));
    }
    const notesBtn = document.getElementById('notesToggleBtn');
    if (notesBtn) {
      notesBtn.classList.toggle('is-active', Boolean(appState.showNotes));
    }

    // Center active step pill in horizontal mobile stepper without vertical jump
    const stepsNav = document.querySelector('.deck-steps');
    const activeStepBtn = stepsNav && stepsNav.querySelector('.deck-step-btn.is-active');
    if (stepsNav && activeStepBtn && typeof stepsNav.scrollTo === 'function') {
      const targetLeft =
        activeStepBtn.offsetLeft - stepsNav.clientWidth / 2 + activeStepBtn.clientWidth / 2;
      stepsNav.scrollTo({
        left: Math.max(0, targetLeft),
        behavior: isReducedMotion() ? 'auto' : 'smooth',
      });
    }

    const meta = SLIDES_META[idx] || SLIDES_META[0];
    setText('slideCounterText', appState.isOverview ? 'GRID' : `0${idx + 1} / 0${totalSlides}`);
    setText('slideNameText', appState.isOverview ? '7/7' : meta.name);

    const nextMeta = idx + 1 < totalSlides ? SLIDES_META[idx + 1] : null;
    setText(
      'speakerNextSlide',
      appState.isOverview
        ? '↺ 01'
        : nextMeta
          ? `0${idx + 2} · ${nextMeta.name}`
          : '⊞ Grid'
    );

    const progressBar = document.getElementById('deckProgressBar');
    if (progressBar) {
      const totalStepsWithGrid = totalSlides + 1;
      const currentStepNum = appState.isOverview ? totalStepsWithGrid : idx + 1;
      progressBar.style.width = `${((currentStepNum / totalStepsWithGrid) * 100).toFixed(2)}%`;
    }

    const prevBtn = document.getElementById('prevSlideBtn');
    const nextBtn = document.getElementById('nextSlideBtn');
    if (prevBtn) prevBtn.disabled = idx === 0 && !appState.isOverview;

    const nextLabelText = appState.isOverview
      ? '↺ 01 · Contrato'
      : nextMeta
        ? `0${idx + 2} · ${nextMeta.name} →`
        : '⊞ Grid →';

    if (nextBtn) {
      nextBtn.textContent = nextLabelText;
    }
    setText(
      'bannerNextStepLabel',
      appState.isOverview ? '↺ 01' : nextMeta ? 'Siguiente →' : '⊞ Grid →'
    );

    const notesBar = document.getElementById('speakerNotesBar');
    if (notesBar) {
      notesBar.hidden = !appState.showNotes;
    }
    setText('speakerNoteText', meta.getNote(latestCalc));
    syncSpeakerTimerLoop();
    syncAutoPlayUI();
  }

  function scrollStageTopOnMobile() {
    if (typeof window === 'undefined') return;
    const resetNow = () => {
      if (typeof window.scrollTo === 'function') {
        window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
      }
      if (document.documentElement) document.documentElement.scrollTop = 0;
      if (document.body) document.body.scrollTop = 0;
    };
    resetNow();
    if (typeof window.requestAnimationFrame === 'function') {
      window.requestAnimationFrame(resetNow);
    }
  }

  function enterOverviewStep() {
    appState.isOverview = true;
    appState.isBlackout = false;
    pulseOrbMood('speaking', 1200);
    syncControlButtons();
    syncSlidePresentation();
    scrollStageTopOnMobile();
    runSlideChoreography();
    ensureMasterLoopRunning();
  }

  function goToSlide(index) {
    const totalSlides = SLIDES_META.length;
    appState.currentSlide = ((index % totalSlides) + totalSlides) % totalSlides;
    appState.isOverview = false;
    appState.isBlackout = false;

    // Sync activeView pill with current slide
    if (appState.currentSlide === 2) appState.activeView = 'orbs';
    else if (appState.currentSlide === 3 || appState.currentSlide === 4) appState.activeView = 'dials';
    else if (appState.currentSlide === 5) appState.activeView = 'spei';
    else appState.activeView = 'all';

    const slideMoods = ['listening', 'thinking', 'working', 'working', 'thinking', 'speaking', 'speaking'];
    pulseOrbMood(slideMoods[appState.currentSlide] || 'working', 1100);

    syncControlButtons();
    syncSlidePresentation();
    if (appState.currentSlide === 2) {
      const reducedMotion = isReducedMotion();
      orbCells.forEach((c) => {
        if (!reducedMotion) {
          c.surgeEnergy = 1.1;
          spawnSplashDroplets(c, 136, c.currentRatio, 6);
        } else {
          c.surgeEnergy = 0;
          c.splashes = [];
        }
      });
    }
    scrollStageTopOnMobile();
    runSlideChoreography();
    ensureMasterLoopRunning();
  }

  function scheduleAutoPlayNext() {
    if (autoPlayTimerId) {
      clearTimeout(autoPlayTimerId);
      autoPlayTimerId = 0;
    }
    if (!appState.isAutoPlaying) return;

    const currentSteps = buildSlideChoreography(
      appState.currentSlide,
      latestCalc,
      Boolean(appState.isOverview),
      appState
    );
    const lastDelay =
      currentSteps && currentSteps.length > 0
        ? currentSteps[currentSteps.length - 1].delayMs || 0
        : 2700;
    const waitMs = Math.max(5200, lastDelay + 2400);

    autoPlayTimerId = window.setTimeout(() => {
      if (!appState.isAutoPlaying) return;
      if (!appState.isOverview && appState.currentSlide < SLIDES_META.length - 1) {
        goToSlide(appState.currentSlide + 1);
        scheduleAutoPlayNext();
      } else if (!appState.isOverview && appState.currentSlide === SLIDES_META.length - 1) {
        enterOverviewStep();
        scheduleAutoPlayNext();
      } else {
        stopAutoPlay();
      }
    }, waitMs);
  }

  function toggleAutoPlay() {
    if (appState.isAutoPlaying) {
      stopAutoPlay();
      return;
    }
    appState.isAutoPlaying = true;
    syncAutoPlayUI();
    if (appState.isOverview) {
      goToSlide(0);
    } else {
      runSlideChoreography();
    }
    scheduleAutoPlayNext();
  }

  function advanceOneButtonStep() {
    if (!appState.isOverview && appState.currentSlide < SLIDES_META.length - 1) {
      goToSlide(appState.currentSlide + 1);
    } else if (!appState.isOverview && appState.currentSlide === SLIDES_META.length - 1) {
      enterOverviewStep();
    } else {
      goToSlide(0);
    }
    if (appState.isAutoPlaying) {
      scheduleAutoPlayNext();
    }
  }

  function syncControlButtons() {
    document.querySelectorAll('[data-hito]').forEach((btn) => {
      btn.classList.toggle('is-active', btn.getAttribute('data-hito') === appState.selectedHito);
    });
    document.querySelectorAll('[data-unit]').forEach((btn) => {
      btn.classList.toggle('is-active', btn.getAttribute('data-unit') === appState.unitMode);
    });
    document.querySelectorAll('[data-orb-group]').forEach((btn) => {
      btn.classList.toggle('is-active', btn.getAttribute('data-orb-group') === appState.orbGroup);
    });
    document.querySelectorAll('[data-render-mode]').forEach((btn) => {
      btn.classList.toggle('is-active', btn.getAttribute('data-render-mode') === appState.renderMode);
    });
    document.querySelectorAll('[data-view]').forEach((btn) => {
      btn.classList.toggle('is-active', btn.getAttribute('data-view') === appState.activeView);
    });
    const effMood = getEffectiveOrbMood();
    document.querySelectorAll('[data-orb-mood]').forEach((btn) => {
      btn.classList.toggle('is-active', btn.getAttribute('data-orb-mood') === effMood);
    });
    const moodCycleBtn = document.getElementById('vdMoodCycleBtn');
    if (moodCycleBtn) {
      moodCycleBtn.textContent = effMood.toUpperCase();
    }
    document.querySelectorAll('[data-viaticos]').forEach((btn) => {
      const presetVal = parseFloat(btn.getAttribute('data-viaticos'));
      const isMatch =
        appState.chkViaticos && Math.abs((Number(appState.viaticos) || 0) - presetVal) < 0.01;
      btn.classList.toggle('is-active', isMatch);
    });
    [
      ['chkOmarReimb', 'chkOmarReimb'],
      ['chkMon30', 'chkMon30'],
      ['chkMon15', 'chkMon15'],
      ['chkViaticos', 'chkViaticos'],
    ].forEach(([id, key]) => {
      const el = document.getElementById(id);
      const row = el && el.closest('.ctrl-row, .ctrl-slider-row');
      if (row) row.classList.toggle('is-disabled', !appState[key]);
    });
  }

  function updateUI(forceReset = false) {
    latestCalc = calculateFinancials(appState);
    const c = latestCalc;
    const isPct = appState.unitMode === 'pct';
    const hasContract = c.gross > 0;
    const dark = isDarkMode();

    const isCajaDeficit = c.caja.free < 0;
    const isIgualaDeficit = c.iguala.freeMonthly < 0;
    const hasDeficit = isCajaDeficit || isIgualaDeficit;

    const statusBadge = document.getElementById('statusBadge');
    if (statusBadge) {
      if (isCajaDeficit) {
        statusBadge.textContent = `DÉFICIT ${fmtCompactMXN(c.caja.free)}`;
      } else if (isIgualaDeficit) {
        statusBadge.textContent = `DÉFICIT ${fmtCompactMXN(c.iguala.freeMonthly)}`;
      } else {
        statusBadge.textContent = '100% OK';
      }
      statusBadge.classList.toggle('mint', !hasDeficit);
      statusBadge.classList.toggle('ws-error', hasDeficit);
    }

    const vdMoodDot = document.getElementById('vdMoodDot');
    if (vdMoodDot) vdMoodDot.classList.toggle('is-error', hasDeficit);
    setText('vdModeLabel', hasDeficit ? 'ALERTA' : 'AÑO 1');

    // KPI & Companion Rail Values
    setText('vdTreasuryVal', fmtCompactMXN(c.year1FreeTreasury));
    setText('slide7TreasuryVal', fmtCompactMXN(c.year1FreeTreasury));
    setText('slide7Headline', fmtCompactMXN(c.year1FreeTreasury));
    setText('navPillAll', fmtShortK(c.gross));
    setText('navPillCaja', `${fmtShortK(c.caja.free)} + ${fmtShortK(c.iguala.freeMonthly)}`);
    setText('orbitStackMeta', `${fmtCompactMXN(c.iguala.costTotal)}/mes`);

    // Update ProviderOrbit node tooltips dynamically
    const orbitTooltips = {
      claude: `Claude (${fmtCompactMXN(c.iguala.claude)}/mes)`,
      gemini: `Gemini (${fmtCompactMXN(c.iguala.googleAi)}/mes)`,
      azure: `Azure (${fmtCompactMXN(c.iguala.azure)}/mes)`,
      jev: `Iguala ${fmtCompactMXN(c.iguala.gross)}/mes`,
    };
    document.querySelectorAll('[data-orbit-provider]').forEach((nodeEl) => {
      const pKey = nodeEl.getAttribute('data-orbit-provider');
      if (orbitTooltips[pKey]) {
        nodeEl.setAttribute('title', orbitTooltips[pKey]);
      }
    });

    const sideCajaEl = document.getElementById('sideCajaFree');
    if (sideCajaEl) {
      sideCajaEl.textContent = fmtCompactMXN(c.caja.free);
      sideCajaEl.classList.toggle('is-negative', isCajaDeficit);
    }
    const sideIgualaEl = document.getElementById('sideIgualaFree');
    if (sideIgualaEl) {
      sideIgualaEl.textContent = `${fmtCompactMXN(c.iguala.freeMonthly)}/mes`;
      sideIgualaEl.classList.toggle('is-negative', isIgualaDeficit);
    }
    setText('sideOmarCash', fmtCompactMXN(c.consolidated.omarTotalCash));
    setText('sideOmarSub', `${fmtCompactMXN(c.consolidated.omarNetProfit)} + Reembolso`);
    setText('sideDanielTotal', fmtCompactMXN(c.consolidated.danielTotalBenefit));
    setText('sideDanielSub', `${fmtCompactMXN(c.partners.daniel.total)} + Monitores`);
    setText('sidePedroTotal', fmtCompactMXN(c.consolidated.pedroTotalCash));
    setText('sidePedroSub', `${fmtCompactMXN(c.partners.pedro.total)} + Viáticos`);
    setText('sideOctavioTotal', fmtCompactMXN(c.partners.octavio.total));

    // Slide 01: Hero Contract
    setText('ivaBadge', `+IVA ${fmtCompactMXN(c.totalWithIva)}`);
    setText(
      'heroHitosInline',
      `3 cobros: ${fmtShortK(c.hitos.h1.gross)} (40%) · ${fmtShortK(c.hitos.h2.gross)} (30%) · ${fmtShortK(c.hitos.h3.gross)} (30%)`
    );
    setText('segPoolLabel', hasContract ? '70% Socios' : '0%');
    setText('segCajaLabel', hasContract ? '20% Inversión/Caja' : '0%');
    setText('segCloserLabel', hasContract ? '10% Closer' : '0%');
    setText('wellPoolTotal', isPct ? (hasContract ? '70.0%' : '0.0%') : fmtCompactMXN(c.hitos.total.pool));
    setText('wellCajaTotal', isPct ? (hasContract ? '20.0%' : '0.0%') : fmtCompactMXN(c.caja.gross));
    setText('wellCloserTotal', isPct ? (hasContract ? '10.0%' : '0.0%') : fmtCompactMXN(c.hitos.total.closer));

    setText('wellPoolSub', isPct ? fmtCompactMXN(c.hitos.total.pool) : '50% Daniel · 25% Omar · 15% Pedro · 10% Octavio');
    setText('wellCajaSub', `Se cubre 100% en Hito 1 · ${fmtCompactMXN(c.caja.free)} Libre`);
    setText('wellCloserSub', isPct ? fmtCompactMXN(c.hitos.total.closer) : 'Comisión Cierre · Omar Moranza');

    const poolPillsEl = document.getElementById('poolMiniPills');
    if (poolPillsEl) {
      poolPillsEl.innerHTML = `
        <span>Dan ${fmtShortK(c.partners.daniel.total)}</span>
        <span>Omar ${fmtShortK(c.partners.omarPool.total)}</span>
        <span>Ped ${fmtShortK(c.partners.pedro.total)}</span>
        <span>Oct ${fmtShortK(c.partners.octavio.total)}</span>
      `;
    }
    const cajaPillsEl = document.getElementById('cajaMiniPills');
    if (cajaPillsEl) {
      cajaPillsEl.innerHTML = `
        <span>Gastos H1 -${fmtShortK(c.caja.expenses)}</span>
        <span>Caja Libre ${fmtShortK(c.caja.free)}</span>
      `;
    }
    const closerPillsEl = document.getElementById('closerMiniPills');
    if (closerPillsEl) {
      closerPillsEl.innerHTML = `
        <span>H1 ${fmtShortK(c.hitos.h1.closer)}</span>
        <span>H2 ${fmtShortK(c.hitos.h2.closer)}</span>
        <span>H3 ${fmtShortK(c.hitos.h3.closer)}</span>
      `;
    }

    // Slide 02: Milestones & First $60k Breakdown
    setText(
      'hitoChartTitle',
      `${fmtShortK(c.hitos.h1.gross)} · ${fmtShortK(c.hitos.h2.gross)} · ${fmtShortK(c.hitos.h3.gross)}`
    );
    const slide2TitleEl = document.getElementById('slide2MainTitle');
    if (slide2TitleEl) {
      slide2TitleEl.innerHTML = `Primeros ${fmtShortK(c.hitos.h1.gross)}: ${fmtShortK(c.hitos.h1.caja)} Inversión + ${fmtShortK(c.hitos.h1.sociosTotal)} Socios<span class="op-dot">.</span>`;
    }
    setText('slide2CajaSplitLegend', hasContract ? '20% (100% en H1)' : '0%');
    setText('hitoTotalBtn', fmtShortK(c.gross));

    renderBankSparkline(
      document.getElementById('bankSparkArt'),
      c.hitos.h1.gross,
      c.hitos.h2.gross,
      c.hitos.h3.gross,
      c.gross,
      c.year1FreeTreasury
    );

    renderMilestoneBars(c);

    // Slide 03: Partners & Buckets (60fps Liquid Surge Orbs)
    const orbHeadline = document.getElementById('orbStageHeadline');
    if (orbHeadline) {
      if (appState.orbGroup === 'buckets') {
        orbHeadline.innerHTML = '3 Bolsas Maestras: 70% · 20% · 10%<span class="op-dot">.</span>';
      } else if (appState.selectedHito === 'h1') {
        orbHeadline.innerHTML = `Hito 1 (${fmtShortK(c.hitos.h1.gross)}): ${fmtShortK(c.hitos.h1.caja)} Inversión + ${fmtShortK(c.hitos.h1.sociosTotal)} Socios<span class="op-dot">.</span>`;
      } else if (appState.selectedHito === 'h2') {
        orbHeadline.innerHTML = `Hito 2 (${fmtShortK(c.hitos.h2.gross)}): 100% Reparto a Socios<span class="op-dot">.</span>`;
      } else if (appState.selectedHito === 'h3') {
        orbHeadline.innerHTML = `Hito 3 (${fmtShortK(c.hitos.h3.gross)}): Liquidación 100% Socios<span class="op-dot">.</span>`;
      } else {
        orbHeadline.innerHTML = 'Lo que recibe cada Socio (50% · 25% · 15% · 10%)<span class="op-dot">.</span>';
      }
    }
    const orbItems = buildOrbItems(c, appState);
    syncOrbGridDOM(orbItems, forceReset);

    // Slide 04: Caja MASTERIZE ($30,000 in H1 -> $14,000 Libres)
    setText('slide4GrossHeadline', fmtCompactMXN(c.caja.gross));
    setText('slide4FreeHeadline', fmtCompactMXN(c.caja.free));
    setText('cajaGrossPill', `Gastos H1: -${fmtCompactMXN(c.caja.expenses)}`);
    setText('cajaDialVal', isPct ? `${c.caja.marginPct.toFixed(1)}%` : fmtCompactMXN(c.caja.free));
    const cajaPctEl = document.getElementById('cajaDialPct');
    if (cajaPctEl) {
      cajaPctEl.textContent = isPct
        ? fmtCompactMXN(c.caja.free)
        : `${c.caja.marginPct.toFixed(1)}%`;
      cajaPctEl.classList.toggle('is-negative', isCajaDeficit);
    }
    setText('monTotalInline', fmtMXN(c.caja.monitorsTotal));
    renderCajaBreakdownBar(c);
    renderInstrumentDial(
      document.getElementById('cajaDialSvg'),
      c.caja.gross > 0 ? c.caja.free / c.caja.gross : 0,
      isCajaDeficit ? (dark ? '#efb4bd' : '#b43e52') : (dark ? '#a2d1bf' : '#408374')
    );

    // Slide 05: Iguala MRR
    setText('slide5GrossHeadline', fmtCompactMXN(c.iguala.gross));
    setText('slide5FreeHeadline', fmtCompactMXN(c.iguala.freeMonthly));
    setText('igualaAnnualPill', `+${fmtCompactMXN(c.iguala.freeAnnual)}/año`);
    setText('igualaDialVal', isPct ? `${c.iguala.marginPct.toFixed(1)}%` : fmtCompactMXN(c.iguala.freeMonthly));
    const igPctEl = document.getElementById('igualaDialPct');
    if (igPctEl) {
      igPctEl.textContent = isPct
        ? fmtCompactMXN(c.iguala.freeMonthly)
        : `${c.iguala.marginPct.toFixed(1)}%`;
      igPctEl.classList.toggle('is-negative', isIgualaDeficit);
    }
    renderInstrumentDial(
      document.getElementById('igualaDialSvg'),
      c.iguala.gross > 0 ? c.iguala.freeMonthly / c.iguala.gross : 0,
      isIgualaDeficit ? (dark ? '#efb4bd' : '#b43e52') : (dark ? '#c8afe9' : '#8462ab')
    );

    // Slide 06: SPEI Table
    setText('speiCheckLabel', fmtMXN(c.gross));
    setText(
      'slide6Headline',
      `${fmtShortK(c.hitos.h1.gross)} · ${fmtShortK(c.hitos.h2.gross)} · ${fmtShortK(c.hitos.h3.gross)}`
    );
    renderSpeiTable(c);

    // Slide 07: Dynamic Next Steps (First $30k Inversión/Caja + Next $30k Socios + H2/H3 Liquidación + Iguala)
    setText('step1Title', `${fmtCompactMXN(c.hitos.h1.caja)} · Inversión y Caja`);
    setText('step1Caja', fmtCompactMXN(c.caja.free));
    setText('step2Omar', fmtCompactMXN(c.caja.omarReimb));
    setText('step2Mon', fmtCompactMXN(c.caja.monitorsTotal));
    setText('step2Viat', fmtCompactMXN(c.caja.viaticos));

    setText('step2Title', `${fmtCompactMXN(c.hitos.h1.sociosTotal)} · 1er Pago Socios`);
    setText('step1Daniel', fmtCompactMXN(c.partners.daniel.h1));
    setText('step1Omar', fmtCompactMXN(c.partners.omarTotal.h1));
    setText('step1Pedro', fmtCompactMXN(c.partners.pedro.h1));
    setText('step1Octavio', fmtCompactMXN(c.partners.octavio.h1));
    setText('step1Pool', fmtShortK(c.hitos.h1.pool));
    setText('step1Closer', fmtShortK(c.hitos.h1.closer));

    setText('step3Title', `${fmtCompactMXN(c.hitos.h2.gross)} + ${fmtCompactMXN(c.hitos.h3.gross)} a Socios`);
    setText('step3Daniel', fmtCompactMXN(c.partners.daniel.h2));
    setText('step3Omar', fmtCompactMXN(c.partners.omarTotal.h2));
    setText('step3Pedro', fmtCompactMXN(c.partners.pedro.h2));
    setText('step3Octavio', fmtCompactMXN(c.partners.octavio.h2));
    setText('step3Caja', fmtCompactMXN(c.hitos.h2.caja));
    setText('step3Closer', fmtShortK(c.hitos.h2.closer));
    setText('step3Pool', fmtShortK(c.hitos.h2.pool));

    setText('step4Title', `${fmtCompactMXN(c.iguala.gross)}/mes → ${fmtCompactMXN(c.iguala.freeMonthly)} Libres`);
    setText('step4Stack', `-${fmtCompactMXN(c.iguala.costTotal)}`);
    setText('step4Free', fmtCompactMXN(c.iguala.freeMonthly));
    setText('step4Annual', `${fmtCompactMXN(c.iguala.freeAnnual)}/año`);

    // Refresh Guided Banner text & active spotlight for the current substep (preserving substep state)
    const currentSteps = buildSlideChoreography(
      appState.currentSlide,
      c,
      Boolean(appState.isOverview),
      appState
    );
    if (currentSteps && currentSteps.length > 0) {
      const subIdx = Math.max(
        0,
        Math.min(currentSteps.length - 1, appState.activeSubstepIndex || 0)
      );
      appState.activeSubstepIndex = subIdx;
      const activeStep = currentSteps[subIdx] || currentSteps[0];
      setText('guidedSubstepPill', activeStep.substepLabel);
      const narrEl = document.getElementById('guidedNarrativeText');
      if (narrEl) {
        narrEl.innerHTML = emphasise(activeStep.narrative);
      }
      const progEl = document.getElementById('guidedProgressFill');
      if (progEl) {
        progEl.style.width = `${Math.round(((subIdx + 1) / currentSteps.length) * 100)}%`;
      }
      if (appState.hasActiveSpotlight && activeStep.selector) {
        document.querySelectorAll('.is-spotlight').forEach((el) => {
          el.classList.remove('is-spotlight');
        });
        document.querySelectorAll(activeStep.selector).forEach((el) => {
          el.classList.add('is-spotlight');
        });
      }
    }

    syncControlButtons();
    syncSlidePresentation();
  }

  function setHitoFilter(hito) {
    appState.selectedHito = hito;
    if (!appState.isOverview && appState.currentSlide === 1) {
      clearChoreographyTimers();
      const mapIdx = hito === 'h1' ? 0 : 2;
      appState.activeSubstepIndex = mapIdx;
      appState.hasActiveSpotlight = true;
    }
    pulseOrbMood('thinking', 900);
    updateUI();
  }

  function bindEvents() {
    const bindNum = (id, key) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.addEventListener('input', () => {
        stopAutoPlay();
        appState[key] = Math.max(0, parseFloat(el.value) || 0);
        if (key === 'viaticos') {
          const rng = document.getElementById('rngViaticos');
          if (rng) rng.value = appState.viaticos;
        }
        pulseOrbMood('working', 1100);
        updateUI();
      });
    };

    const bindChk = (id, key) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.addEventListener('change', () => {
        stopAutoPlay();
        appState[key] = el.checked;
        pulseOrbMood('working', 900);
        updateUI();
      });
    };

    bindNum('contractGrossInput', 'contractGross');
    bindChk('chkOmarReimb', 'chkOmarReimb');
    bindNum('inpOmarReimb', 'omarReimb');
    bindChk('chkMon30', 'chkMon30');
    bindNum('inpMon30', 'mon30');
    bindChk('chkMon15', 'chkMon15');
    bindNum('inpMon15', 'mon15');
    bindChk('chkViaticos', 'chkViaticos');
    bindNum('inpViaticos', 'viaticos');
    bindNum('inpIgualaGross', 'igualaGross');
    bindNum('inpAzure', 'azure');
    bindNum('inpClaude', 'claude');
    bindNum('inpGoogleAi', 'googleAi');

    const rngViaticos = document.getElementById('rngViaticos');
    if (rngViaticos) {
      rngViaticos.addEventListener('input', () => {
        stopAutoPlay();
        appState.viaticos = Math.max(0, parseFloat(rngViaticos.value) || 0);
        const inp = document.getElementById('inpViaticos');
        if (inp) inp.value = appState.viaticos;
        pulseOrbMood('working', 900);
        updateUI();
      });
    }

    document.querySelectorAll('[data-viaticos]').forEach((btn) => {
      btn.addEventListener('click', () => {
        stopAutoPlay();
        const val = Math.max(0, parseFloat(btn.getAttribute('data-viaticos')) || 0);
        appState.viaticos = val;
        appState.chkViaticos = true;
        document.getElementById('chkViaticos').checked = true;
        document.getElementById('inpViaticos').value = val;
        document.getElementById('rngViaticos').value = val;
        pulseOrbMood('speaking', 1000);
        updateUI();
      });
    });

    document.querySelectorAll('[data-hito]').forEach((btn) => {
      btn.addEventListener('click', () => setHitoFilter(btn.getAttribute('data-hito')));
    });

    document.querySelectorAll('[data-unit]').forEach((btn) => {
      btn.addEventListener('click', () => {
        appState.unitMode = btn.getAttribute('data-unit');
        pulseOrbMood('listening', 900);
        updateUI();
      });
    });

    document.querySelectorAll('[data-orb-group]').forEach((btn) => {
      btn.addEventListener('click', () => {
        appState.orbGroup = btn.getAttribute('data-orb-group');
        appState.activeSubstepIndex = 0;
        pulseOrbMood('thinking', 1000);
        updateUI(true);
        if (!appState.isOverview && appState.currentSlide === 2) {
          runSlideChoreography();
        }
      });
    });

    document.querySelectorAll('[data-render-mode]').forEach((btn) => {
      btn.addEventListener('click', () => {
        appState.renderMode = btn.getAttribute('data-render-mode');
        pulseOrbMood('speaking', 900);
        updateUI(true);
      });
    });

    // VoiceOrb Mood Selector Controls
    const moodOrder = ['idle', 'listening', 'thinking', 'working', 'speaking'];
    document.querySelectorAll('[data-orb-mood]').forEach((btn) => {
      btn.addEventListener('click', () => {
        if (moodRevertTimer) clearTimeout(moodRevertTimer);
        manualMoodOverride = true;
        appState.orbMood = btn.getAttribute('data-orb-mood') || 'idle';
        syncControlButtons();
        ensureMasterLoopRunning();
      });
    });

    const cycleMood = () => {
      if (moodRevertTimer) clearTimeout(moodRevertTimer);
      manualMoodOverride = true;
      const curIdx = moodOrder.indexOf(appState.orbMood);
      appState.orbMood = moodOrder[(curIdx + 1) % moodOrder.length];
      syncControlButtons();
      ensureMasterLoopRunning();
    };

    const moodCycleBtn = document.getElementById('vdMoodCycleBtn');
    if (moodCycleBtn) moodCycleBtn.addEventListener('click', cycleMood);

    const vdStage = document.getElementById('voiceDockStage');
    if (vdStage) vdStage.addEventListener('click', cycleMood);

    // Reduced motion dynamic toggle listener
    if (typeof window.matchMedia === 'function') {
      const rmQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      const onReducedMotionChange = () => {
        if (isReducedMotion()) {
          orbCells.forEach((c) => {
            c.currentRatio = c.toRatio;
            c.springVel = 0;
            c.surgeEnergy = 0;
            c.splashes = [];
          });
        }
        ensureMasterLoopRunning();
      };
      if (typeof rmQuery.addEventListener === 'function') {
        rmQuery.addEventListener('change', onReducedMotionChange);
      } else if (typeof rmQuery.addListener === 'function') {
        rmQuery.addListener(onReducedMotionChange);
      }
    }

    // ProviderOrbit Node Click -> Jump to Slide 05 (Iguala MRR / AI Stack)
    const providerInputMap = {
      claude: 'inpClaude',
      gemini: 'inpGoogleAi',
      azure: 'inpAzure',
      jev: 'inpIgualaGross',
    };
    document.querySelectorAll('[data-orbit-provider]').forEach((nodeEl) => {
      nodeEl.addEventListener('click', () => {
        stopAutoPlay();
        const pKey = nodeEl.getAttribute('data-orbit-provider');
        goToSlide(4);
        const inpId = providerInputMap[pKey];
        const inpEl = inpId && document.getElementById(inpId);
        if (inpEl && typeof inpEl.focus === 'function') {
          inpEl.focus();
        }
      });
    });

    // Slide Stepper Navigation
    document.querySelectorAll('[data-slide-to]').forEach((btn) => {
      btn.addEventListener('click', () => {
        stopAutoPlay();
        goToSlide(parseInt(btn.getAttribute('data-slide-to'), 10));
      });
    });

    const stepGridBtn = document.getElementById('stepGridBtn');
    if (stepGridBtn) {
      stepGridBtn.addEventListener('click', () => {
        stopAutoPlay();
        if (appState.isOverview) {
          goToSlide(appState.currentSlide);
        } else {
          enterOverviewStep();
        }
      });
    }

    const prevBtn = document.getElementById('prevSlideBtn');
    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        stopAutoPlay();
        if (appState.isOverview) {
          goToSlide(SLIDES_META.length - 1);
        } else if (appState.currentSlide > 0) {
          goToSlide(appState.currentSlide - 1);
        }
      });
    }

    // One-Button Guided Presentation & Step-by-Step Advancement
    const nextBtn = document.getElementById('nextSlideBtn');
    if (nextBtn) {
      nextBtn.addEventListener('click', advanceOneButtonStep);
    }

    const bannerNextBtn = document.getElementById('bannerNextStepBtn');
    if (bannerNextBtn) {
      bannerNextBtn.addEventListener('click', advanceOneButtonStep);
    }

    const substepPill = document.getElementById('guidedSubstepPill');
    if (substepPill) {
      substepPill.addEventListener('click', () => {
        clearChoreographyTimers();
        const steps = buildSlideChoreography(
          appState.currentSlide,
          latestCalc,
          Boolean(appState.isOverview),
          appState
        );
        if (!steps || steps.length === 0) return;
        const nextSub = ((appState.activeSubstepIndex || 0) + 1) % steps.length;
        activateSubstep(nextSub, { scrollIntoView: true });
      });
    }

    const autoPlayBtn = document.getElementById('autoPlayBtn');
    if (autoPlayBtn) {
      autoPlayBtn.addEventListener('click', toggleAutoPlay);
    }

    const autoPlayBannerBtn = document.getElementById('autoPlayBannerBtn');
    if (autoPlayBannerBtn) {
      autoPlayBannerBtn.addEventListener('click', toggleAutoPlay);
    }

    // Overview Grid Mode ([ESC] or Grid button)
    const overviewBtn = document.getElementById('overviewToggleBtn');
    if (overviewBtn) {
      overviewBtn.addEventListener('click', () => {
        stopAutoPlay();
        if (appState.isOverview) {
          appState.isOverview = false;
          syncSlidePresentation();
          runSlideChoreography();
        } else {
          enterOverviewStep();
        }
      });
    }

    document.querySelectorAll('.deck-slide').forEach((slideEl) => {
      slideEl.addEventListener('click', (e) => {
        if (!appState.isOverview) return;
        if (e.target.closest('input, button, a')) return;
        stopAutoPlay();
        const sIdx = parseInt(slideEl.getAttribute('data-slide'), 10);
        goToSlide(sIdx);
      });
    });

    // Interactive Card Tap-to-Spotlight within slides
    document.querySelectorAll('.bucket-card').forEach((card, bIdx) => {
      card.addEventListener('click', () => {
        if (appState.isOverview) return;
        clearChoreographyTimers();
        activateSubstep(bIdx, { scrollIntoView: false });
      });
    });

    document.querySelectorAll('#nextStepsGrid .step-card').forEach((card, sIdx) => {
      card.addEventListener('click', () => {
        if (appState.isOverview || appState.currentSlide !== 6) return;
        clearChoreographyTimers();
        activateSubstep(sIdx < 2 ? 0 : 1, { scrollIntoView: false });
      });
    });

    const execKpiStrip = document.querySelector('.exec-kpi-strip');
    if (execKpiStrip) {
      execKpiStrip.addEventListener('click', () => {
        if (appState.isOverview || appState.currentSlide !== 6) return;
        clearChoreographyTimers();
        activateSubstep(2, { scrollIntoView: false });
      });
    }

    // Slides 04 & 05: tap dial or expense rows to inspect substeps
    document.querySelectorAll('[data-slide="3"] .dial-wrap, [data-slide="4"] .dial-wrap').forEach((dialEl) => {
      dialEl.addEventListener('click', () => {
        if (appState.isOverview || (appState.currentSlide !== 3 && appState.currentSlide !== 4)) return;
        clearChoreographyTimers();
        activateSubstep(2, { scrollIntoView: false });
      });
    });

    document.querySelectorAll('[data-slide="3"] .ctrl-row, [data-slide="3"] .ctrl-slider-row').forEach((rowEl, rIdx) => {
      rowEl.addEventListener('click', () => {
        if (appState.isOverview || appState.currentSlide !== 3) return;
        clearChoreographyTimers();
        const targetSub = rIdx === 0 ? 0 : rIdx < 3 ? 1 : 2;
        activateSubstep(targetSub, { scrollIntoView: false });
      });
    });

    document.querySelectorAll('[data-slide="4"] .ctrl-row').forEach((rowEl, rIdx) => {
      rowEl.addEventListener('click', () => {
        if (appState.isOverview || appState.currentSlide !== 4) return;
        clearChoreographyTimers();
        activateSubstep(rIdx === 0 ? 0 : 1, { scrollIntoView: false });
      });
    });

    // Speaker Notes ([S] or Notas button)
    const notesBtn = document.getElementById('notesToggleBtn');
    if (notesBtn) {
      notesBtn.addEventListener('click', () => {
        appState.showNotes = !appState.showNotes;
        syncSlidePresentation();
      });
    }

    // Blackout / Pause Overlay ([B] or [.])
    const blackoutEl = document.getElementById('deckBlackout');
    if (blackoutEl) {
      blackoutEl.addEventListener('click', () => {
        appState.isBlackout = false;
        syncSlidePresentation();
      });
    }

    // Fullscreen ([F] or Fullscreen button)
    const fullBtn = document.getElementById('fullscreenBtn');
    const toggleFullscreen = () => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen?.().catch(() => {});
      } else {
        document.exitFullscreen?.().catch(() => {});
      }
    };
    if (fullBtn) {
      fullBtn.addEventListener('click', toggleFullscreen);
    }

    // Keyboard Shortcuts (/web-presentation-pro standard)
    document.addEventListener('keydown', (e) => {
      const target = e.target;
      const tag = (target && target.tagName) || '';
      if (
        tag === 'INPUT' ||
        tag === 'TEXTAREA' ||
        tag === 'SELECT' ||
        (target && target.isContentEditable)
      ) {
        return;
      }

      if (e.key === ' ' && (tag === 'BUTTON' || tag === 'A')) {
        return;
      }

      if (e.key === 'b' || e.key === 'B' || e.key === '.') {
        e.preventDefault();
        appState.isBlackout = !appState.isBlackout;
        syncSlidePresentation();
        return;
      }

      if (appState.isBlackout && e.key === 'Escape') {
        e.preventDefault();
        appState.isBlackout = false;
        syncSlidePresentation();
        return;
      }

      if (e.key === ' ' && e.shiftKey) {
        e.preventDefault();
        stopAutoPlay();
        if (appState.isOverview) {
          goToSlide(SLIDES_META.length - 1);
        } else if (appState.currentSlide > 0) {
          goToSlide(appState.currentSlide - 1);
        }
      } else if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') {
        e.preventDefault();
        advanceOneButtonStep();
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        stopAutoPlay();
        if (appState.isOverview) {
          goToSlide(SLIDES_META.length - 1);
        } else if (appState.currentSlide > 0) {
          goToSlide(appState.currentSlide - 1);
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        stopAutoPlay();
        if (appState.isOverview) {
          appState.isOverview = false;
          syncSlidePresentation();
          runSlideChoreography();
        } else {
          enterOverviewStep();
        }
      } else if (e.key === 's' || e.key === 'S') {
        e.preventDefault();
        appState.showNotes = !appState.showNotes;
        syncSlidePresentation();
      } else if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        toggleFullscreen();
      } else if (e.key === 'p' || e.key === 'P') {
        e.preventDefault();
        toggleAutoPlay();
      } else if (e.key >= '1' && e.key <= '7') {
        stopAutoPlay();
        goToSlide(parseInt(e.key, 10) - 1);
      } else if (e.key === '8') {
        stopAutoPlay();
        enterOverviewStep();
      }
    });

    // Touch Swipe Navigation for mobile & tablet
    const stageEl = document.getElementById('deckStage');
    if (stageEl) {
      let touchStartX = 0;
      let touchStartY = 0;
      let ignoreTouch = false;

      stageEl.addEventListener(
        'touchstart',
        (e) => {
          if (appState.isOverview || appState.isBlackout) {
            ignoreTouch = true;
            return;
          }
          const t = e.target;
          if (t && t.closest && t.closest('input, button, a, .spei-table-wrap')) {
            ignoreTouch = true;
            return;
          }
          const touch = e.changedTouches && e.changedTouches[0];
          if (!touch) return;
          ignoreTouch = false;
          touchStartX = touch.clientX;
          touchStartY = touch.clientY;
        },
        { passive: true }
      );

      stageEl.addEventListener(
        'touchend',
        (e) => {
          if (ignoreTouch || appState.isOverview || appState.isBlackout) return;
          const touch = e.changedTouches && e.changedTouches[0];
          if (!touch) return;
          const dx = touch.clientX - touchStartX;
          const dy = touch.clientY - touchStartY;
          if (Math.abs(dx) >= 48 && Math.abs(dx) > Math.abs(dy) * 1.4) {
            if (dx < 0) {
              advanceOneButtonStep();
            } else if (dx > 0 && appState.currentSlide > 0) {
              stopAutoPlay();
              goToSlide(appState.currentSlide - 1);
            }
          }
        },
        { passive: true }
      );
    }

    // ProviderOrbit Quick View Switcher
    document.querySelectorAll('[data-view]').forEach((btn) => {
      btn.addEventListener('click', () => {
        stopAutoPlay();
        const v = btn.getAttribute('data-view');
        appState.activeView = v;
        if (v === 'orbs') goToSlide(2);
        else if (v === 'dials') goToSlide(3);
        else if (v === 'spei') goToSlide(5);
        else goToSlide(0);
      });
    });

    const themeBtn = document.getElementById('themeToggleBtn');
    if (themeBtn) {
      themeBtn.addEventListener('click', () => {
        document.documentElement.classList.toggle('dark');
        updateUI();
        ensureMasterLoopRunning();
      });
    }

    const resetBtn = document.getElementById('resetBtn');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        stopAutoPlay();
        const keepSlide = appState.currentSlide;
        manualMoodOverride = false;
        Object.assign(appState, DEFAULTS, { currentSlide: keepSlide });
        document.getElementById('contractGrossInput').value = DEFAULTS.contractGross;
        document.getElementById('chkOmarReimb').checked = DEFAULTS.chkOmarReimb;
        document.getElementById('inpOmarReimb').value = DEFAULTS.omarReimb;
        document.getElementById('chkMon30').checked = DEFAULTS.chkMon30;
        document.getElementById('inpMon30').value = DEFAULTS.mon30;
        document.getElementById('chkMon15').checked = DEFAULTS.chkMon15;
        document.getElementById('inpMon15').value = DEFAULTS.mon15;
        document.getElementById('chkViaticos').checked = DEFAULTS.chkViaticos;
        document.getElementById('inpViaticos').value = DEFAULTS.viaticos;
        document.getElementById('rngViaticos').value = DEFAULTS.viaticos;
        document.getElementById('inpIgualaGross').value = DEFAULTS.igualaGross;
        document.getElementById('inpAzure').value = DEFAULTS.azure;
        document.getElementById('inpClaude').value = DEFAULTS.claude;
        document.getElementById('inpGoogleAi').value = DEFAULTS.googleAi;
        updateUI(true);
      });
    }

    const csvBtn = document.getElementById('exportCsvBtn');
    if (csvBtn) {
      csvBtn.addEventListener('click', () => {
        const c = latestCalc;
        const n2 = (v) => (Number(v) || 0).toFixed(2);
        const lines = [
          ['Concepto', 'Regla / % Contrato', 'Hito 1 (40% = $30k Inv + $30k Socios)', 'Hito 2 (30% = 100% Socios)', 'Hito 3 (30% = 100% Socios)', 'Total Liquidado MXN'],
          ['Inversión y Caja MASTERIZE', '100% en H1 (20% Bruto)', n2(c.hitos.h1.caja), n2(c.hitos.h2.caja), n2(c.hitos.h3.caja), n2(c.hitos.total.caja)],
          ['Daniel — Socio Principal (50% Pool)', '35% Bruto', n2(c.partners.daniel.h1), n2(c.partners.daniel.h2), n2(c.partners.daniel.h3), n2(c.partners.daniel.total)],
          ['Omar — Socio Operativo (25% Pool)', '17.5% Bruto', n2(c.partners.omarPool.h1), n2(c.partners.omarPool.h2), n2(c.partners.omarPool.h3), n2(c.partners.omarPool.total)],
          ['Omar — Comisión Closer (10% Bruto)', '10% Bruto', n2(c.hitos.h1.closer), n2(c.hitos.h2.closer), n2(c.hitos.h3.closer), n2(c.hitos.total.closer)],
          ['Pedro — Socio Operativo (15% Pool)', '10.5% Bruto', n2(c.partners.pedro.h1), n2(c.partners.pedro.h2), n2(c.partners.pedro.h3), n2(c.partners.pedro.total)],
          ['Octavio — Socio Operativo (10% Pool)', '7% Bruto', n2(c.partners.octavio.h1), n2(c.partners.octavio.h2), n2(c.partners.octavio.h3), n2(c.partners.octavio.total)],
          ['TOTAL CONTRATO', '100%', n2(c.hitos.h1.gross), n2(c.hitos.h2.gross), n2(c.hitos.h3.gross), n2(c.gross)],
        ];
        const csvBody = '\uFEFF' + lines.map((row) => row.join(',')).join('\n');
        const csvContent = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvBody);
        const link = document.createElement('a');
        link.setAttribute('href', csvContent);
        link.setAttribute('download', 'MASTERIZE_ARTEPISA_SPEI.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      });
    }
  }

  function initApp() {
    voiceOrbEngine = initVoiceOrbEngine(() => appState, getEffectiveOrbMood);
    bindEvents();
    updateUI(true);
    runSlideChoreography();
    ensureMasterLoopRunning();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp, { once: true });
  } else {
    initApp();
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    calculateFinancials,
    buildOrbItems,
    buildSlideChoreography,
    emphasise,
    cycleAt,
    body,
    fmtShortK,
    stepSpringVel,
    spawnSplashDroplets,
    drawLiquidOrb,
    drawLiquidBar,
    renderInstrumentDial,
    renderBankSparkline,
    ORB_PALETTES,
    IDLE_DRIFT_STOPS,
    BUBBLE_SEEDS,
    LIQUID_GRAVITY,
    DEFAULTS,
    SLIDES_META,
  };
}

