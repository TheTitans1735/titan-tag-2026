import { clearUser, getScriptUrl, getUser, setScriptUrl, setUser } from './storage.js';
import { requestAllPermissions } from './permissions.js';
import { byId, setStatus, setText, showScreen } from './ui.js';
import { DEFAULT_SITES } from './sites.js';
import { addFind, deleteFindById, getFindById, getFinds, newFindId, updateFind } from './findsStore.js';
import { filesToMediaItems } from './media.js';
import { deleteMediaItem, getMediaItem, putMediaItems } from './mediaStore.js';
import { startHebrewTranscription } from './speech.js';

let currentMedia = [];
const objectUrlById = new Map();

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

function populatePlotAndLayerOptions() {
  const plot = byId('find-plot');
  const layer = byId('find-layer');

  // Plot: א..כ
  const heb = [
    'א',
    'ב',
    'ג',
    'ד',
    'ה',
    'ו',
    'ז',
    'ח',
    'ט',
    'י',
    'כ'
  ];
  heb.forEach(letter => {
    const opt = document.createElement('option');
    opt.value = letter;
    opt.textContent = letter;
    plot.appendChild(opt);
  });

  // Layer: 1..12
  for (let i = 1; i <= 12; i += 1) {
    const opt = document.createElement('option');
    opt.value = String(i);
    opt.textContent = String(i);
    layer.appendChild(opt);
  }
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

  const src = getMediaSrc(item);
  if (!src) {
    alert('לא ניתן להציג את המדיה (קובץ חסר)');
    return;
  }

  if (item.kind === 'video') {
    const v = document.createElement('video');
    v.src = src;
    v.controls = true;
    v.playsInline = true;
    body.appendChild(v);
  } else {
    const img = document.createElement('img');
    img.src = src;
    img.alt = '';
    body.appendChild(img);
  }

  viewer.hidden = false;
}

function getMediaSrc(item) {
  if (!item) return '';
  if (item.dataUrl) return item.dataUrl;
  if (item.blob) {
    const existing = objectUrlById.get(item.id);
    if (existing) return existing;
    const url = URL.createObjectURL(item.blob);
    objectUrlById.set(item.id, url);
    return url;
  }
  return '';
}

function revokeMediaUrl(id) {
  const url = objectUrlById.get(id);
  if (!url) return;
  try {
    URL.revokeObjectURL(url);
  } catch {
    // ignore
  }
  objectUrlById.delete(id);
}

function dataUrlToBlob(dataUrl) {
  const parts = String(dataUrl).split(',');
  if (parts.length < 2) return null;
  const meta = parts[0];
  const b64 = parts.slice(1).join(',');
  const m = /data:([^;]+);base64/.exec(meta);
  const mime = m ? m[1] : 'application/octet-stream';
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i += 1) bytes[i] = bin.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

function closeViewer() {
  const viewer = byId('viewer');
  const body = byId('viewer-body');
  body.innerHTML = '';
  viewer.hidden = true;
}

