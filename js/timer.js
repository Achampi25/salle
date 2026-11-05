// Timer de repos : basé sur une heure de fin (reste juste même si l'iPhone se verrouille).
import { state, save } from './store.js';
import { $, actions, mmss } from './ui.js';
import * as push from './push.js';

let actx = null;
let wakeLock = null;

function unlockAudio() {
  try {
    if (!actx) {
      if (navigator.audioSession) navigator.audioSession.type = 'transient';
      actx = new (window.AudioContext || window.webkitAudioContext)();
      // Son muet pour « débloquer » l'audio sur iOS.
      const b = actx.createBuffer(1, 1, 22050), s = actx.createBufferSource();
      s.buffer = b; s.connect(actx.destination); s.start(0);
    }
    if (actx.state !== 'running') actx.resume();
  } catch (e) { console.warn(e); }
}

function beep() {
  if (!state.settings.sound || !actx) return;
  try {
    if (actx.state !== 'running') actx.resume();
    const t0 = actx.currentTime + 0.02;
    [0, 0.28, 0.56].forEach((d, i) => {
      const o = actx.createOscillator(), g = actx.createGain();
      o.type = 'sine';
      o.frequency.value = i === 2 ? 1320 : 880;
      g.gain.setValueAtTime(0.0001, t0 + d);
      g.gain.exponentialRampToValueAtTime(0.6, t0 + d + 0.015);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + d + (i === 2 ? 0.4 : 0.2));
      o.connect(g).connect(actx.destination);
      o.start(t0 + d);
      o.stop(t0 + d + 0.45);
    });
  } catch (e) { console.warn(e); }
}

function flash() {
  const f = $('#flash');
  f.hidden = false;
  f.classList.remove('go');
  void f.offsetWidth;
  f.classList.add('go');
  clearTimeout(flash.t);
  flash.t = setTimeout(() => { f.hidden = true; }, 2200);
}
actions['flash-close'] = () => { $('#flash').hidden = true; };

export async function updateWakeLock() {
  const want = !!state.active && state.settings.wakeLock && !document.hidden;
  try {
    if (want && !wakeLock && 'wakeLock' in navigator) {
      wakeLock = await navigator.wakeLock.request('screen');
      wakeLock.addEventListener('release', () => { wakeLock = null; });
    } else if (!want && wakeLock) {
      await wakeLock.release();
      wakeLock = null;
    }
  } catch { /* refusé : pas grave */ }
}

export function startRest(sec, label) {
  const a = state.active;
  if (!a || !(sec > 0)) return;
  a.timer = { end: Date.now() + sec * 1000, total: sec, label };
  save('active');
  push.scheduleRest(a.timer);
  tick();
}

function adjust(delta) {
  const t = state.active?.timer;
  if (!t) return;
  t.end += delta * 1000;
  t.total = Math.max(1, t.total + delta);
  if (t.end <= Date.now()) return clear();
  save('active');
  push.scheduleRest(t);
  tick();
}

export function clear() {
  if (state.active?.timer) {
    state.active.timer = null;
    save('active');
  }
  push.cancelRest();
  tick();
}

actions['t-minus'] = () => adjust(-15);
actions['t-plus'] = () => adjust(15);
actions['t-skip'] = () => clear();

export function tick() {
  const t = state.active?.timer;
  const bar = $('#restbar');
  if (!t) {
    if (!bar.hidden) { bar.hidden = true; document.body.classList.remove('resting'); }
    return;
  }
  const ms = t.end - Date.now();
  if (ms <= 0) {
    state.active.timer = null;
    save('active');
    tick();
    // Pas d'alarme si la fin du repos a eu lieu pendant que l'appli était fermée.
    if (ms > -4000 && !document.hidden) { beep(); flash(); }
    return;
  }
  bar.hidden = false;
  document.body.classList.add('resting');
  $('#rb-time').textContent = mmss(Math.ceil(ms / 1000));
  $('#rb-label').textContent = t.label || '';
  $('#rb-prog').style.width = `${Math.min(100, (100 * ms) / (t.total * 1000))}%`;
}

export function init() {
  document.addEventListener('pointerdown', () => { unlockAudio(); updateWakeLock(); }, true);
  document.addEventListener('visibilitychange', () => { tick(); updateWakeLock(); });
  setInterval(tick, 250);
  tick();
  updateWakeLock();
}
