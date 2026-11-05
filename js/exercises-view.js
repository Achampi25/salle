// Onglet Exercices + sélecteur d'exercices + création d'exercices perso.
import { state, save, uid, pref } from './store.js';
import { MUSCLES, EQUIP, KINDS, allExercises, getEx } from './exercises.js';
import { actions, inputs, app, $, esc, norm, fmtAgo, modal, askConfirm, toast } from './ui.js';
import { lastMap } from './stats.js';
import { exDetail } from './progress.js';

let q = '';
let muscle = '';

function searchBar(prefix, query, mus) {
  return `<div class="search"><input type="search" placeholder="Rechercher un exercice…" value="${esc(query)}"
      data-input="${prefix}-q" autocomplete="off" autocorrect="off" spellcheck="false"></div>
    <div class="chips">${Object.entries(MUSCLES).map(([k, v]) =>
      `<button class="chip ${k === mus ? 'on' : ''}" data-act="${prefix}-muscle" data-m="${k}">${v}</button>`).join('')}</div>`;
}

/** Liste filtrée. mode : 'browse' | 'pick'. */
function listHTML({ query, mus, mode, selected = [] }) {
  const last = lastMap();
  const tokens = norm(query).split(/\s+/).filter(Boolean);
  const list = allExercises().filter(e => !e.hidden
    && (!mus || e.muscle === mus)
    && tokens.every(t => norm(`${e.name} ${MUSCLES[e.muscle]} ${EQUIP[e.equip]}`).includes(t)));

  const item = e => {
    const sel = selected.includes(e.id);
    const l = last[e.id];
    const lastTxt = l ? ` · ${fmtAgo(l.date)}` : '';
    const fav = pref(e.id).fav;
    return `<button class="ex-item ${sel ? 'sel' : ''}" data-act="${mode === 'pick' ? 'pk-toggle' : 'exv-open'}" data-id="${e.id}">
      <span class="ex-txt"><b>${esc(e.name)}</b><small>${MUSCLES[e.muscle] || ''} · ${EQUIP[e.equip] || ''}${lastTxt}</small></span>
      ${mode === 'pick' ? `<span class="tick">${sel ? '✓' : ''}</span>` : (fav ? '<span class="star">★</span>' : '')}
    </button>`;
  };

  if (!list.length) return '<p class="muted center">Aucun exercice trouvé.</p>';
  const byName = (a, b) => a.name.localeCompare(b.name, 'fr');
  if (tokens.length || mus) {
    // Les noms qui commencent par le texte cherché d'abord.
    const rank = e => (tokens.length && norm(e.name).startsWith(tokens[0]) ? 0 : 1);
    return `<div class="list">${list.sort((a, b) => rank(a) - rank(b) || byName(a, b)).map(item).join('')}</div>`;
  }

  let html = '';
  const favs = list.filter(e => pref(e.id).fav).sort(byName);
  if (favs.length) html += `<h3 class="sec">Favoris</h3><div class="list">${favs.map(item).join('')}</div>`;
  if (mode === 'pick') {
    const recent = list.filter(e => last[e.id] && !pref(e.id).fav)
      .sort((a, b) => last[b.id].date - last[a.id].date).slice(0, 8);
    if (recent.length) html += `<h3 class="sec">Récents</h3><div class="list">${recent.map(item).join('')}</div>`;
  }
  for (const [k, label] of Object.entries(MUSCLES)) {
    const group = list.filter(e => e.muscle === k).sort(byName);
    if (group.length) html += `<h3 class="sec">${label}</h3><div class="list">${group.map(item).join('')}</div>`;
  }
  return html;
}

// ---------- Onglet ----------
export function render() {
  return `<div class="page">
    <div class="page-head"><h1>Exercices</h1><button class="btn small" data-act="exv-new">+ Créer</button></div>
    ${searchBar('exv', q, muscle)}
    <div id="exv-list">${listHTML({ query: q, mus: muscle, mode: 'browse' })}</div>
  </div>`;
}

