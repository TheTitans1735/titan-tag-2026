const KEY_USER = 'tt.user.v1';
const KEY_SCRIPT_URL = 'tt.sheets.scriptUrl.v1';

export function getUser() {
  try {
    const raw = localStorage.getItem(KEY_USER);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    if (!parsed.name || !parsed.email || !parsed.role || !parsed.site) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function setUser(user) {
  localStorage.setItem(KEY_USER, JSON.stringify(user));
}

export function clearUser() {
  localStorage.removeItem(KEY_USER);
}

export function getScriptUrl() {
  return (localStorage.getItem(KEY_SCRIPT_URL) || '').trim();
}

export function setScriptUrl(url) {
  const cleaned = (url || '').trim();
  if (!cleaned) {
    localStorage.removeItem(KEY_SCRIPT_URL);
    return;
  }
  localStorage.setItem(KEY_SCRIPT_URL, cleaned);
}
