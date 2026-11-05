// Calculs de performance : 1RM estimé, records, historique, graphiques SVG.
import { state } from './store.js';
import { profile } from './exercises.js';
import { fmt, fmtDate } from './ui.js';

const num = v => +v || 0;

/** 1RM estimé (formule d'Epley). */
export const e1rm = (a, b) => (a > 0 && b > 0 ? (b === 1 ? a : a * (1 + b / 30)) : 0);

export const METRICS = {
  w: [{ k: 'e1rm', label: '1RM estimé', unit: 'kg' }, { k: 'maxA', label: 'Poids max', unit: 'kg' }, { k: 'vol', label: 'Volume', unit: 'kg' }],
  pdc: [{ k: 'maxB', label: 'Reps max', unit: 'reps' }, { k: 'totB', label: 'Reps totales', unit: 'reps' }, { k: 'maxA', label: 'Lest max', unit: 'kg' }],
  t: [{ k: 'maxB', label: 'Durée max', unit: 's' }, { k: 'maxA', label: 'Lest max', unit: 'kg' }],
  c: [{ k: 'maxA', label: 'Distance', unit: 'km' }, { k: 'totB', label: 'Durée', unit: 'min' }],
};

const PR_KEYS = { w: ['e1rm', 'maxA'], pdc: ['maxB', 'maxA'], t: ['maxB'], c: ['maxA'] };
const SET_VAL = { e1rm: s => e1rm(num(s.a), num(s.b)), maxA: s => num(s.a), maxB: s => num(s.b) };

export function sessionStats(sets) {
  const w = sets.filter(s => !s.warm);
  const max = arr => (arr.length ? Math.max(...arr) : 0);
  return {
    e1rm: Math.round(max(w.map(SET_VAL.e1rm)) * 10) / 10,
    maxA: max(w.map(SET_VAL.maxA)),
    maxB: max(w.map(SET_VAL.maxB)),
    vol: w.reduce((t, s) => t + num(s.a) * num(s.b), 0),
    totB: w.reduce((t, s) => t + num(s.b), 0),
    n: w.length,
  };
}

/** Historique d'un exercice, du plus ancien au plus récent. */
export function history(exId) {
  const out = [];
  for (const w of state.workouts) {
    for (const it of w.items) if (it.exId === exId) out.push({ date: w.start, wid: w.id, sets: it.sets });
  }
  return out.sort((x, y) => x.date - y.date);
}

/** Séries de la dernière séance contenant cet exercice (ou null). */
export function lastSets(exId) {
  for (let i = state.workouts.length - 1; i >= 0; i--) {
    const it = state.workouts[i].items.find(x => x.exId === exId);
    if (it) return it.sets;
  }
  return null;
}

/** Map exId -> { date, sets } de la dernière séance, calculée en une passe. */
export function lastMap() {
  const map = {};
  for (const w of state.workouts) for (const it of w.items) map[it.exId] = { date: w.start, sets: it.sets };
  return map;
}

/** Renvoie {label, v, unit} si la série bat un record, sinon null. */
export function isRecord(ex, set, otherSets = []) {
  if (set.warm) return null;
  const hist = history(ex.id);
  if (!hist.length) return null; // première fois : pas de record
  const prev = [...hist.flatMap(h => h.sets), ...otherSets].filter(s => !s.warm);
  const p = profile(ex);
  for (const k of PR_KEYS[p]) {
    const v = SET_VAL[k](set);
    const best = prev.reduce((m, s) => Math.max(m, SET_VAL[k](s)), 0);
    if (v > 0 && v > best + 1e-9) {
      const meta = METRICS[p].find(x => x.k === k);
      return { label: meta.label, v: Math.round(v * 10) / 10, unit: meta.unit };
    }
  }
  return null;
}

/** Texte court d'une série : « 80×8 », « +10×12 », « 45 s », « 5 km · 30 min ». */
export function setText(ex, s) {
  const a = num(s.a), b = num(s.b);
  switch (profile(ex)) {
    case 'pdc': return a > 0 ? `+${fmt(a)}×${fmt(b)}` : `${fmt(b)} reps`;
    case 't': return (a > 0 ? `+${fmt(a)} kg · ` : '') + `${fmt(b)} s`;
    case 'c': return (a > 0 ? `${fmt(a)} km · ` : '') + `${fmt(b)} min`;
    default: return `${fmt(a)}×${fmt(b)}`;
  }
}

// ---------- Graphiques ----------
export function lineChart(pts, unit = '') {
  if (!pts.length) return '<p class="muted center">Pas encore de données.</p>';
  const W = 340, H = 170, pl = 40, pr = 14, pt = 16, pb = 24;
  const xs = pts.map(p => p.x), ys = pts.map(p => p.y);
  let x0 = Math.min(...xs), x1 = Math.max(...xs);
  if (x0 === x1) { x0 -= 864e5; x1 += 864e5; }
  let y0 = Math.min(...ys), y1 = Math.max(...ys);
  const pad = (y1 - y0) * 0.15 || Math.max(1, y1 * 0.1);
  y0 = Math.max(0, y0 - pad); y1 += pad;
  const X = x => pl + ((x - x0) / (x1 - x0)) * (W - pl - pr);
  const Y = y => pt + (1 - (y - y0) / (y1 - y0)) * (H - pt - pb);
  let g = '';
  for (let k = 0; k <= 2; k++) {
    const v = y0 + ((y1 - y0) * k) / 2, y = Y(v).toFixed(1);
    g += `<line class="grid" x1="${pl}" x2="${W - pr}" y1="${y}" y2="${y}"/><text x="${pl - 6}" y="${y}" dy="3" text-anchor="end">${fmt(Math.round(v))}</text>`;
  }
  const d = pts.map((p, i) => `${i ? 'L' : 'M'}${X(p.x).toFixed(1)},${Y(p.y).toFixed(1)}`).join('');
  const dots = pts.map(p => `<circle class="dot" cx="${X(p.x).toFixed(1)}" cy="${Y(p.y).toFixed(1)}" r="3"/>`).join('');
  const last = pts[pts.length - 1];
  const short = ts => fmtDate(ts, { day: 'numeric', month: 'short' });
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Graphique de progression">
    ${g}<path class="line" d="${d}"/>${dots}
    <circle class="dot last" cx="${X(last.x).toFixed(1)}" cy="${Y(last.y).toFixed(1)}" r="5"/>
    <text x="${pl}" y="${H - 6}">${short(pts[0].x)}</text>
    <text x="${W - pr}" y="${H - 6}" text-anchor="end">${short(last.x)}</text>
  </svg>`;
}

export function sparkline(values) {
  if (values.length < 2) return '';
  const W = 64, H = 22, min = Math.min(...values), max = Math.max(...values), r = max - min || 1;
  const pts = values.map((v, i) => `${((i / (values.length - 1)) * W).toFixed(1)},${(H - 2 - ((v - min) / r) * (H - 4)).toFixed(1)}`).join(' ');
  return `<svg class="spark" viewBox="0 0 ${W} ${H}"><polyline points="${pts}"/></svg>`;
}
