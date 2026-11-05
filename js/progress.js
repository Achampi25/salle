// Onglet Progrès + fiche exercice + détail d'une séance.
import { state, save, pref, setPref } from './store.js';
import { getEx, profile, fieldLabels, MUSCLES, EQUIP, demo, thumb } from './exercises.js';
import { actions, inputs, app, esc, fmt, mmss, fmtDate, fmtLong, fmtAgo, dayKey, modal, sheetMenu, askConfirm, keypad, toast } from './ui.js';
import { METRICS, history, sessionStats, setText, lineChart, sparkline } from './stats.js';

let seg = 'ex';

// ---------- Onglet ----------
export function render() {
  const ws = state.workouts;
  const now = new Date();
  const weekStart = new Date(now); weekStart.setHours(0, 0, 0, 0); weekStart.setDate(weekStart.getDate() - ((weekStart.getDay() + 6) % 7));
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const count = from => ws.filter(w => w.start >= from.getTime()).length;
  return `<div class="page">
    <h1>Progrès</h1>
    <div class="tiles">
      <div class="tile"><small>Cette semaine</small><b>${count(weekStart)}</b></div>
      <div class="tile"><small>Ce mois</small><b>${count(monthStart)}</b></div>
      <div class="tile"><small>Total</small><b>${ws.length}</b></div>
    </div>
    ${heatmap()}
    <div class="seg">
      <button class="${seg === 'ex' ? 'on' : ''}" data-act="pg-seg" data-s="ex">Exercices</button>
      <button class="${seg === 'hist' ? 'on' : ''}" data-act="pg-seg" data-s="hist">Historique</button>
    </div>
    ${ws.length ? (seg === 'ex' ? exList() : histList()) : '<p class="muted center">Termine ta première séance pour voir tes progrès ici.</p>'}
  </div>`;
}

function heatmap() {
  const WEEKS = 17, C = 13, G = 3;
  const days = new Set(state.workouts.map(w => dayKey(w.start)));
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const start = new Date(today);
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7) - (WEEKS - 1) * 7);
  let cells = '';
  for (let w = 0; w < WEEKS; w++) {
    for (let d = 0; d < 7; d++) {
      const day = new Date(start); day.setDate(start.getDate() + w * 7 + d);
      if (day > today) continue;
      const on = days.has(dayKey(day.getTime()));
      cells += `<rect x="${w * (C + G)}" y="${d * (C + G)}" width="${C}" height="${C}" rx="3" class="${on ? 'on' : ''}"/>`;
    }
  }
  return `<div class="card heat"><small class="muted">${WEEKS} dernières semaines</small>
    <svg viewBox="0 0 ${WEEKS * (C + G) - G} ${7 * (C + G) - G}">${cells}</svg></div>`;
}

function exList() {
  const map = {};
  for (const w of state.workouts) for (const it of w.items) (map[it.exId] ||= []).push({ date: w.start, sets: it.sets });
  const rows = Object.entries(map).sort((a, b) => b[1].at(-1).date - a[1].at(-1).date);
  return `<div class="list">${rows.map(([exId, h]) => {
    const ex = getEx(exId), m = METRICS[profile(ex)][0];
    const vals = h.map(x => sessionStats(x.sets)[m.k]).filter(v => v > 0);
    const best = vals.length ? Math.max(...vals) : 0;
    return `<button class="ex-item" data-act="pg-ex" data-id="${exId}">
      ${thumb(ex)}
      <span class="ex-txt"><b>${esc(ex.name)}</b><small>${h.length} séance${h.length > 1 ? 's' : ''} · ${fmtAgo(h.at(-1).date)}</small></span>
      <span class="ex-best">${sparkline(vals.slice(-12))}<small>${m.label}</small><b>${fmt(best, 1)} ${m.unit}</b></span>
    </button>`;
  }).join('')}</div>`;
}

function histList() {
  let html = '', month = '';
  for (const w of [...state.workouts].reverse()) {
    const mo = fmtDate(w.start, { month: 'long', year: 'numeric' });
    if (mo !== month) { month = mo; html += `<h3 class="sec">${mo}</h3>`; }
    const prs = w.items.reduce((t, it) => t + it.sets.filter(s => s.pr).length, 0);
    html += `<button class="card hist-item" data-act="pg-w" data-id="${w.id}">
      <div><b>${esc(w.title)}</b> <span class="muted">· ${fmtDate(w.start)}</span></div>
      <small>${fmtLong(w.end - w.start)} · ${w.items.length} exercice${w.items.length > 1 ? 's' : ''}${prs ? ` · 🏆 ${prs}` : ''}</small>
      <small class="muted">${esc(w.items.map(it => getEx(it.exId).name).join(', '))}</small>
    </button>`;
  }
  return html;
}

actions['pg-seg'] = el => { seg = el.dataset.s; app.render(); };
actions['pg-ex'] = el => exDetail(el.dataset.id);
actions['pg-w'] = el => workoutDetail(el.dataset.id);

// ---------- Fiche exercice ----------
const metricSel = {};

