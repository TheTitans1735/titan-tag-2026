export function byId(id) {
  const el = document.getElementById(id);
  if (!el) throw new Error(`Missing element: ${id}`);
  return el;
}

export function showScreen(screenId) {
  const screens = document.querySelectorAll('.screen');
  screens.forEach(s => s.classList.remove('screen--active'));
  byId(screenId).classList.add('screen--active');
}

export function setText(id, text) {
  byId(id).textContent = text;
}

export function setStatus(id, lines) {
  const text = Array.isArray(lines) ? lines.join('\n') : String(lines || '');
  byId(id).textContent = text;
}
