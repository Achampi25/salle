// Onglet Séance : séance en cours, modèles, fin de séance.
import { state, save, uid, pref, setPref } from './store.js';
import { getEx, fieldLabels, profile, thumb } from './exercises.js';
import { actions, inputs, app, $, esc, fmt, mmss, fmtLong, fmtAgo, modal, sheetMenu, askConfirm, askText, keypad, toast } from './ui.js';
import { isRecord, lastSets, sessionStats, setText } from './stats.js';
import * as timer from './timer.js';
import { openPicker } from './exercises-view.js';
import { exDetail, workoutDetail } from './progress.js';

const newSet = () => ({ a: '', b: '', warm: false, done: false });
export const restFor = exId => pref(exId).rest ?? state.settings.rest;

/** Séries pré-remplies avec la dernière séance. n = nombre de séries de travail voulues (modèle). */
function prefill(exId, n) {
  const last = lastSets(exId);
  if (!last) return Array.from({ length: n || 3 }, newSet);
  const copy = s => ({ a: s.a, b: s.b, warm: !!s.warm, done: false });
  if (!n) return last.map(copy);
  const warm = last.filter(s => s.warm).map(copy);
  const work = last.filter(s => !s.warm);
  const tail = work[work.length - 1] || { a: '', b: '' };
  return [...warm, ...Array.from({ length: n }, (_, i) => copy({ ...(work[i] || tail), warm: false }))];
}

function start(tpl) {
  state.active = {
    id: uid(),
    start: Date.now(),
    title: tpl ? tpl.name : 'Séance',
    templateId: tpl?.id || null,
    note: '',
    items: tpl ? tpl.items.map(x => ({ exId: x.exId, sets: prefill(x.exId, x.n) })) : [],
    timer: null,
  };
  save('active');
  timer.updateWakeLock();
  app.render();
  window.scrollTo(0, 0);
  if (!tpl) addExercises();
}

function addExercises() {
  openPicker({
    onPick: ids => {
      for (const exId of ids) state.active.items.push({ exId, sets: prefill(exId) });
      save('active');
      app.render();
    },
  });
}

// ---------- Rendu ----------
export function render() {
  return state.active ? renderActive() : renderHome();
}

function renderHome() {
  const tpls = state.templates;
  const lastW = state.workouts[state.workouts.length - 1];
  const lastUse = id => {
    for (let i = state.workouts.length - 1; i >= 0; i--) if (state.workouts[i].templateId === id) return state.workouts[i].start;
    return null;
  };
  return `<div class="page">
    <h1>Séance</h1>
    <button class="btn primary big block" data-act="w-start">Démarrer une séance vide</button>
    <div class="page-head"><h2>Mes modèles</h2><button class="btn small" data-act="t-new">+ Nouveau</button></div>
    ${tpls.length ? tpls.map((t, k) => {
      const lu = lastUse(t.id);
      const names = t.items.map(x => getEx(x.exId).name);
      return `<div class="card tpl">
        <button class="tpl-main" data-act="t-start" data-k="${k}">
          <b>${esc(t.name)}</b>
          <small>${esc(names.slice(0, 4).join(', '))}${names.length > 4 ? '…' : ''}</small>
          <small class="muted">${t.items.length} exercice${t.items.length > 1 ? 's' : ''}${lu ? ` · ${fmtAgo(lu)}` : ''}</small>
        </button>
        <button class="icon" data-act="t-menu" data-k="${k}" aria-label="Options">⋯</button>
      </div>`;
    }).join('') : '<p class="muted">Crée un modèle (ex. « Push », « Jambes ») pour relancer une séance en un tap, avec les poids de la dernière fois.</p>'}
    ${lastW ? `<h2>Dernière séance</h2>
      <button class="card last-w" data-act="w-detail" data-id="${lastW.id}">
        <b>${esc(lastW.title)}</b> <span class="muted">· ${fmtAgo(lastW.start)} · ${fmtLong(lastW.end - lastW.start)}</span>
        <small>${esc(lastW.items.map(it => getEx(it.exId).name).join(', '))}</small>
      </button>` : ''}
  </div>`;
}

