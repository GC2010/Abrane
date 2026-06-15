// Stores FileSystemDirectoryHandle objects in browser IndexedDB.
// These cannot be JSON-serialized to Supabase — local IDB only.

const DB_NAME = 'abrane_folder_links';
const STORE = 'links';

function openDb() {
  return new Promise((res, rej) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = e => e.target.result.createObjectStore(STORE, { keyPath: 'catId' });
    req.onsuccess = e => res(e.target.result);
    req.onerror = e => rej(e.target.error);
  });
}

export async function saveFolderLink(catId, dirHandle, subfolderName, fileSnapshots) {
  const db = await openDb();
  return new Promise((res, rej) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put({ catId, dirHandle, subfolderName, fileSnapshots });
    tx.oncomplete = res;
    tx.onerror = e => rej(e.target.error);
  });
}

export async function getFolderLink(catId) {
  const db = await openDb();
  return new Promise((res, rej) => {
    const req = db.transaction(STORE, 'readonly').objectStore(STORE).get(catId);
    req.onsuccess = e => res(e.target.result || null);
    req.onerror = e => rej(e.target.error);
  });
}

export async function getAllFolderLinks(catIds) {
  const db = await openDb();
  return new Promise((res, rej) => {
    const req = db.transaction(STORE, 'readonly').objectStore(STORE).getAll();
    req.onsuccess = e => {
      const all = e.target.result || [];
      res(catIds ? all.filter(l => catIds.includes(l.catId)) : all);
    };
    req.onerror = e => rej(e.target.error);
  });
}
