// Notifications push de fin de repos (via le Worker Cloudflare « gym-push »).
// Optionnel : désactivé, l'appli garde le bip + flash habituels.
import { state, save } from './store.js';
import { actions, app, toast } from './ui.js';

// Renseignés après le déploiement du Worker. La clé VAPID est publique ;
// le jeton limite seulement l'usage du Worker par des tiers.
const WORKER_URL = 'https://gym-push.gym-push-worker.workers.dev';
const VAPID_PUBLIC = 'BBrED9PKbBtiuuzyZwwESsFO8ZD7o-A8YwtFG6enVPRoSkudDBhLVb4C30g2uZivYrVV95z_rkS3zME2UKilBbA';
const TOKEN = '3bgIXMQ4-0mbpBahYdMKfZaHxoQNyJZ1';

const configured = () => WORKER_URL && VAPID_PUBLIC && TOKEN;
const supported = () => 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
const active = () => configured() && supported() && state.settings.push && state.settings.pushSub && Notification.permission === 'granted';

function post(path, body) {
  return fetch(WORKER_URL + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Token': TOKEN },
    body: JSON.stringify(body),
    keepalive: true,
  }).catch(e => console.warn('push', e));
}

export function scheduleRest(timer) {
  if (!active() || !timer) return;
  post('/schedule', { subscription: state.settings.pushSub, fireAt: timer.end, label: timer.label || '' });
}

export function cancelRest() {
  if (!active()) return;
  post('/cancel', { endpoint: state.settings.pushSub.endpoint });
}

export function settingsHTML() {
  if (!configured()) return '';
  const on = state.settings.push && supported() && Notification.permission === 'granted';
  return `<button class="row" data-act="push-toggle">
    <span>Notifications<small>Fin de repos écran verrouillé (et Apple Watch)</small></span><span class="switch ${on ? 'on' : ''}"><i></i></span></button>`;
}

function keyBytes(b64u) {
  const b = b64u.replace(/-/g, '+').replace(/_/g, '/');
  return Uint8Array.from(atob(b + '='.repeat((4 - (b.length % 4)) % 4)), c => c.charCodeAt(0));
}

actions['push-toggle'] = async () => {
  if (state.settings.push) {
    state.settings.push = false;
    save('settings');
    app.render();
    return;
  }
  if (!supported()) {
    toast('Ajoute d’abord l’appli à l’écran d’accueil (Partager › Sur l’écran d’accueil)');
    return;
  }
  try {
    const perm = await Notification.requestPermission();
    if (perm !== 'granted') { toast('Notifications refusées (Réglages iPhone › Notifications › Salle)'); return; }
    const reg = await navigator.serviceWorker.ready;
    let sub = await reg.pushManager.getSubscription();
    if (!sub) sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(VAPID_PUBLIC) });
    state.settings.pushSub = sub.toJSON();
    state.settings.push = true;
    save('settings');
    toast('Notifications activées');
  } catch (e) {
    console.warn(e);
    toast('Impossible d’activer les notifications');
  }
  app.render();
};
