import { getScriptUrl } from './storage.js';

function withQuery(url, params) {
  const u = new URL(url);
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null) return;
    u.searchParams.set(k, String(v));
  });
  return u.toString();
}

async function fetchJson(url, init) {
  const res = await fetch(url, init);
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error(`Sheets API returned non-JSON: ${text.slice(0, 200)}`);
  }
  if (!res.ok) {
    throw new Error(`Sheets API HTTP ${res.status}: ${text.slice(0, 200)}`);
  }
  if (json.status !== 'success') {
    throw new Error(json.data || 'Sheets API error');
  }
  return json.data;
}

export function getConfiguredScriptUrl() {
  return getScriptUrl();
}

export async function sheetsRead(sheet) {
  const base = getConfiguredScriptUrl();
  if (!base) throw new Error('לא הוגדרה כתובת Google Apps Script');
  const url = withQuery(base, { action: 'read', sheet });
  return fetchJson(url);
}

export async function sheetsWrite(sheet, rowObject) {
  const base = getConfiguredScriptUrl();
  if (!base) throw new Error('לא הוגדרה כתובת Google Apps Script');
  const body = new URLSearchParams({ action: 'write', sheet, ...rowObject });
  return fetchJson(base, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
    body
  });
}
