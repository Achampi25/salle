// Onglet Réglages : préférences, disques, sauvegarde.
import { state, save, KEYS, VERSION, DEFAULT_SETTINGS } from './store.js';
import { actions, inputs, app, fmt, mmss, fmtDate, askConfirm, toast } from './ui.js';
import * as push from './push.js';

const ALL_PLATES = [25, 20, 15, 10, 5, 2.5, 2, 1.25, 1, 0.5];

export function render() {
  const s = state.settings;
  const toggle = (key, label, sub = '') => `<button class="row" data-act="st-toggle" data-k="${key}">
    <span>${label}${sub ? `<small>${sub}</small>` : ''}</span><span class="switch ${s[key] ? 'on' : ''}"><i></i></span></button>`;
  const daysSince = s.lastExport ? Math.floor((Date.now() - s.lastExport) / 864e5) : null;
  return `<div class="page">
    <h1>Réglages</h1>

    <h3 class="sec">Repos</h3>
    <div class="card">
      <div class="row static"><span>Repos par défaut</span>
        <span class="stepper"><button data-act="st-rest" data-d="-15">−</button><b>${mmss(s.rest)}</b><button data-act="st-rest" data-d="15">+</button></span></div>
      ${toggle('sound', 'Bip de fin de repos', 'Quand l’appli est ouverte')}
      ${toggle('wakeLock', 'Garder l’écran allumé', 'Pendant une séance')}
      ${push.settingsHTML()}
    </div>

    <h3 class="sec">Poids</h3>
    <div class="card">
      <div class="row static"><span>Incrément +/−</span>
        <span class="chips tight">${[1, 1.25, 2.5, 5].map(v => `<button class="chip ${s.incr === v ? 'on' : ''}" data-act="st-incr" data-v="${v}">${fmt(v)}</button>`).join('')}</span></div>
      <div class="row static"><span>Barre</span>
        <span class="chips tight">${[10, 15, 20].map(v => `<button class="chip ${s.bar === v ? 'on' : ''}" data-act="st-bar" data-v="${v}">${v} kg</button>`).join('')}</span></div>
      <div class="row static col"><span>Disques disponibles <small>Pour le calcul « par côté » des exercices à la barre</small></span>
        <span class="chips">${ALL_PLATES.map(v => `<button class="chip ${s.plates.includes(v) ? 'on' : ''}" data-act="st-plate" data-v="${v}">${fmt(v)}</button>`).join('')}</span></div>
    </div>

    <h3 class="sec">Sauvegarde</h3>
    <div class="card">
      <p class="small muted pad">Tes données restent sur ce téléphone. Exporte régulièrement une sauvegarde (Fichiers, iCloud Drive, mail…).
        ${daysSince == null ? '<br><b>Aucune sauvegarde pour l’instant.</b>' : `<br>Dernière sauvegarde : ${fmtDate(s.lastExport)}${daysSince > 30 ? ' — <b>pense à en refaire une.</b>' : ''}`}</p>
      <button class="row" data-act="st-export"><span>Exporter une sauvegarde</span><b>›</b></button>
      <label class="row"><span>Importer une sauvegarde</span><b>›</b>
        <input type="file" accept=".json,application/json" data-change="st-import" hidden></label>
    </div>

    <p class="muted small center">Salle v${VERSION} · ${state.workouts.length} séance(s) enregistrée(s)</p>
  </div>`;
}

actions['st-toggle'] = el => {
  const k = el.dataset.k;
  state.settings[k] = !state.settings[k];
  save('settings');
  app.render();
};
actions['st-rest'] = el => {
  state.settings.rest = Math.min(600, Math.max(15, state.settings.rest + +el.dataset.d));
  save('settings'); app.render();
};
actions['st-incr'] = el => { state.settings.incr = +el.dataset.v; save('settings'); app.render(); };
actions['st-bar'] = el => { state.settings.bar = +el.dataset.v; save('settings'); app.render(); };
actions['st-plate'] = el => {
  const v = +el.dataset.v, p = state.settings.plates;
  state.settings.plates = p.includes(v) ? p.filter(x => x !== v) : [...p, v].sort((a, b) => b - a);
  save('settings'); app.render();
};

actions['st-export'] = async () => {
  const data = { app: 'salle', format: 1, exportedAt: Date.now() };
  for (const k of KEYS) if (k !== 'active') data[k] = state[k];
  // L'abonnement aux notifications reste sur le téléphone (pas dans les sauvegardes).
  data.settings = { ...data.settings, push: false, pushSub: undefined };
  const name = `salle-sauvegarde-${new Date().toISOString().slice(0, 10)}.json`;
  const file = new File([JSON.stringify(data)], name, { type: 'application/json' });
  const done = () => { state.settings.lastExport = Date.now(); save('settings'); app.render(); toast('Sauvegarde exportée'); };
  if (navigator.canShare?.({ files: [file] })) {
    try { await navigator.share({ files: [file], title: 'Sauvegarde Salle' }); done(); return; }
    catch (e) { if (e.name === 'AbortError') return; }
  }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(file);
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  done();
};

inputs['st-import'] = async el => {
  const file = el.files?.[0];
  el.value = '';
  if (!file) return;
  let data;
  try { data = JSON.parse(await file.text()); } catch { toast('Fichier illisible'); return; }
  if (data?.app !== 'salle' || !Array.isArray(data.workouts)) { toast('Ce fichier n’est pas une sauvegarde Salle'); return; }
  const msg = `Remplacer toutes les données actuelles par la sauvegarde du ${fmtDate(data.exportedAt)} (${data.workouts.length} séances) ?`;
  if (!(await askConfirm(msg, 'Remplacer', true))) return;
  state.settings = { ...DEFAULT_SETTINGS, ...(data.settings || {}), push: false };
  state.workouts = data.workouts;
  state.templates = data.templates || [];
  state.custom = data.custom || [];
  state.prefs = data.prefs || {};
  await save('settings', 'workouts', 'templates', 'custom', 'prefs');
  app.render();
  toast('Sauvegarde importée');
};