function renderActive() {
  const a = state.active;
  return `<div class="page">
    <div class="w-head">
      <button class="w-title" data-act="w-rename"><b>${esc(a.title)}</b><span id="w-elapsed">${mmss((Date.now() - a.start) / 1000)}</span></button>
      <button class="btn primary small" data-act="w-finish">Terminer</button>
    </div>
    ${a.items.map((it, i) => renderItem(it, i)).join('')}
    <button class="btn block" data-act="w-add">+ Ajouter un exercice</button>
    <textarea class="note" placeholder="Note de séance (facultatif)" data-input="w-note" rows="2">${esc(a.note)}</textarea>
    <button class="btn block danger-text" data-act="w-cancel">Abandonner la séance</button>
  </div>`;
}

function renderItem(it, i) {
  const ex = getEx(it.exId);
  const L = fieldLabels(ex);
  const last = lastSets(it.exId) || [];
  const note = pref(it.exId).note;
  let n = 0;
  const rows = it.sets.map((s, j) => {
    if (!s.warm) n++;
    const prev = last[j];
    const val = (v, f) => `<button class="val" data-act="w-edit" data-i="${i}" data-j="${j}" data-f="${f}">${v === '' ? `<span class="ph">${L[f]}</span>` : fmt(v)}</button>`;
    return `<div class="set ${s.done ? 'done' : ''} ${s.warm ? 'warm' : ''}">
      <button class="set-n" data-act="w-set-menu" data-i="${i}" data-j="${j}">${s.warm ? 'É' : n}</button>
      <button class="prev" data-act="w-prev" data-i="${i}" data-j="${j}">${prev ? esc(setText(ex, prev)) : '—'}</button>
      ${val(s.a, 0)}${val(s.b, 1)}
      <button class="chk" data-act="w-done" data-i="${i}" data-j="${j}" aria-label="Valider la série">${s.pr ? '🏆' : '✓'}</button>
    </div>`;
  }).join('');
  return `<section class="card ex-card">
    <div class="ex-head">
      <button class="ex-name" data-act="w-ex-info" data-i="${i}">${thumb(ex, 'sm')}<span>${esc(ex.name)}</span></button>
      <button class="icon" data-act="w-ex-menu" data-i="${i}" aria-label="Options">⋯</button>
    </div>
    ${note ? `<p class="ex-note">📝 ${esc(note)}</p>` : ''}
    <div class="set set-h"><span>Série</span><span>Précédent</span><span>${L[0]}</span><span>${L[1]}</span><span>⏱ ${mmss(restFor(it.exId))}</span></div>
    ${rows}
    <button class="btn small ghost add-set" data-act="w-set-add" data-i="${i}">+ Série</button>
  </section>`;
}

// ---------- Actions séance ----------
const at = el => {
  const i = +el.dataset.i, j = +el.dataset.j;
  const it = state.active.items[i];
  return { i, j, it, s: it?.sets[j], ex: it && getEx(it.exId) };
};

function setNumber(it, j) {
  return it.sets.slice(0, j + 1).filter(s => !s.warm).length;
}

function editSet(i, j, f) {
  const it = state.active.items[i], s = it.sets[j], ex = getEx(it.exId), p = profile(ex), L = fieldLabels(ex);
  keypad({
    title: `${ex.name} — ${s.warm ? 'échauffement' : `série ${setNumber(it, j)}`}`,
    fields: [
      { label: L[0], value: s.a, step: p === 'c' ? 0.5 : state.settings.incr, dec: true, plates: ex.equip === 'barre' && p === 'w' },
      { label: L[1], value: s.b, step: p === 't' ? 5 : 1, dec: p === 'c' },
    ],
    start: f,
    onDone: v => { s.a = v[0]; s.b = v[1]; save('active'); app.render(); },
    onValidate: s.done ? null : () => toggleDone(i, j),
  });
}

