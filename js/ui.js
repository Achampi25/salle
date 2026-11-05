// Outils d'interface : délégation d'événements, modales, clavier numérique, toasts.
import { state } from './store.js';

export const actions = {};   // data-act="nom"   -> fn(el, event)
export const inputs = {};    // data-input="nom" -> fn(el, event)
export const app = { tab: 'workout', render() {} };

export const $ = (sel, root = document) => root.querySelector(sel);

export function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

export function fmt(n, d = 2) {
  if (n === '' || n == null || Number.isNaN(+n)) return '';
  return Number(n).toLocaleString('fr-FR', { maximumFractionDigits: d });
}

export function mmss(sec) {
  sec = Math.max(0, Math.round(sec));
  const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60;
  const ss = String(s).padStart(2, '0');
  return h ? `${h}:${String(m).padStart(2, '0')}:${ss}` : `${m}:${ss}`;
}

export function fmtLong(ms) {
  const min = Math.round(ms / 60000);
  if (min < 60) return `${min} min`;
  return `${Math.floor(min / 60)} h ${String(min % 60).padStart(2, '0')}`;
}

export function fmtDate(ts, opts = { weekday: 'short', day: 'numeric', month: 'short' }) {
  return new Date(ts).toLocaleDateString('fr-FR', opts);
}

export function dayKey(ts) {
  const d = new Date(ts);
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

export function fmtAgo(ts) {
  const start = d => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x.getTime(); };
  const days = Math.round((start(Date.now()) - start(ts)) / 864e5);
  if (days <= 0) return "aujourd'hui";
  if (days === 1) return 'hier';
  if (days < 14) return `il y a ${days} j`;
  if (days < 60) return `il y a ${Math.round(days / 7)} sem.`;
  return fmtDate(ts, { day: 'numeric', month: 'short', year: 'numeric' });
}

export const norm = s => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

// ---------- Délégation d'événements ----------
function dispatch(attr, registry, modalKey) {
  return e => {
    const t = e.target.closest(`[${attr}]`);
    if (!t) return;
    const name = t.getAttribute(attr);
    const mEl = t.closest('.modal');
    const fn = (mEl && mEl._m && mEl._m[modalKey][name]) || registry[name];
    if (fn) fn(t, e);
  };
}
document.addEventListener('click', dispatch('data-act', actions, 'actions'));
document.addEventListener('input', dispatch('data-input', inputs, 'inputs'));
document.addEventListener('change', dispatch('data-change', inputs, 'inputs'));

// ---------- Toast ----------
let toastTimer;
export function toast(msg, ms = 2400) {
  const el = $('#toast');
  el.textContent = msg;
  el.hidden = false;
  el.classList.remove('show');
  void el.offsetWidth;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.hidden = true; }, ms);
}

// ---------- Modales ----------
const stack = [];

/**
 * Ouvre une modale (feuille qui monte du bas).
 * body/footer/right : fonctions qui renvoient du HTML (re-exécutées par m.render()).
 */
export function modal({ title = '', body = () => '', footer = null, right = null, cls = '', actions: acts = {}, inputs: inps = {}, onClose = null }) {
  const el = document.createElement('div');
  el.className = `modal ${cls}`;
  el.innerHTML = `<div class="backdrop" data-act="__close"></div>
    <div class="sheet" role="dialog" aria-modal="true">
      <header class="m-head"><button class="icon" data-act="__close" aria-label="Fermer">✕</button><h2></h2><div class="m-right"></div></header>
      <div class="m-body"></div>
      <footer class="m-foot"></footer>
    </div>`;
  const q = s => el.querySelector(s);
  const m = {
    el,
    actions: { ...acts, __close: () => m.close() },
    inputs: inps,
    closed: false,
    render() {
      const b = q('.m-body');
      const y = b.scrollTop;
      q('h2').textContent = typeof title === 'function' ? title() : title;
      q('.m-right').innerHTML = right ? right() : '';
      b.innerHTML = body();
      m.renderFooter();
      b.scrollTop = y;
    },
    renderFooter() {
      const f = footer ? footer() : '';
      q('.m-foot').innerHTML = f;
      q('.m-foot').hidden = !f;
    },
    q,
    close() {
      if (m.closed) return;
      m.closed = true;
      el.classList.remove('in');
      setTimeout(() => el.remove(), 220);
      stack.splice(stack.indexOf(m), 1);
      document.body.classList.toggle('modal-open', stack.length > 0);
      if (onClose) onClose();
    },
  };
  el._m = m;
  m.render();
  $('#modals').appendChild(el);
  stack.push(m);
  document.body.classList.add('modal-open');
  requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('in')));
  return m;
}

export function closeAllModals() {
  [...stack].forEach(m => m.close());
}

/** Menu d'actions. items : [{label, fn, danger}] */
export function sheetMenu(title, items) {
  const list = items.filter(Boolean);
  const m = modal({
    title,
    cls: 'menu',
    body: () => list.map((it, k) =>
      `<button class="menu-item ${it.danger ? 'danger' : ''} ${it.on ? 'on' : ''}" data-act="__pick" data-k="${k}">${esc(it.label)}${it.on ? ' ✓' : ''}</button>`).join(''),
    actions: { __pick: el => { m.close(); list[+el.dataset.k].fn(); } },
  });
  return m;
}