inputs['exv-q'] = el => { q = el.value; $('#exv-list').innerHTML = listHTML({ query: q, mus: muscle, mode: 'browse' }); };
actions['exv-muscle'] = el => { muscle = muscle === el.dataset.m ? '' : el.dataset.m; app.render(); };
actions['exv-open'] = el => exDetail(el.dataset.id);
actions['exv-new'] = () => editCustom(null, () => app.render());

// ---------- Sélecteur ----------
export function openPicker({ multi = true, title = 'Ajouter des exercices', onPick }) {
  let sel = [];
  let pq = '';
  let pm = '';
  const refreshList = () => { m.q('#pk-list').innerHTML = listHTML({ query: pq, mus: pm, mode: 'pick', selected: sel }); };
  const m = modal({
    title,
    cls: 'full',
    body: () => `${searchBar('pk', pq, pm)}
      <div id="pk-list">${listHTML({ query: pq, mus: pm, mode: 'pick', selected: sel })}</div>
      <button class="btn block ghost" data-act="pk-create">+ Créer un exercice</button>`,
    footer: () => (sel.length ? `<button class="btn primary block" data-act="pk-done">Ajouter (${sel.length})</button>` : ''),
    actions: {
      'pk-toggle': el => {
        const id = el.dataset.id;
        if (!multi) { m.close(); onPick([id]); return; }
        sel = sel.includes(id) ? sel.filter(x => x !== id) : [...sel, id];
        refreshList();
        m.renderFooter();
      },
      'pk-done': () => { m.close(); onPick(sel); },
      'pk-muscle': el => { pm = pm === el.dataset.m ? '' : el.dataset.m; m.render(); },
      'pk-create': () => editCustom(null, ex => {
        if (!multi) { m.close(); onPick([ex.id]); return; }
        sel.push(ex.id);
        m.render();
      }),
    },
    inputs: { 'pk-q': el => { pq = el.value; refreshList(); } },
  });
  return m;
}

// ---------- Exercice perso ----------
export function editCustom(exId, onSaved) {
  const ex = exId ? getEx(exId) : null;
  const d = { name: ex?.name || '', muscle: ex?.muscle || 'pecs', equip: ex?.equip || 'machine', kind: ex?.kind || 'w' };
  const opts = (obj, cur) => Object.entries(obj).map(([k, v]) => `<option value="${k}" ${k === cur ? 'selected' : ''}>${v}</option>`).join('');
  const m = modal({
    title: ex ? "Modifier l'exercice" : 'Nouvel exercice',
    cls: 'dialog',
    body: () => `<label class="field">Nom<input class="text-in" name="name" value="${esc(d.name)}" maxlength="60" placeholder="Ex. : Développé machine Hammer"></label>
      <label class="field">Muscle<select name="muscle">${opts(MUSCLES, d.muscle)}</select></label>
      <label class="field">Matériel<select name="equip">${opts(EQUIP, d.equip)}</select></label>
      <label class="field">Saisie<select name="kind">${opts(KINDS, d.kind)}</select></label>`,
    footer: () => `${ex ? '<button class="btn danger-text" data-act="del">Supprimer</button>' : ''}<button class="btn primary grow" data-act="ok">Enregistrer</button>`,
    actions: {
      ok: () => {
        const f = n => m.q(`[name=${n}]`).value;
        const name = f('name').trim();
        if (!name) { toast('Donne un nom à l’exercice'); return; }
        const data = { name, muscle: f('muscle'), equip: f('equip'), kind: f('kind') };
        let saved;
        if (ex) { Object.assign(ex, data); saved = ex; }
        else { saved = { id: `c-${uid()}`, custom: true, ...data }; state.custom.push(saved); }
        save('custom');
        m.close();
        onSaved?.(saved);
      },
      del: async () => {
        const used = state.workouts.some(w => w.items.some(it => it.exId === ex.id));
        const msg = used ? 'Cet exercice a un historique : il sera masqué de la liste mais ton historique est conservé.' : 'Supprimer cet exercice ?';
        if (!(await askConfirm(msg, 'Supprimer', true))) return;
        if (used) ex.hidden = true;
        else state.custom = state.custom.filter(e => e.id !== ex.id);
        save('custom');
        m.close();
        onSaved?.(null);
      },
    },
  });
  if (!ex) setTimeout(() => m.q('[name=name]').focus(), 80);
}
