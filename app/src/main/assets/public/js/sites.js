export const DEFAULT_SITES = [
  { name: 'תל מגידו', location: '32.5856,35.1825' },
  { name: 'תל חצור', location: '33.0178,35.5694' },
  { name: 'מצדה', location: '31.3156,35.3536' },
  { name: 'קיסריה', location: '32.5000,34.8928' },
  { name: 'עיר דוד', location: '31.7767,35.2350' },
  { name: 'תל לכיש', location: '31.5591,34.8316' },
  { name: 'תל באר שבע', location: '31.2516,34.7913' },
  { name: 'קומראן', location: '31.7413,35.4602' }
];

// Return all known Israeli sites from storage if present, otherwise fall back to defaults
export function getAllIsraelSites() {
  try {
    const raw = localStorage.getItem('sitesIsrael');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length) return parsed;
    }
  } catch {
    // ignore parsing errors and fall back to defaults
  }
  return DEFAULT_SITES;
}

// Add a new site (by name) to the Israel sites list in storage
export function addIsraelSite(name) {
  const siteName = (name || '').trim();
  if (!siteName) return false;

  const current = getAllIsraelSites().slice();
  if (current.find(s => s.name === siteName)) {
    // already exists
    return false;
  }
  current.push({ name: siteName, location: '' });
  localStorage.setItem('sitesIsrael', JSON.stringify(current));
  return true;
}
