import * as db from './db.js';

// À incrémenter à chaque publication (avec CACHE dans service-worker.js).
export const VERSION = '1.1.0';

export const DEFAULT_SETTINGS = {
  rest: 90,            // secondes
  incr: 2.5,           // kg
  sound: true,
  wakeLock: true,
  bar: 20,             // kg
  plates: [25, 20, 15, 10, 5, 2.5, 1.25],
  lastExport: 0,
  push: false,
};

export const state = {
  settings: { ...DEFAULT_SETTINGS },
  workouts: [],   // séances terminées, ordre chronologique
  templates: [],  // modèles de séance
  custom: [],     // exercices perso
  prefs: {},      // par exercice : { fav, rest, note }
  active: null,   // séance en cours
};

export const KEYS = ['settings', 'workouts', 'templates', 'custom', 'prefs', 'active'];

export async function load() {
  const data = await db.getMany(KEYS);
  for (const k of KEYS) if (data[k] !== undefined) state[k] = data[k];
  state.settings = { ...DEFAULT_SETTINGS, ...state.settings };
}

export function save(...keys) {
  const obj = {};
  for (const k of keys) obj[k] = state[k];
  return db.setMany(obj).catch(err => {
    console.error(err);
    alert("Erreur d'enregistrement : " + err);
  });
}

export function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

export function pref(exId) {
  return state.prefs[exId] || {};
}

export function setPref(exId, patch) {
  state.prefs[exId] = { ...pref(exId), ...patch };
  return save('prefs');
}