function toggleDone(i, j) {
  const a = state.active, it = a.items[i], s = it.sets[j], ex = getEx(it.exId), p = profile(ex);
  if (s.done) {
    s.done = false; s.pr = false;
    save('active'); app.render();
    return;
  }
  if (p === 'w' && !(+s.a > 0)) return editSet(i, j, 0);
  if (!(+s.b > 0)) return editSet(i, j, 1);
  if (s.a === '') s.a = 0;
  s.done = true;
  s.ts = Date.now();
  const others = a.items.filter(x => x.exId === it.exId).flatMap(x => x.sets).filter(x => x.done && x !== s);
  const rec = isRecord(ex, s, others);
  s.pr = !!rec;
  if (rec) toast(`🏆 Record ! ${rec.label} : ${fmt(rec.v)} ${rec.unit}`, 3200);
  const next = it.sets[j + 1];
  if (next && !next.done && next.a === '' && next.b === '') { next.a = s.a; next.b = s.b; }
  save('active');
  timer.startRest(restFor(it.exId), ex.name);
  app.render();
}

actions['w-start'] = () => start(null);
actions['w-add'] = () => addExercises();
actions['w-edit'] = el => { const { i, j } = at(el); editSet(i, j, +el.dataset.f); };
actions['w-done'] = el => { const { i, j } = at(el); toggleDone(i, j); };
actions['w-prev'] = el => {
  const { it, s } = at(el);
  const prev = (lastSets(it.exId) || [])[+el.dataset.j];
  if (!prev || s.done) return;
  s.a = prev.a; s.b = prev.b;
  save('active'); app.render();
};
actions['w-set-add'] = el => {
  const it = state.active.items[+el.dataset.i];
  const ref = it.sets[it.sets.length - 1];
  it.sets.push(ref ? { a: ref.a, b: ref.b, warm: false, done: false } : newSet());
  save('active'); app.render();
};
actions['w-set-menu'] = el => {
  const { it, j, s } = at(el);
  sheetMenu(s.warm ? 'Échauffement' : `Série ${setNumber(it, j)}`, [
    { label: "Série d'échauffement", on: s.warm, fn: () => { s.warm = !s.warm; s.pr = false; save('active'); app.render(); } },
    { label: 'Supprimer la série', danger: true, fn: () => { it.sets.splice(j, 1); save('active'); app.render(); } },
  ]);
};
actions['w-ex-info'] = el => exDetail(state.active.items[+el.dataset.i].exId);
actions['w-ex-menu'] = el => {
  const i = +el.dataset.i, items = state.active.items, it = items[i];
  const move = d => { items.splice(i + d, 0, items.splice(i, 1)[0]); save('active'); app.render(); };
  sheetMenu(getEx(it.exId).name, [
    { label: `Temps de repos : ${mmss(restFor(it.exId))}`, fn: () => restMenu(it.exId, () => app.render()) },
    { label: 'Historique et notes', fn: () => exDetail(it.exId) },
    i > 0 && { label: 'Monter', fn: () => move(-1) },
    i < items.length - 1 && { label: 'Descendre', fn: () => move(1) },
    { label: "Remplacer l'exercice", fn: () => openPicker({ multi: false, title: 'Remplacer par…', onPick: ([id]) => {
      it.exId = id;
      if (!it.sets.some(s => s.done)) it.sets = prefill(id);
      save('active'); app.render();
    } }) },
    { label: "Retirer l'exercice", danger: true, fn: async () => {
      if (it.sets.some(s => s.done) && !(await askConfirm('Des séries sont déjà validées. Retirer cet exercice ?', 'Retirer', true))) return;
      items.splice(i, 1); save('active'); app.render();
    } },
  ]);
};
actions['w-rename'] = async () => {
  const t = await askText('Nom de la séance', state.active.title);
  if (t) { state.active.title = t; save('active'); app.render(); }
};
actions['w-cancel'] = async () => {
  if (!(await askConfirm('Abandonner cette séance ? Rien ne sera enregistré.', 'Abandonner', true))) return;
  state.active = null;
  timer.clear();
  save('active');
  timer.updateWakeLock();
  app.render();
};
actions['w-finish'] = async () => {
  const a = state.active;
  const items = a.items
    .map(it => ({ exId: it.exId, sets: it.sets.filter(s => s.done).map(({ a: x, b, warm, pr }) => ({ a: x, b, warm, pr: !!pr })) }))
    .filter(it => it.sets.length);
  if (!items.length) {
    if (await askConfirm('Aucune série validée. Abandonner la séance ?', 'Abandonner', true)) {
      state.active = null; timer.clear(); save('active'); timer.updateWakeLock(); app.render();
    }
    return;
  }
  if (!(await askConfirm('Terminer la séance ? Les séries non validées seront ignorées.', 'Terminer'))) return;
  const w = { id: a.id, start: a.start, end: Date.now(), title: a.title, templateId: a.templateId, note: a.note.trim(), items };
  state.workouts.push(w);
  state.active = null;
  timer.clear();
  save('workouts', 'active');
  timer.updateWakeLock();
  app.render();
  window.scrollTo(0, 0);
  summary(w);
};