export function exDetail(exId) {
  const ex = getEx(exId);
  const metrics = METRICS[profile(ex)];
  let noteTimer;
  const m = modal({
    title: () => ex.name,
    cls: 'full',
    right: () => `<button class="icon star-btn ${pref(exId).fav ? 'on' : ''}" data-act="fav" aria-label="Favori">${pref(exId).fav ? '★' : '☆'}</button>`,
    body: () => {
      const h = history(exId);
      const k = metricSel[exId] || metrics[0].k;
      const meta = metrics.find(x => x.k === k);
      const pts = h.map(x => ({ x: x.date, y: sessionStats(x.sets)[k] })).filter(p => p.y > 0);
      const best = key => Math.max(0, ...h.map(x => sessionStats(x.sets)[key]));
      return `${demo(ex)}<p class="muted">${MUSCLES[ex.muscle] || ''} · ${EQUIP[ex.equip] || ''}</p>
        ${h.length ? `<div class="tiles">
          ${metrics.slice(0, 2).map(x => `<div class="tile"><small>${x.label}</small><b>${fmt(best(x.k), 1)} ${x.unit}</b></div>`).join('')}
          <div class="tile"><small>Séances</small><b>${h.length}</b></div>
        </div>
        <div class="chips">${metrics.map(x => `<button class="chip ${x.k === k ? 'on' : ''}" data-act="metric" data-k="${x.k}">${x.label}</button>`).join('')}</div>
        <div class="card">${lineChart(pts, meta.unit)}</div>` : '<p class="muted">Pas encore d’historique pour cet exercice.</p>'}
        <button class="row" data-act="rest"><span>Temps de repos</span><b>${mmss(pref(exId).rest ?? state.settings.rest)} ›</b></button>
        <label class="field">Notes (réglages machine, consignes…)
          <textarea class="note" data-input="note" rows="2" placeholder="Ex. : siège cran 4, prise large">${esc(pref(exId).note || '')}</textarea></label>
        ${h.length ? `<h3 class="sec">Historique</h3>
          ${[...h].reverse().map(x => `<div class="hist-row"><span class="muted">${fmtDate(x.date)}</span>
            <span>${x.sets.map(s => `<span class="${s.warm ? 'muted' : ''}">${s.pr ? '🏆' : ''}${esc(setText(ex, s))}</span>`).join(' · ')}</span></div>`).join('')}` : ''}
        ${ex.custom ? '<button class="btn block" data-act="edit">Modifier l’exercice</button>' : ''}`;
    },
    actions: {
      fav: () => { setPref(exId, { fav: !pref(exId).fav }); m.render(); app.render(); },
      metric: el => { metricSel[exId] = el.dataset.k; m.render(); },
      rest: () => import('./workout.js').then(w => w.restMenu(exId, () => { m.render(); app.render(); })),
      edit: () => import('./exercises-view.js').then(v => v.editCustom(exId, saved => { if (!saved) m.close(); else m.render(); app.render(); })),
    },
    inputs: {
      note: el => {
        clearTimeout(noteTimer);
        noteTimer = setTimeout(() => { setPref(exId, { note: el.value.trim() }); if (state.active) app.render(); }, 400);
      },
    },
  });
}

// ---------- Détail d'une séance (consultable et modifiable) ----------
export function workoutDetail(wid) {
  const w = state.workouts.find(x => x.id === wid);
  if (!w) return;
  const m = modal({
    title: () => w.title,
    cls: 'full',
    body: () => `<p class="muted">${fmtDate(w.start, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        · ${new Date(w.start).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} · ${fmtLong(w.end - w.start)}</p>
      ${w.note ? `<p class="ex-note">📝 ${esc(w.note)}</p>` : ''}
      ${w.items.map((it, i) => {
        const ex = getEx(it.exId);
        let n = 0;
        return `<section class="card"><b>${esc(ex.name)}</b>
          ${it.sets.map((s, j) => `<button class="hist-set" data-act="set" data-i="${i}" data-j="${j}">
            <span class="muted">${s.warm ? 'É' : ++n}</span><span>${esc(setText(ex, s))}</span><span>${s.pr ? '🏆' : ''}</span></button>`).join('')}
        </section>`;
      }).join('')}
      <p class="muted small">Touche une série pour la corriger.</p>`,
    footer: () => `<button class="btn danger-text" data-act="del">Supprimer</button>
      <button class="btn grow" data-act="tpl">Enregistrer comme modèle</button>`,
    actions: {
      set: el => {
        const it = w.items[+el.dataset.i], s = it.sets[+el.dataset.j], ex = getEx(it.exId), L = fieldLabels(ex), p = profile(ex);
        sheetMenu(ex.name, [
          { label: 'Modifier', fn: () => keypad({
            title: ex.name,
            fields: [
              { label: L[0], value: s.a, step: p === 'c' ? 0.5 : state.settings.incr, dec: true },
              { label: L[1], value: s.b, step: p === 't' ? 5 : 1, dec: p === 'c' },
            ],
            onDone: v => { s.a = v[0] === '' ? 0 : v[0]; s.b = v[1] === '' ? 0 : v[1]; save('workouts'); m.render(); app.render(); },
          }) },
          { label: "Série d'échauffement", on: s.warm, fn: () => { s.warm = !s.warm; save('workouts'); m.render(); } },
          { label: 'Supprimer la série', danger: true, fn: () => {
            it.sets.splice(+el.dataset.j, 1);
            if (!it.sets.length) w.items.splice(+el.dataset.i, 1);
            save('workouts'); m.render(); app.render();
          } },
        ]);
      },
      del: async () => {
        if (!(await askConfirm('Supprimer définitivement cette séance de ton historique ?', 'Supprimer', true))) return;
        state.workouts = state.workouts.filter(x => x.id !== w.id);
        save('workouts');
        m.close();
        app.render();
        toast('Séance supprimée');
      },
      tpl: () => import('./workout.js').then(x => x.saveAsTemplate(w)),
    },
  });
}
