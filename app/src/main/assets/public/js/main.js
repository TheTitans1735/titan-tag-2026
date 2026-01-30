import { clearUser, getScriptUrl, getUser, setScriptUrl, setUser } from './storage.js';
import { requestAllPermissions } from './permissions.js';
import { byId, setStatus, setText, showScreen } from './ui.js';
import { DEFAULT_SITES } from './sites.js';

function populateSites() {
  const select = byId('login-site');
  const names = DEFAULT_SITES.map(s => s.name).sort((a, b) => a.localeCompare(b, 'he'));
  names.forEach(name => {
    const opt = document.createElement('option');
    opt.value = name;
    opt.textContent = name;
    select.appendChild(opt);
  });
}

function normalizeUserInput(raw) {
  const name = (raw.name || '').trim();
  const email = (raw.email || '').trim();
  const role = (raw.role || '').trim();
  const site = (raw.site || '').trim();

  if (!name || !email || !role || !site) {
    throw new Error('נא למלא את כל השדות');
  }

  return { name, email, role, site };
}

function setHello(user) {
  const text = user ? `שלום ${user.name}` : 'שלום';
  setText('hello-title', text);
  setText('home-hello', text);
}

function fillHome(user) {
  setText('kv-user', user?.name || '-');
  setText('kv-role', user?.role || '-');
  setText('kv-site', user?.site || '-');
  setText('kv-sheets', getScriptUrl() || 'לא הוגדר');
}

function boot() {
  showScreen('screen-splash');

  window.setTimeout(() => {
    const user = getUser();
    if (user) {
      setHello(user);
      fillHome(user);
      showScreen('screen-home');
      return;
    }
    const scriptUrl = getScriptUrl();
    if (scriptUrl) byId('script-url').value = scriptUrl;
    showScreen('screen-login');
  }, 3000);
}

function wireLogin() {
  byId('login-form').addEventListener('submit', ev => {
    ev.preventDefault();
    try {
      const user = normalizeUserInput({
        name: byId('login-name').value,
        email: byId('login-email').value,
        role: byId('login-role').value,
        site: byId('login-site').value
      });

      const scriptUrl = (byId('script-url').value || '').trim();
      setScriptUrl(scriptUrl);
      setUser(user);

      setHello(user);
      setStatus('permissions-status', '');
      showScreen('screen-permissions');
    } catch (err) {
      alert(err?.message || 'שגיאה');
    }
  });
}

function wirePermissions() {
  byId('btn-request-permissions').addEventListener('click', async () => {
    setStatus('permissions-status', 'מבקש הרשאות...');
    const results = await requestAllPermissions();
    setStatus('permissions-status', results);
  });

  byId('btn-continue').addEventListener('click', () => {
    const user = getUser();
    if (!user) {
      showScreen('screen-login');
      return;
    }
    fillHome(user);
    showScreen('screen-home');
  });
}

function wireReset() {
  byId('btn-reset').addEventListener('click', () => {
    const ok = confirm('לצאת מהמשתמש הנוכחי?');
    if (!ok) return;
    clearUser();
    showScreen('screen-login');
  });
}

document.addEventListener('DOMContentLoaded', () => {
  populateSites();
  wireLogin();
  wirePermissions();
  wireReset();
  boot();
});
