import { clearUser, getScriptUrl, getUser, setScriptUrl, setUser } from './storage.js';
import { requestAllPermissions } from './permissions.js';
import { byId, setStatus, setText, showScreen } from './ui.js';
import { getAllIsraelSites, addIsraelSite } from './sites.js';
import { addFind, deleteFindById, getFindById, getFinds, newFindId, updateFind } from './findsStore.js';
import { filesToMediaItems } from './media.js';
import { deleteMediaItem, getMediaItem, putMediaItems } from './mediaStore.js';
import { startHebrewTranscription } from './speech.js';
import { speakHebrew } from './speechUtterance.js';
import { applyI18nToDom, getLang, setLang, t } from './i18n.js';

let currentMedia = [];
const objectUrlById = new Map();

function setQrStatus(text) {
  try {
    byId('qr-status').textContent = String(text || '');
  } catch {
    // ignore
  }
}

function updateFindQr() {
  const id = (byId('find-id')?.value || '').trim();
  const img = byId('find-qr-image');
  const printBtn = byId('btn-print-qr');

  const canRender = !!(window.Android && typeof window.Android.getQrPngDataUrl === 'function');
  const canPrint = !!(window.Android && typeof window.Android.printFindQrToSk58 === 'function');

  if (!id) {
    img.removeAttribute('src');
    img.hidden = true;
    setQrStatus(t('qr_enter_id'));
    printBtn.disabled = true;
    return;
  }

  if (!canRender) {
    img.removeAttribute('src');
    img.hidden = true;
    setQrStatus(t('qr_android_only'));
    printBtn.disabled = true;
    return;
  }

  try {
    const dataUrl = window.Android.getQrPngDataUrl(id);
    if (dataUrl && String(dataUrl).startsWith('data:image/')) {
      img.src = dataUrl;
      img.hidden = false;
      setQrStatus('');
      printBtn.disabled = !canPrint;
      return;
    }
  } catch {
    // ignore
  }

  img.removeAttribute('src');
  img.hidden = true;
  setQrStatus(t('qr_failed'));
  printBtn.disabled = true;
}

function populateSites() {
  const select = byId('login-site');
  const names = getAllIsraelSites().map(s => s.name).sort((a, b) => a.localeCompare(b, 'he'));
  names.forEach(name => {
    const opt = document.createElement('option');
    opt.value = name;
    opt.textContent = name;
    select.appendChild(opt);
  });
}

// Show and manage Israeli sites
function showSitesManager() {
  // Populate the Israel sites select and show the screen
  populateSiteNameSelectInSitesScreen();

  // Set current user's site as selected (if exists)
  const user = getUser();
  const select = byId('site-name');
  if (user && select) {
    try {
      select.value = user.site;
    } catch {
      // ignore
    }
  }

  // Update the user's site immediately when selecting a site
  if (select && !select.dataset.boundChange) {
    select.addEventListener('change', () => {
      const nextSite = (select.value || '').trim();
      const current = getUser();
      if (!current || !nextSite) return;
      const updated = { ...current, site: nextSite };
      setUser(updated);
      fillHome(updated);
    });
    select.dataset.boundChange = '1';
  }

  showScreen('screen-sites');
}

function populateSiteNameSelectInSitesScreen() {
  const select = byId('site-name');
  if (!select) return;
  select.innerHTML = '';
  const placeholder = document.createElement('option');
  placeholder.value = '';
  placeholder.textContent = t('select_site');
  placeholder.disabled = true;
  placeholder.selected = true;
  select.appendChild(placeholder);

  const sites = getAllIsraelSites();
  sites.forEach(s => {
    const opt = document.createElement('option');
    opt.value = s.name;
    opt.textContent = s.name;
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
    throw new Error(t('login_fill_all_fields'));
  }

  return { name, email, role, site };
}

function setHello(user) {
  const text = user ? t('hello_user', { name: user.name }) : t('hello_generic');
  setText('hello-title', text);
  setText('home-hello', text);
}

function fillHome(user) {
  setText('kv-user', user?.name || '-');
  setText('kv-role', user?.role || '-');
  setText('kv-site', user?.site || '-');
  const scriptUrl = getScriptUrl();
  if (!scriptUrl) {
    setText('kv-sheets', t('kv_sheets_not_set'));
    return;
  }
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    setText('kv-sheets', t('kv_sheets_offline'));
    return;
  }
  setText('kv-sheets', scriptUrl);
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

  if (!navigator.geolocation) return t('not_available');

  const pos = await new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 10000 });
  });
  return `${pos.coords.latitude.toFixed(6)},${pos.coords.longitude.toFixed(6)}`;
}

