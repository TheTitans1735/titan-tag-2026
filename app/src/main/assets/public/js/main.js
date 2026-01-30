import { clearUser, getScriptUrl, getUser, setScriptUrl, setUser } from './storage.js';
import { requestAllPermissions } from './permissions.js';
import { byId, setStatus, setText, showScreen } from './ui.js';
import { DEFAULT_SITES } from './sites.js';
import { addFind, getFinds, newFindId } from './findsStore.js';
import { filesToMediaItems } from './media.js';

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

async function getCurrentLocationText() {
  const plugins = window.Capacitor?.Plugins;
  try {
    if (plugins?.Geolocation?.getCurrentPosition) {
      const pos = await plugins.Geolocation.getCurrentPosition({ enableHighAccuracy: true, timeout: 10000 });
      const { latitude, longitude } = pos.coords;
      return `${latitude.toFixed(6)},${longitude.toFixed(6)}`;
    }
  } catch {
    // ignore; fallback to web
  }

  if (!navigator.geolocation) return 'לא זמין';

  const pos = await new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 10000 });
  });
  return `${pos.coords.latitude.toFixed(6)},${pos.coords.longitude.toFixed(6)}`;
}

function nowText() {
  const d = new Date();
  const date = d.toLocaleDateString('he-IL');
  const time = d.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  return `${date} ${time}`;
}

function openViewer(item) {
  const viewer = byId('viewer');
  const body = byId('viewer-body');
  body.innerHTML = '';

  if (item.kind === 'video') {
    const v = document.createElement('video');
    v.src = item.dataUrl;
    v.controls = true;
    v.playsInline = true;
    body.appendChild(v);
  } else {
    const img = document.createElement('img');
    img.src = item.dataUrl;
    img.alt = '';
    body.appendChild(img);
  }

  viewer.hidden = false;
}

function closeViewer() {
  const viewer = byId('viewer');
  const body = byId('viewer-body');
  body.innerHTML = '';
  viewer.hidden = true;
}

function renderMediaGrid(media) {
  byId('find-form').dataset.media = JSON.stringify(media);
  const grid = byId('media-grid');
  grid.innerHTML = '';

  media.forEach(item => {
    const wrap = document.createElement('div');
    wrap.className = 'thumb';

    const remove = document.createElement('button');
    remove.className = 'thumb__remove';
    remove.type = 'button';
    remove.textContent = '×';
    remove.addEventListener('click', ev => {
      ev.stopPropagation();
      const ok = confirm('הקובץ ימחק רוצה להמשיך?');
      if (!ok) return;
      const idx = media.findIndex(m => m.id === item.id);
      if (idx >= 0) media.splice(idx, 1);
      renderMediaGrid(media);
    });

    if (item.kind === 'video') {
      const v = document.createElement('video');
      v.className = 'thumb__media';
      v.src = item.dataUrl;
      v.muted = true;
      v.playsInline = true;
      v.preload = 'metadata';
      wrap.appendChild(v);
    } else {
      const img = document.createElement('img');
      img.className = 'thumb__media';
      img.src = item.dataUrl;
      img.alt = '';
      wrap.appendChild(img);
    }

    wrap.appendChild(remove);
    wrap.addEventListener('click', () => openViewer(item));
    grid.appendChild(wrap);
  });
}

function renderFindsList() {
  const list = byId('finds-list');
  const finds = getFinds();

  if (!finds.length) {
    list.textContent = 'אין ממצאים עדיין. לחצו "ממצא חדש" כדי להתחיל.';
    return;
  }

  list.innerHTML = '';

  finds.forEach(f => {
    const card = document.createElement('div');
    card.className = 'find';

    const top = document.createElement('div');
    top.className = 'find__top';

    const id = document.createElement('div');
    id.className = 'find__id';
    id.textContent = f.id;

    const dt = document.createElement('div');
    dt.className = 'find__meta';
    dt.textContent = f.datetimeText || '';

    top.appendChild(id);
    top.appendChild(dt);

    const meta = document.createElement('div');
    meta.className = 'find__meta';
    meta.textContent = `אתר: ${f.site} | חלקה: ${f.plot} | שכבה: ${f.layer} | מדיה: ${f.media?.length || 0}`;

    const desc = document.createElement('div');
    desc.className = 'find__meta';
    desc.textContent = `תיאור: ${f.description}`;

    card.appendChild(top);
    card.appendChild(meta);
    card.appendChild(desc);

    list.appendChild(card);
  });
}