export function askConfirm(message, okLabel = 'OK', danger = false) {
  return new Promise(resolve => {
    let answer = false;
    const m = modal({
      title: '',
      cls: 'dialog',
      body: () => `<p class="dlg-msg">${esc(message)}</p>`,
      footer: () => `<button class="btn" data-act="__close">Annuler</button>
        <button class="btn ${danger ? 'danger' : 'primary'}" data-act="ok">${esc(okLabel)}</button>`,
      actions: { ok: () => { answer = true; m.close(); } },
      onClose: () => resolve(answer),
    });
  });
}

export function askText(title, value = '', placeholder = '') {
  return new Promise(resolve => {
    let answer = null;
    const m = modal({
      title,
      cls: 'dialog',
      body: () => `<input class="text-in" type="text" value="${esc(value)}" placeholder="${esc(placeholder)}" maxlength="60">`,
      footer: () => `<button class="btn" data-act="__close">Annuler</button><button class="btn primary" data-act="ok">OK</button>`,
      actions: { ok: () => { answer = m.q('input').value.trim(); m.close(); } },
      onClose: () => resolve(answer || null),
    });
    const inp = m.q('input');
    inp.addEventListener('keydown', e => { if (e.key === 'Enter') m.actions.ok(); });
    setTimeout(() => { inp.focus(); inp.select(); }, 60);
  });
}

// ---------- Calcul des disques ----------
export function platesText(total) {
  const { bar, plates } = state.settings;
  if (!(total > 0)) return '';
  if (total <= bar) return `Barre seule (${fmt(bar)} kg)`;
  let side = (total - bar) / 2;
  const out = [];
  for (const p of [...plates].sort((a, b) => b - a)) {
    while (side >= p - 1e-9) { out.push(p); side -= p; }
  }
  const rest = side > 0.01 ? ` · manque ${fmt(side * 2)} kg` : '';
  return `Par côté : ${out.length ? out.map(p => fmt(p)).join(' + ') : '—'}${rest}`;
}

// ---------- Clavier numérique ----------
/**
 * fields : [{label, value, step, dec, plates}]
 * onDone(values) est appelé à la fermeture ; onValidate() ensuite si « Valider » a été tapé.
 */
export function keypad({ title, fields, start = 0, onDone, onValidate = null, validateLabel = 'Valider la série' }) {
  let idx = start;
  let fresh = true;
  let validate = false;
  const toStr = v => (v === '' || v == null ? '' : String(v).replace('.', ','));
  const toNum = v => (v === '' || v === ',' ? '' : Math.round(Number(v.replace(',', '.')) * 100) / 100);
  const vals = fields.map(f => toStr(f.value));

  const m = modal({
    title,
    cls: 'kp',
    body: () => {
      const f = fields[idx];
      const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', f.dec ? ',' : '', '0', '⌫'];
      return `<div class="kp-fields">${fields.map((ff, k) => `
          <button class="kp-field ${k === idx ? 'on' : ''}" data-act="kp-f" data-k="${k}">
            <span>${esc(ff.label)}</span><b>${vals[k] === '' ? '–' : esc(vals[k])}</b>
          </button>`).join('')}</div>
        <div class="kp-plates">${f.plates ? esc(platesText(toNum(vals[idx]))) : ''}</div>
        <div class="kp-step">
          <button data-act="kp-step" data-d="-1">− ${fmt(f.step)}</button>
          <button data-act="kp-step" data-d="1">+ ${fmt(f.step)}</button>
        </div>
        <div class="kp-grid">${keys.map(k => k ? `<button data-act="kp-key" data-k="${k}">${k}</button>` : '<span></span>').join('')}</div>`;
    },
    footer: () => `<button class="btn" data-act="kp-next">${idx < fields.length - 1 ? 'Suivant' : 'OK'}</button>
      ${onValidate ? `<button class="btn primary grow" data-act="kp-val">✓ ${esc(validateLabel)}</button>` : ''}`,
    actions: {
      'kp-f': el => { idx = +el.dataset.k; fresh = true; m.render(); },
      'kp-key': el => {
        const k = el.dataset.k;
        let v = vals[idx];
        if (k === '⌫') v = v.slice(0, -1);
        else {
          if (fresh) v = '';
          if (k === ',') { if (!v.includes(',')) v = (v || '0') + ','; }
          else if (v.replace(',', '').length < 6) v = v === '0' ? k : v + k;
        }
        fresh = false;
        vals[idx] = v;
        m.render();
      },
      'kp-step': el => {
        const d = +el.dataset.d * fields[idx].step;
        const n = Math.max(0, Math.round(((toNum(vals[idx]) || 0) + d) * 100) / 100);
        vals[idx] = toStr(n);
        fresh = true;
        m.render();
      },
      'kp-next': () => {
        if (idx < fields.length - 1) { idx++; fresh = true; m.render(); }
        else m.close();
      },
      'kp-val': () => { validate = true; m.close(); },
    },
    onClose: () => {
      onDone(vals.map(toNum));
      if (validate && onValidate) onValidate();
    },
  });
  return m;
}
