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

export function addFind(find) {
  const finds = getFinds();
  finds.unshift(find);
  writeJson(KEY_FINDS, finds);
}

export function newFindId() {
  const rand = Math.random().toString(16).slice(2, 8).toUpperCase();
  return `FIND-${Date.now()}-${rand}`;
}
