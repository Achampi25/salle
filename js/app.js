import { state, load } from './store.js';
import { app, actions, $, closeAllModals } from './ui.js';
import * as workout from './workout.js';
import * as exercisesView from './exercises-view.js';
import * as progress from './progress.js';
import * as settings from './settings.js';
import * as timer from './timer.js';

const VIEWS = {
  workout: workout.render,
  exercises: exercisesView.render,
  progress: progress.render,
  settings: settings.render,
};

app.render = () => {
  const y = window.scrollY;
  $('#view').innerHTML = VIEWS[app.tab]();
  document.querySelectorAll('#tabs [data-tab]').forEach(b => b.classList.toggle('on', b.dataset.tab === app.tab));
  window.scrollTo(0, y);
  timer.tick();
};

actions.tab = el => {
  const t = el.dataset.tab;
  closeAllModals();
  if (t === app.tab) { window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
  app.tab = t;
  app.render();
  window.scrollTo(0, 0);
};

(async () => {
  try {
    await load();
  } catch (e) {
    $('#view').innerHTML = `<p class="page">Impossible d'ouvrir le stockage : ${e}</p>`;
    return;
  }
  navigator.storage?.persist?.();
  app.render();
  timer.init();
  workout.init();
  // Pas de service worker en local, pour toujours tester la dernière version.
  if ('serviceWorker' in navigator && !/^(localhost|127\.0\.0\.1)$/.test(location.hostname)) {
    navigator.serviceWorker.register('./service-worker.js');
  }
  window.__state = state; // utile pour déboguer
})();