function nowText() {
  const d = new Date();
  const locale = getLang() === 'en' ? 'en-US' : 'he-IL';
  const date = d.toLocaleDateString(locale);
  const time = d.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  return `${date} ${time}`;
}

function openViewer(item) {
  const viewer = byId('viewer');
  const body = byId('viewer-body');
  body.innerHTML = '';

  const src = getMediaSrc(item);
  if (!src) {
    alert(t('viewer_media_missing'));
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
      const ok = confirm(t('confirm_delete_media'));
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
    list.textContent = t('finds_empty');
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
    del.title = t('delete_title');
    del.innerHTML =
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M9 3h6l1 2h4v2H4V5h4l1-2zm1 7h2v9h-2v-9zm4 0h2v9h-2v-9zM7 10h2v9H7v-9z"/></svg>';
    del.addEventListener('click', ev => {
      ev.preventDefault();
      ev.stopPropagation();
      const ok = confirm(t('confirm_delete_find'));
      if (!ok) return;
      const deleted = deleteFindById(f.id);
      if (!deleted) {
        alert(t('delete_failed_missing'));
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
    meta.textContent = t('find_card_meta', {
      site: f.site,
      plot: f.plot,
      layer: f.layer,
      mediaCount: f.media?.length || 0
    });

    const desc = document.createElement('div');
    desc.className = 'find__meta';
    desc.textContent = t('find_card_desc', { description: f.description });

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

  byId('find-id').readOnly = false;
  byId('find-id').value = newFindId();

  setText('add-find-title', t('add_find_title_add'));
  byId('find-plot').value = '';
  byId('find-layer').value = '';
  byId('find-description').value = '';
  byId('find-datetime').value = nowText();
  byId('find-location').value = t('location_fetching');

  byId('find-form').dataset.editId = '';
  byId('btn-save-find').textContent = t('btn_save');

  currentMedia.forEach(m => revokeMediaUrl(m.id));
  currentMedia = [];
  renderMediaGrid(currentMedia);

  updateFindQr();

  showScreen('screen-add-find');

  try {
    byId('find-location').value = await getCurrentLocationText();
  } catch {
    byId('find-location').value = t('not_available');
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
    alert(t('finding_not_found'));
    return;
  }

  if (find.site !== user.site) {
    alert(t('edit_other_site_not_allowed'));
    return;
  }

  byId('find-site').value = find.site;

  byId('find-id').value = find.id;
  byId('find-id').readOnly = true;

  setText('add-find-title', t('add_find_title_edit', { id: find.id }));
  byId('find-plot').value = find.plot || '';
  byId('find-layer').value = find.layer || '';
  byId('find-description').value = find.description || '';
  byId('find-location').value = find.location || '';
  byId('find-datetime').value = find.datetimeText || '';

  byId('find-form').dataset.editId = find.id;
  byId('btn-save-find').textContent = t('btn_update');

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

  updateFindQr();

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
      alert(err?.message || t('error_generic'));
    }
  });
}

function wirePermissions() {
  byId('btn-request-permissions').addEventListener('click', async () => {
    setStatus('permissions-status', t('permissions_requesting'));
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
    const ok = confirm(t('logout_confirm'));
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

  // Open Sites Manager
  byId('btn-go-sites').addEventListener('click', () => {
    showSitesManager();
  });

  byId('btn-go-scan-find-qr').addEventListener('click', () => {
    // Reset scan UI each time we enter
    const hero = document.querySelector('.scan-hero');
    if (hero) hero.hidden = false;
    const preview = document.querySelector('.scan-preview');
    if (preview) preview.hidden = true;

    showScreen('screen-scan-find-qr');
    setStatus('scan-status', t('scan_status_hint'));
  });

  byId('btn-share').addEventListener('click', async () => {
    const user = getUser();
    const site = user?.site ? t('site_share_prefix', { site: user.site }) : '';
    const text = ['Titan Tag', site].filter(Boolean).join('\n');

    // Prefer Android native share (reliable inside WebView)
    if (window.Android && typeof window.Android.shareText === 'function') {
      try {
        window.Android.shareText('Titan Tag', text);
        return;
      } catch {
        // fall through
      }
    }

    // Use native share sheet (Capacitor Share plugin if available, else Web Share API)
    const plugins = window.Capacitor?.Plugins;
    if (plugins?.Share?.share) {
      try {
        await plugins.Share.share({
          title: 'Titan Tag',
          text
        });
        return;
      } catch {
        // fall through
      }
    }

    if (navigator.share) {
      try {
        await navigator.share({ title: 'Titan Tag', text });
        return;
      } catch {
        // ignore
      }
    }

    alert(t('share_not_supported'));
  });

  byId('btn-back-from-add').addEventListener('click', () => {
    showScreen('screen-home');
  });

  byId('btn-back-from-finds').addEventListener('click', () => {
    showScreen('screen-home');
  });

  byId('btn-back-from-scan-find-qr').addEventListener('click', () => {
    stopQrScan({ showHero: true });
    showScreen('screen-home');
  });

  byId('btn-new-find').addEventListener('click', () => {
    startAddFind();
  });
  
  // Back from Sites screen
  byId('btn-back-from-sites').addEventListener('click', () => {
    showScreen('screen-home');
  });

  // Save site in Sites screen
  byId('btn-save-site').addEventListener('click', () => {
    const name = byId('site-name').value;
    if (!name || !name.trim()) {
      alert(t('sites_choose_from_list'));
      return;
    }
    // Try to add; if exists, still proceed
    const added = (typeof addIsraelSite === 'function') ? addIsraelSite(name) : false;
    if (added) {
      // Optional: feedback
    }
    // Refresh sites in the Add Site screen and login/site selectors
    if (typeof populateSiteNameSelectInSitesScreen === 'function') {
      populateSiteNameSelectInSitesScreen();
    }
    // Return to home
    showScreen('screen-home');
  });
}

let scanStream = null;
let scanRunning = false;

async function stopQrScan({ showHero = true } = {}) {
  scanRunning = false;
  const preview = document.querySelector('.scan-preview');
  if (preview) preview.hidden = true;

  const hero = document.querySelector('.scan-hero');
  if (hero) hero.hidden = !showHero;

  try {
    const video = byId('scan-video');
    try {
      video.pause();
    } catch {
      // ignore
    }
    video.srcObject = null;
  } catch {
    // ignore
  }

  if (scanStream) {
    try {
      scanStream.getTracks().forEach(t => t.stop());
    } catch {
      // ignore
    }
    scanStream = null;
  }
}

async function startQrScan() {
  await stopQrScan({ showHero: true });

  if (!navigator.mediaDevices?.getUserMedia) {
    setStatus('scan-status', t('scan_camera_not_supported'));
    return;
  }

  if (!('BarcodeDetector' in window)) {
    setStatus('scan-status', t('scan_barcode_not_supported'));
    return;
  }

  setStatus('scan-status', t('scan_opening_camera'));

  try {
    scanStream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: { ideal: 'environment' },
        width: { ideal: 1280 },
        height: { ideal: 720 }
      },
      audio: false
    });
  } catch (err) {
    setStatus('scan-status', t('scan_open_failed', { message: err?.message || t('error_generic') }));
    await stopQrScan({ showHero: true });
    return;
  }

  const preview = document.querySelector('.scan-preview');
  if (preview) preview.hidden = false;

  const hero = document.querySelector('.scan-hero');
  if (hero) hero.hidden = true;

  window.scrollTo({ top: 0, left: 0, behavior: 'auto' });

  const video = byId('scan-video');
  video.srcObject = scanStream;
  try {
    await video.play();
  } catch {
    setStatus('scan-status', t('scan_video_failed'));
    await stopQrScan({ showHero: true });
    return;
  }

  const detector = new window.BarcodeDetector({ formats: ['qr_code'] });
  scanRunning = true;
  setStatus('scan-status', t('scan_aiming'));

  const loop = async () => {
    if (!scanRunning) return;
    try {
      const barcodes = await detector.detect(video);
      const value = barcodes?.[0]?.rawValue;
      if (value) {
        scanRunning = false;
        // Keep hero hidden to avoid flicker before navigation
        await stopQrScan({ showHero: false });
        setStatus('scan-status', t('scan_scanned', { value }));

        const existing = getFindById(value);
        if (existing) {
          await startEditFind(value);
        } else {
          await startAddFind();
          byId('find-id').value = value;
          updateFindQr();
        }
        return;
      }
    } catch {
      // ignore; keep scanning
    }
    window.setTimeout(loop, 200);
  };

  void loop();
}

