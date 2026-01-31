const DB_NAME = 'titantag.db';
const DB_VERSION = 1;
const STORE = 'media';

function openDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'id' });
      }
    };

    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error || new Error('IndexedDB open failed'));
  });
}

function txDone(tx) {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error || new Error('IndexedDB tx failed'));
    tx.onabort = () => reject(tx.error || new Error('IndexedDB tx aborted'));
  });
}

export async function putMediaItems(items) {
  const db = await openDb();
  const tx = db.transaction(STORE, 'readwrite');
  const store = tx.objectStore(STORE);
  (items || []).forEach(item => {
    if (!item?.id) return;
    store.put({
      id: item.id,
      kind: item.kind,
      mime: item.mime,
      name: item.name,
      blob: item.blob
    });
  });
  await txDone(tx);
  db.close();
}

export async function getMediaItem(id) {
  const db = await openDb();
  const tx = db.transaction(STORE, 'readonly');
  const store = tx.objectStore(STORE);
  const req = store.get(id);
  const value = await new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error || new Error('IndexedDB get failed'));
  });
  await txDone(tx);
  db.close();
  return value;
}

export async function deleteMediaItem(id) {
  const db = await openDb();
  const tx = db.transaction(STORE, 'readwrite');
  tx.objectStore(STORE).delete(id);
  await txDone(tx);
  db.close();
}
