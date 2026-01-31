const KEY_FINDS = 'tt.finds.v1';

function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function getFinds() {
  const arr = readJson(KEY_FINDS, []);
  return Array.isArray(arr) ? arr : [];
}

export function getFindById(id) {
  return getFinds().find(f => f?.id === id) || null;
}

export function addFind(find) {
  const finds = getFinds();
  finds.unshift(find);
  writeJson(KEY_FINDS, finds);
}

export function updateFind(updated) {
  const finds = getFinds();
  const idx = finds.findIndex(f => f?.id === updated?.id);
  if (idx === -1) return false;
  finds[idx] = updated;
  writeJson(KEY_FINDS, finds);
  return true;
}

export function deleteFindById(id) {
  const finds = getFinds();
  const next = finds.filter(f => f?.id !== id);
  if (next.length === finds.length) return false;
  writeJson(KEY_FINDS, next);
  return true;
}

export function newFindId() {
  const rand = Math.random().toString(16).slice(2, 8).toUpperCase();
  return `FIND-${Date.now()}-${rand}`;
}