let noteTimer;
inputs['w-note'] = el => {
  state.active.note = el.value;
  clearTimeout(noteTimer);
  noteTimer = setTimeout(() => save('active'), 400);
};

export function restMenu(exId, after) {
  const cur = pref(exId).rest;
  const opts = [30, 45, 60, 90, 120, 150, 180, 240, 300];
  sheetMenu(`Repos — ${getEx(exId).name}`, [
    { label: `Par défaut (${mmss(state.settings.rest)})`, on: cur == null, fn: () => { setPref(exId, { rest: undefined }); after?.(); } },
    ...opts.map(v => ({ label: mmss(v), on: cur === v, fn: () => { setPref(exId, { rest: v }); after?.(); } })),
  ]);
}

// ---------- Résumé de fin ----------
function summary(w) {
  let sets = 0, vol = 0;
  const prs = [];
  for (const it of w.items) {
    const ex = getEx(it.exId), st = sessionStats(it.sets);
    sets += st.n;
    if (profile(ex) === 'w') vol += st.vol;
    for (const s of it.sets) if (s.pr) prs.push(`${ex.name} : ${setText(ex, s)}`);
  }
  const tpl = state.templates.find(t => t.id === w.templateId);
  const m = modal({
    title: 'Séance terminée 💪',
    cls: 'dialog',
    body: () => `<div class="tiles">
        <div class="tile"><small>Durée</small><b>${fmtLong(w.end - w.start)}</b></div>
        <div class="tile"><small>Séries</small><b>${sets}</b></div>
        <div class="tile"><small>Volume</small><b>${fmt(Math.round(vol))} kg</b></div>
      </div>
      ${prs.length ? `<h3 class="sec">🏆 Records</h3><ul class="plain">${prs.map(p => `<li>${esc(p)}</li>`).join('')}</ul>` : ''}`,
    footer: () => `${tpl
      ? '<button class="btn" data-act="upd">Mettre à jour le modèle</button>'
      : '<button class="btn" data-act="save-tpl">Enregistrer comme modèle</button>'}
      <button class="btn primary grow" data-act="__close">OK</button>`,
    actions: {
      'save-tpl': async () => { await saveAsTemplate(w); m.close(); },
      upd: () => { tpl.items = itemsToTemplate(w.items); save('templates'); toast('Modèle mis à jour'); m.close(); },
    },
  });
}

const itemsToTemplate = items => items.map(it => ({ exId: it.exId, n: Math.max(1, it.sets.filter(s => !s.warm).length) }));