async function startAddFind() {
  const user = getUser();
  if (!user) {
    showScreen('screen-login');
    return;
  }

  byId('find-site').value = user.site;
  byId('find-plot').value = '';
  byId('find-layer').value = '';
  byId('find-description').value = '';
  byId('find-transcript').value = '';
  byId('find-datetime').value = nowText();
  byId('find-location').value = 'מאתר מיקום...';

  const media = [];
  byId('find-form').dataset.media = JSON.stringify(media);
  renderMediaGrid(media);

  showScreen('screen-add-find');

  try {
    byId('find-location').value = await getCurrentLocationText();
  } catch {
    byId('find-location').value = 'לא זמין';
  }
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

function wireNavigation() {
  byId('btn-go-add-find').addEventListener('click', () => {
    startAddFind();
  });

  byId('btn-go-finds').addEventListener('click', () => {
    renderFindsList();
    showScreen('screen-finds');
  });

  byId('btn-back-from-add').addEventListener('click', () => {
    showScreen('screen-home');
  });

  byId('btn-back-from-finds').addEventListener('click', () => {
    showScreen('screen-home');
  });

  byId('btn-new-find').addEventListener('click', () => {
    startAddFind();
  });
}

function wireViewer() {
  const viewer = byId('viewer');
  viewer.addEventListener('click', ev => {
    const target = ev.target;
    if (target?.dataset?.close) closeViewer();
  });
}

function wireMedia() {
  let media = [];
  const form = byId('find-form');

  function readMediaState() {
    try {
      const raw = form.dataset.media;
      const parsed = raw ? JSON.parse(raw) : [];
      if (Array.isArray(parsed)) media = parsed;
    } catch {
      media = [];
    }
  }

  function writeMediaState() {
    form.dataset.media = JSON.stringify(media);
  }

  function sync() {
    writeMediaState();
    renderMediaGrid(media);
  }

  byId('btn-media-camera').addEventListener('click', () => {
    readMediaState();
    byId('input-media-camera').click();
  });

  byId('btn-media-add').addEventListener('click', () => {
    readMediaState();
    byId('input-media-add').click();
  });

  async function onFilesPicked(input) {
    readMediaState();
    try {
      const items = await filesToMediaItems(input.files);
      media.push(...items);
      sync();
    } catch (err) {
      alert(err?.message || 'שגיאה בהוספת מדיה');
    } finally {
      input.value = '';
    }
  }

  byId('input-media-camera').addEventListener('change', ev => onFilesPicked(ev.target));
  byId('input-media-add').addEventListener('change', ev => onFilesPicked(ev.target));
}

function wireFindSave() {
  byId('find-form').addEventListener('submit', ev => {
    ev.preventDefault();

    const user = getUser();
    if (!user) {
      showScreen('screen-login');
      return;
    }

    let media = [];
    try {
      media = JSON.parse(byId('find-form').dataset.media || '[]');
      if (!Array.isArray(media)) media = [];
    } catch {
      media = [];
    }

    const find = {
      id: newFindId(),
      site: user.site,
      plot: byId('find-plot').value.trim(),
      layer: byId('find-layer').value.trim(),
      description: byId('find-description').value.trim(),
      transcript: byId('find-transcript').value.trim(),
      location: byId('find-location').value.trim(),
      datetimeText: byId('find-datetime').value.trim(),
      createdAt: new Date().toISOString(),
      createdBy: user.email,
      media
    };

    if (!find.plot || !find.layer || !find.description) {
      alert('נא למלא: חלקה, שכבה ותיאור');
      return;
    }

    addFind(find);
    renderFindsList();
    showScreen('screen-finds');
  });
}

document.addEventListener('DOMContentLoaded', () => {
  populateSites();
  wireLogin();
  wirePermissions();
  wireReset();
  wireNavigation();
  wireViewer();
  wireMedia();
  wireFindSave();
  boot();
});