function renderMediaGrid(media) {
  const grid = byId('media-grid');
  grid.innerHTML = '';

  media.forEach(item => {
    const wrap = document.createElement('div');
    wrap.className = 'thumb';

    const remove = document.createElement('button');
    remove.className = 'thumb__remove';
    remove.type = 'button';
    remove.textContent = '×';
    remove.addEventListener('click', async ev => {
      ev.stopPropagation();
      const ok = confirm('הקובץ ימחק רוצה להמשיך?');
      if (!ok) return;

      if (item.stored) {
        try {
          await deleteMediaItem(item.id);
        } catch {
          // ignore
        }
      }

      revokeMediaUrl(item.id);
      const idx = media.findIndex(m => m.id === item.id);
      if (idx >= 0) media.splice(idx, 1);
      renderMediaGrid(media);
    });

    if (item.kind === 'video') {
      const v = document.createElement('video');
      v.className = 'thumb__media';
      v.src = getMediaSrc(item);
      v.muted = true;
      v.playsInline = true;
      v.preload = 'metadata';
      wrap.appendChild(v);
    } else {
      const img = document.createElement('img');
      img.className = 'thumb__media';
      img.src = getMediaSrc(item);
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
    card.tabIndex = 0;
    card.role = 'button';
    card.addEventListener('click', () => startEditFind(f.id));
    card.addEventListener('keydown', ev => {
      if (ev.key === 'Enter' || ev.key === ' ') startEditFind(f.id);
    });

    const top = document.createElement('div');
    top.className = 'find__top';

    const id = document.createElement('div');
    id.className = 'find__id';
    id.textContent = f.id;

    const actions = document.createElement('div');
    actions.className = 'find__actions';

    const del = document.createElement('button');
    del.className = 'find__delete';
    del.type = 'button';
    del.title = 'מחיקה';
    del.innerHTML =
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M9 3h6l1 2h4v2H4V5h4l1-2zm1 7h2v9h-2v-9zm4 0h2v9h-2v-9zM7 10h2v9H7v-9z"/></svg>';
    del.addEventListener('click', ev => {
      ev.preventDefault();
      ev.stopPropagation();
      const ok = confirm('האם ברצונך למחוק את הממצא?');
      if (!ok) return;
      const deleted = deleteFindById(f.id);
      if (!deleted) {
        alert('מחיקה נכשלה: הממצא לא נמצא');
        return;
      }
      renderFindsList();
    });

    actions.appendChild(del);

    const dt = document.createElement('div');
    dt.className = 'find__meta';
    dt.textContent = f.datetimeText || '';

    top.appendChild(id);
    top.appendChild(actions);
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

  byId('find-form').dataset.editId = '';
  byId('btn-save-find').textContent = 'שמירה';

  currentMedia.forEach(m => revokeMediaUrl(m.id));
  currentMedia = [];
  renderMediaGrid(currentMedia);

  showScreen('screen-add-find');

  try {
    byId('find-location').value = await getCurrentLocationText();
  } catch {
    byId('find-location').value = 'לא זמין';
  }
}

async function startEditFind(findId) {
  const user = getUser();
  if (!user) {
    showScreen('screen-login');
    return;
  }

  const find = getFindById(findId);
  if (!find) {
    alert('הממצא לא נמצא');
    return;
  }

  if (find.site !== user.site) {
    alert('לא ניתן לערוך ממצא מאתר אחר.');
    return;
  }

  byId('find-site').value = find.site;
  byId('find-plot').value = find.plot || '';
  byId('find-layer').value = find.layer || '';
  byId('find-description').value = find.description || '';
  byId('find-transcript').value = find.transcript || '';
  byId('find-location').value = find.location || '';
  byId('find-datetime').value = find.datetimeText || '';

  byId('find-form').dataset.editId = find.id;
  byId('btn-save-find').textContent = 'עדכון';

  currentMedia.forEach(m => revokeMediaUrl(m.id));
  currentMedia = [];

  const refs = Array.isArray(find.media) ? find.media : [];
  for (const ref of refs) {
    if (!ref?.id) continue;
    try {
      const stored = await getMediaItem(ref.id);
      if (stored?.blob) {
        currentMedia.push({
          id: stored.id,
          kind: stored.kind || ref.kind,
          mime: stored.mime || ref.mime,
          name: stored.name || ref.name,
          blob: stored.blob,
          stored: true
        });
      } else {
        currentMedia.push({ ...ref, stored: false });
      }
    } catch {
      currentMedia.push({ ...ref, stored: false });
    }
  }

  renderMediaGrid(currentMedia);

  showScreen('screen-add-find');
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
  byId('btn-image-camera').addEventListener('click', () => {
    byId('input-image-camera').click();
  });

  byId('btn-image-gallery').addEventListener('click', () => {
    byId('input-image-gallery').click();
  });

  byId('btn-video-camera').addEventListener('click', () => {
    byId('input-video-camera').click();
  });

  async function onFilesPicked(input) {
    try {
      const items = await filesToMediaItems(input.files);
      currentMedia.push(...items);
      renderMediaGrid(currentMedia);
    } catch (err) {
      alert(err?.message || 'שגיאה בהוספת מדיה');
    } finally {
      input.value = '';
    }
  }

  byId('input-image-camera').addEventListener('change', ev => onFilesPicked(ev.target));
  byId('input-image-gallery').addEventListener('change', ev => onFilesPicked(ev.target));
  byId('input-video-camera').addEventListener('change', ev => onFilesPicked(ev.target));
}

function wireFindSave() {
  byId('find-form').addEventListener('submit', ev => {
    ev.preventDefault();

    void (async () => {

    const user = getUser();
    if (!user) {
      showScreen('screen-login');
      return;
    }

    // שמירת המדיה ב-IndexedDB כדי שלא יישבר LocalStorage אחרי צילום תמונה
    try {
      currentMedia.forEach(m => {
        if (!m) return;
        if (!m.blob && m.dataUrl) {
          const blob = dataUrlToBlob(m.dataUrl);
          if (blob) {
            m.blob = blob;
            delete m.dataUrl;
          }
        }
      });

      await putMediaItems(currentMedia.filter(m => m?.blob));
      currentMedia.forEach(m => {
        m.stored = true;
      });
    } catch (err) {
      alert(`שמירת מדיה נכשלה: ${err?.message || 'שגיאה'}`);
      return;
    }

    const mediaRefs = currentMedia.map(m => ({
      id: m.id,
      kind: m.kind,
      mime: m.mime,
      name: m.name
    }));

    const editId = (byId('find-form').dataset.editId || '').trim();
    const existing = editId ? getFindById(editId) : null;

    const find = {
      id: existing?.id || newFindId(),
      site: user.site,
      plot: byId('find-plot').value.trim(),
      layer: byId('find-layer').value.trim(),
      description: byId('find-description').value.trim(),
      transcript: byId('find-transcript').value.trim(),
      location: existing?.location || byId('find-location').value.trim(),
      datetimeText: existing?.datetimeText || byId('find-datetime').value.trim(),
      createdAt: existing?.createdAt || new Date().toISOString(),
      createdBy: existing?.createdBy || user.email,
      updatedAt: editId ? new Date().toISOString() : undefined,
      media: mediaRefs
    };

    if (!find.plot || !find.layer || !find.description) {
      alert('נא למלא: חלקה, שכבה ותיאור');
      return;
    }

    if (editId) {
      const ok = updateFind(find);
      if (!ok) {
        alert('עדכון נכשל: הממצא לא נמצא');
        return;
      }
    } else {
      addFind(find);
    }
    renderFindsList();
    showScreen('screen-finds');
    })();
  });
}

function wireTranscription() {
  const btn = byId('btn-transcribe');
  const field = byId('find-transcript');

  let session = null;
  let base = '';

  btn.addEventListener('click', async () => {
    if (session) {
      session.stop();
      session = null;
      btn.classList.remove('icon-btn--active');
      return;
    }

    base = field.value.trim();
    const basePrefix = base ? `${base} ` : '';

    try {
      session = await startHebrewTranscription({
        onStatus: status => {
          if (status === 'listening') btn.classList.add('icon-btn--active');
          if (status === 'idle') btn.classList.remove('icon-btn--active');
        },
        onText: ({ finalText, interimText }) => {
          const combined = `${basePrefix}${finalText}${interimText ? ` ${interimText}` : ''}`.trim();
          field.value = combined;
        },
        onEnd: () => {
          session = null;
          btn.classList.remove('icon-btn--active');
        },
        onError: err => {
          session = null;
          btn.classList.remove('icon-btn--active');
          alert(`שגיאה בזיהוי דיבור: ${err.message}`);
        }
      });
    } catch (err) {
      session = null;
      btn.classList.remove('icon-btn--active');
      alert(err?.message || 'שגיאה בזיהוי דיבור');
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  populateSites();
  populatePlotAndLayerOptions();
  wireLogin();
  wirePermissions();
  wireReset();
  wireNavigation();
  wireViewer();
  wireMedia();
  wireFindSave();
  wireTranscription();
  boot();
});