export async function saveAsTemplate(w) {
  const name = await askText('Nom du modèle', w.title !== 'Séance' ? w.title : '', 'Ex. : Push, Jambes…');
  if (!name) return;
  state.templates.push({ id: uid(), name, items: itemsToTemplate(w.items) });
  save('templates');
  toast('Modèle enregistré');
  app.render();
}

// ---------- Modèles ----------
actions['t-start'] = el => start(state.templates[+el.dataset.k]);
actions['t-new'] = () => editTemplate(null);
actions['t-menu'] = el => {
  const k = +el.dataset.k, t = state.templates[k];
  sheetMenu(t.name, [
    { label: 'Modifier', fn: () => editTemplate(t) },
    { label: 'Dupliquer', fn: () => { state.templates.splice(k + 1, 0, { ...structuredClone(t), id: uid(), name: `${t.name} (copie)` }); save('templates'); app.render(); } },
    k > 0 && { label: 'Monter', fn: () => { state.templates.splice(k - 1, 0, state.templates.splice(k, 1)[0]); save('templates'); app.render(); } },
    { label: 'Supprimer', danger: true, fn: async () => {
      if (!(await askConfirm(`Supprimer le modèle « ${t.name} » ? L'historique est conservé.`, 'Supprimer', true))) return;
      state.templates.splice(k, 1); save('templates'); app.render();
    } },
  ]);
};
actions['w-detail'] = el => workoutDetail(el.dataset.id);

function editTemplate(tpl) {
  const d = { name: tpl?.name || '', items: tpl ? structuredClone(tpl.items) : [] };
  const m = modal({
    title: tpl ? 'Modifier le modèle' : 'Nouveau modèle',
    cls: 'full',
    body: () => `<label class="field">Nom<input class="text-in" name="tname" value="${esc(d.name)}" placeholder="Ex. : Push, Pull, Jambes…" maxlength="40"></label>
      <div class="list">${d.items.map((x, k) => `<div class="tpl-row">
        <span class="grow">${esc(getEx(x.exId).name)}</span>
        <span class="stepper"><button data-act="n" data-k="${k}" data-d="-1">−</button><b>${x.n}</b><button data-act="n" data-k="${k}" data-d="1">+</button></span>
        <button class="icon" data-act="mv" data-k="${k}" ${k === 0 ? 'disabled' : ''} aria-label="Monter">↑</button>
        <button class="icon" data-act="rm" data-k="${k}" aria-label="Retirer">✕</button>
      </div>`).join('')}</div>
      ${d.items.length ? '<p class="muted small">Chiffre = nombre de séries de travail.</p>' : ''}
      <button class="btn block" data-act="add">+ Ajouter des exercices</button>`,
    footer: () => '<button class="btn primary block" data-act="ok">Enregistrer</button>',
    actions: {
      n: el => { const x = d.items[+el.dataset.k]; x.n = Math.min(10, Math.max(1, x.n + +el.dataset.d)); keepName(); m.render(); },
      mv: el => { const k = +el.dataset.k; d.items.splice(k - 1, 0, d.items.splice(k, 1)[0]); keepName(); m.render(); },
      rm: el => { d.items.splice(+el.dataset.k, 1); keepName(); m.render(); },
      add: () => { keepName(); openPicker({ onPick: ids => { d.items.push(...ids.map(exId => ({ exId, n: 3 }))); m.render(); } }); },
      ok: () => {
        keepName();
        if (!d.name.trim()) { toast('Donne un nom au modèle'); return; }
        if (!d.items.length) { toast('Ajoute au moins un exercice'); return; }
        if (tpl) Object.assign(tpl, { name: d.name.trim(), items: d.items });
        else state.templates.push({ id: uid(), name: d.name.trim(), items: d.items });
        save('templates');
        m.close();
        app.render();
      },
    },
  });
  const keepName = () => { d.name = m.q('[name=tname]').value; };
}

// ---------- Init ----------
export function init() {
  setInterval(() => {
    const el = $('#w-elapsed');
    if (el && state.active) el.textContent = mmss((Date.now() - state.active.start) / 1000);
  }, 1000);
}