function wireFindQrScan() {
  byId('btn-open-scan-camera').addEventListener('click', () => {
    void startQrScan();
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
      alert(err?.message || t('media_add_error'));
    } finally {
      input.value = '';
    }
  }

  byId('input-image-camera').addEventListener('change', ev => onFilesPicked(ev.target));
  byId('input-image-gallery').addEventListener('change', ev => onFilesPicked(ev.target));
  byId('input-video-camera').addEventListener('change', ev => onFilesPicked(ev.target));
}

function wireFindQrUi() {
  const idField = byId('find-id');
  const printBtn = byId('btn-print-qr');

  let debounce = null;

  idField.addEventListener('input', () => {
    if (debounce) clearTimeout(debounce);
    debounce = setTimeout(() => updateFindQr(), 120);
  });

  printBtn.addEventListener('click', () => {
    const id = (byId('find-id').value || '').trim();
    if (!id) {
      alert(t('find_id_required'));
      return;
    }
    if (!(window.Android && typeof window.Android.printFindQrToSk58 === 'function')) {
      alert(t('qr_print_android_only'));
      return;
    }
    setQrStatus(t('qr_print_sending'));
    try {
      window.Android.printFindQrToSk58(id);
    } catch {
      alert(t('qr_print_failed'));
    }
  });
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
      alert(t('media_save_failed', { message: err?.message || t('error_generic') }));
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

    const requestedIdRaw = (byId('find-id').value || '').trim();
    const requestedId = requestedIdRaw || (existing?.id || newFindId());

    if (!requestedId) {
      alert(t('find_id_required'));
      return;
    }

    if (!editId && !requestedIdRaw) {
      byId('find-id').value = requestedId;
      updateFindQr();
    }

    if (!editId) {
      const dup = getFindById(requestedId);
      if (dup) {
        alert(t('find_id_exists'));
        return;
      }
    }

    const find = {
      id: existing?.id || requestedId,
      site: user.site,
      plot: byId('find-plot').value.trim(),
      layer: byId('find-layer').value.trim(),
      description: byId('find-description').value.trim(),
      location: existing?.location || byId('find-location').value.trim(),
      datetimeText: existing?.datetimeText || byId('find-datetime').value.trim(),
      createdAt: existing?.createdAt || new Date().toISOString(),
      createdBy: existing?.createdBy || user.email,
      updatedAt: editId ? new Date().toISOString() : undefined,
      media: mediaRefs
    };

    if (editId) {
      const ok = updateFind(find);
      if (!ok) {
        alert(t('update_failed_not_found'));
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
  const micBtn = byId('btn-mic');

  let session = null;
  let capturedFinal = '';
  let capturedFallback = '';
  let baseDescription = '';
  let state = 'idle'; // idle | speaking | listening
  let token = 0;
  let stopMode = 'none'; // none | cancel | insert

  function explainAndroidSttError(err) {
    const s = String(err || '');
    if (s.includes('permission_denied')) return t('stt_android_permission_denied');
    if (s.includes('not_available')) return t('stt_android_not_available');
    if (s.includes('start_failed')) return t('stt_android_start_failed');

    const m = /error:(\d+)/.exec(s);
    if (!m) return t('stt_android_unknown');
    const code = Number(m[1]);
    // Android SpeechRecognizer error codes
    switch (code) {
      case 1:
        return t('stt_android_code_1');
      case 2:
        return t('stt_android_code_2');
      case 3:
        return t('stt_android_code_3');
      case 4:
        return t('stt_android_code_4');
      case 5:
        return t('stt_android_code_5');
      case 6:
        return t('stt_android_code_6');
      case 7:
        return t('stt_android_code_7');
      case 8:
        return t('stt_android_code_8');
      case 9:
        return t('stt_android_code_9');
      case 10:
        return t('stt_android_code_10');
      case 11:
        return t('stt_android_code_11');
      case 12:
        return t('stt_android_code_12');
      case 13:
        return t('stt_android_code_13');
      default:
        return t('stt_android_code_other', { code });
    }
  }

  function setDescriptionLive(text) {
    const descriptionField = byId('find-description');
    if (!descriptionField) return;
    const t = (text || '').trim();
    const base = (baseDescription || '').trim();
    descriptionField.value = base ? (t ? `${base} ${t}` : base) : t;
  }

  // Voice input feature with Hebrew TTS and speech-to-text
  micBtn?.addEventListener('click', async () => {
    console.log('Voice input started');

    // Toggle off: stop speaking/listening
    if (state !== 'idle') {
      const shouldInsert = state === 'listening' && !!((capturedFinal || capturedFallback).trim());
      stopMode = shouldInsert ? 'insert' : 'cancel';
      token += 1;
      try {
        session?.stop?.();
      } catch {
        // ignore
      }

      // Restore only if this is a cancel.
      if (stopMode === 'cancel') setDescriptionLive('');

      session = null;
      state = 'idle';
      micBtn.classList.remove('mic-btn--active');
      micBtn.classList.remove('mic-btn--speaking');
      micBtn.classList.add('mic-btn--inactive');
      return;
    }
    
    try {
      const myToken = (token += 1);

      // Visual feedback - pink while speaking
      state = 'speaking';
      micBtn.classList.remove('mic-btn--inactive');
      micBtn.classList.remove('mic-btn--active');
      micBtn.classList.add('mic-btn--speaking');

      capturedFinal = '';
      capturedFallback = '';
      stopMode = 'none';

      // Capture the current description as a base and update live into it
      baseDescription = (byId('find-description')?.value || '').trim();
      
      // Step 1: Play Hebrew TTS message
      console.log('Playing Hebrew TTS message');
      await speakHebrew(t('stt_prompt'));
      if (myToken !== token) return; // cancelled
      console.log('TTS finished, starting speech recognition');

      // Give Android audio focus a moment to settle after TTS
      await new Promise(r => setTimeout(r, 120));
      
      // Step 2: Automatically activate speech-to-text
      state = 'listening';
      micBtn.classList.remove('mic-btn--speaking');
      micBtn.classList.add('mic-btn--active');
      await startVoiceInput();
      
    } catch (error) {
      console.error('Voice input error:', error);
      session = null;
      state = 'idle';
      micBtn.classList.remove('mic-btn--active');
      micBtn.classList.remove('mic-btn--speaking');
      micBtn.classList.add('mic-btn--inactive');
      
      // Graceful error handling with fallback prompt
      if (error.code === 'stt_not_supported' || error.code === 'mic_permission_required') {
        showVoiceInputFallback();
      } else {
        showVoiceInputRetry(error.message);
      }
    }
  });

  async function startVoiceInput() {
    // Prefer native Android speech recognizer when available
    if (window.Android && typeof window.Android.startSpeechRecognition === 'function') {
      await startAndroidSpeechRecognition();
      return;
    }

    // Check speech recognition support
    if (!window.SpeechRecognition && !window.webkitSpeechRecognition) {
      const err = new Error(t('stt_not_supported_device'));
      err.code = 'stt_not_supported';
      throw err;
    }

    // Request microphone permissions gracefully
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log('Microphone permission granted');
    } catch (permissionError) {
      const err = new Error(t('stt_permission_required'));
      err.code = 'mic_permission_required';
      throw err;
    }

    session = await startHebrewTranscription({
      silenceTimeoutMs: 5000,
      onStatus: status => {
        console.log('Recognition status:', status);
        if (status === 'listening') {
          micBtn.classList.add('mic-btn--active');
        } else if (status === 'idle') {
          micBtn.classList.remove('mic-btn--active');
          micBtn.classList.remove('mic-btn--speaking');
          micBtn.classList.add('mic-btn--inactive');
        }
      },
      onText: ({ finalText, interimText }) => {
        console.log('Recognition result:', { finalText, interimText });
        const f = (finalText || '').trim();
        const i = (interimText || '').trim();
        if (f) capturedFinal = f;
        if (i) capturedFallback = i;

        // Live update while speaking
        setDescriptionLive(f || i);
      },
      onEnd: () => {
        console.log('Voice input completed');
        session = null;
        state = 'idle';
        micBtn.classList.remove('mic-btn--active');
        micBtn.classList.remove('mic-btn--speaking');
        micBtn.classList.add('mic-btn--inactive');

        // If user cancelled via mic click, restore base and exit quietly
        if (stopMode === 'cancel') {
          stopMode = 'none';
          setDescriptionLive('');
          return;
        }

        const textToInsert = capturedFinal || capturedFallback;
        if (textToInsert) {
          setDescriptionLive(textToInsert);
          const descriptionField = byId('find-description');
          if (!descriptionField) return;
          descriptionField.focus();
          descriptionField.setSelectionRange(descriptionField.value.length, descriptionField.value.length);
        } else {
          // Restore base text if nothing was captured
          setDescriptionLive('');
          if (stopMode !== 'cancel') alert(t('stt_not_captured'));
        }
        stopMode = 'none';
      },
      onError: error => {
        console.error('Recognition error:', error);
        session = null;
        state = 'idle';
        micBtn.classList.remove('mic-btn--active');
        micBtn.classList.remove('mic-btn--speaking');
        micBtn.classList.add('mic-btn--inactive');
        setDescriptionLive('');
        throw new Error(`${t('stt_android_unknown')}: ${error.message}`);
      }
    });
  }

  async function startAndroidSpeechRecognition() {
    const cbName = `__stt_${Date.now()}_${Math.random().toString(16).slice(2)}`;

    let ended = false;
    let silenceTimer = null;
    let watchdogTimer = null;

    const stopTimers = () => {
      if (silenceTimer) {
        clearTimeout(silenceTimer);
        silenceTimer = null;
      }
      if (watchdogTimer) {
        clearTimeout(watchdogTimer);
        watchdogTimer = null;
      }
    };

    const bumpSilenceTimer = () => {
      if (silenceTimer) clearTimeout(silenceTimer);
      silenceTimer = setTimeout(() => {
        try {
          window.Android.stopSpeechRecognition?.();
        } catch {
          // ignore
        }
        const hasText = !!((capturedFinal || capturedFallback).trim());
        finalize(hasText);
      }, 5000);
    };

    const startWatchdog = () => {
      if (watchdogTimer) clearTimeout(watchdogTimer);
      watchdogTimer = setTimeout(() => {
        try {
          window.Android.stopSpeechRecognition?.();
        } catch {
          // ignore
        }
        finalize(false);
      }, 20000);
    };

    const finalize = (insert) => {
      if (ended) return;
      ended = true;
      stopTimers();
      try {
        delete window[cbName];
      } catch {
        // ignore
      }
      session = null;
      state = 'idle';
      micBtn.classList.remove('mic-btn--active');
      micBtn.classList.remove('mic-btn--speaking');
      micBtn.classList.add('mic-btn--inactive');

      if (!insert) {
        if (stopMode === 'cancel') {
          // Restore base when user cancelled
          setDescriptionLive('');
        }
        stopMode = 'none';
        return;
      }
      const textToInsert = capturedFinal || capturedFallback;
      if (!textToInsert) {
        setDescriptionLive('');
        if (stopMode !== 'cancel') alert(t('stt_not_captured'));
        stopMode = 'none';
        return;
      }
      setDescriptionLive(textToInsert);
      const descriptionField = byId('find-description');
      if (!descriptionField) return;
      descriptionField.focus();
      descriptionField.setSelectionRange(descriptionField.value.length, descriptionField.value.length);
      stopMode = 'none';
    };

    window[cbName] = (text, isFinal, err) => {
      if (err) {
        console.error('Android STT error', err);
        if (stopMode !== 'cancel') alert(explainAndroidSttError(err));
        finalize(false);
        return;
      }

      // Reset silence timer on any callback (even empty partials)
      bumpSilenceTimer();
      startWatchdog();

      const t = (text || '').trim();
      if (t) {
        capturedFallback = t;
        if (isFinal) capturedFinal = t;
        // Live update while speaking
        setDescriptionLive(t);
      }
      if (isFinal) {
        finalize(true);
      }
    };

    // Provide a session stop() that cancels the native recognizer
    session = {
      stop() {
        try {
          window.Android.stopSpeechRecognition?.();
        } catch {
          // ignore
        }
        const hasText = !!((capturedFinal || capturedFallback).trim());
        finalize(stopMode === 'insert' && hasText);
      }
    };

    // Start timers immediately: stop if user doesn't speak for 5s
    bumpSilenceTimer();
    startWatchdog();
    window.Android.startSpeechRecognition(cbName);
  }

  function showVoiceInputFallback() {
    const message = t('stt_fallback_msg');
    
    if (confirm(message)) {
      const descriptionField = byId('find-description');
      descriptionField.focus();
    }
  }

  function showVoiceInputRetry(errorMessage) {
    const message = t('stt_retry_msg', { message: errorMessage });
    
    if (confirm(message)) {
      // User chose to try again - the function will restart automatically
      setTimeout(() => micBtn.click(), 100);
    } else {
      // User chose manual input
      const descriptionField = byId('find-description');
      descriptionField.focus();
    }
  }
}

function wireLanguage() {
  const applyPressed = () => {
    const lang = getLang();
    document.querySelectorAll('.lang-btn[data-lang]').forEach(btn => {
      const pressed = btn.dataset.lang === lang;
      btn.setAttribute('aria-pressed', pressed ? 'true' : 'false');
    });
  };

  document.querySelectorAll('.lang-btn[data-lang]').forEach(btn => {
    btn.addEventListener('click', () => {
      setLang(btn.dataset.lang);
    });
  });

  window.addEventListener('tt-lang-change', () => {
    applyPressed();

    const user = getUser();
    setHello(user);
    fillHome(user);

    // Refresh Add Find dynamic texts (title + save button)
    try {
      const editId = (byId('find-form').dataset.editId || '').trim();
      if (editId) {
        setText('add-find-title', t('add_find_title_edit', { id: editId }));
        byId('btn-save-find').textContent = t('btn_update');
      } else {
        setText('add-find-title', t('add_find_title_add'));
        byId('btn-save-find').textContent = t('btn_save');
      }
    } catch {
      // ignore
    }

    // Re-render list if visible (includes translated empty state)
    const active = document.querySelector('.screen--active')?.id;
    if (active === 'screen-finds') renderFindsList();

    // QR status text depends on language
    updateFindQr();
  });

  applyPressed();
}

document.addEventListener('DOMContentLoaded', () => {
  applyI18nToDom();
  populateSites();
  populatePlotAndLayerOptions();
  wireLanguage();
  wireLogin();
  wirePermissions();
  wireReset();
  wireNavigation();
  wireViewer();
  wireMedia();
  wireFindSave();
  wireFindQrUi();
  wireFindQrScan();
  wireTranscription();
  boot();
});
