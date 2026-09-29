const DB_NAME = 'dj-waveform-db';
const DB_VERSION = 2;
const STORE_NAME = 'tracks';
const SETTINGS_STORE_NAME = 'settings';

export interface TrackAnalysis {
    id: string; // "filename_filesize"
    bpm: number;
    offset: number;
    duration: number;
    peaks: { low: number, mid: number, high: number, lowRms: number, midRms: number, highRms: number }[];
    timestamp: number;
    key?: string;
    energyProfile?: number[];
}

export const initDB = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => reject(request.error);
        
        request.onsuccess = () => resolve(request.result);
        
        request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: 'id' });
            }
            if (!db.objectStoreNames.contains(SETTINGS_STORE_NAME)) {
                db.createObjectStore(SETTINGS_STORE_NAME, { keyPath: 'id' });
            }
        };
    });
};

export const saveTrackAnalysis = async (data: TrackAnalysis): Promise<void> => {
    try {
        const db = await initDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(STORE_NAME, 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.put(data);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
            
            transaction.oncomplete = () => db.close();
        });
    } catch (err) {
        console.error("Failed to save to IndexedDB", err);
    }
};

export const getTrackAnalysis = async (id: string): Promise<TrackAnalysis | null> => {
    try {
        const db = await initDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(STORE_NAME, 'readonly');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.get(id);

            request.onsuccess = () => resolve(request.result || null);
            request.onerror = () => reject(request.error);
            
            transaction.oncomplete = () => db.close();
        });
    } catch (err) {
        console.error("Failed to read from IndexedDB", err);
        return null;
    }
};

// ──────────────── SETTINGS / PERSISTENT FILE SYSTEM ────────────────

export const saveDirectoryHandle = async (handle: any): Promise<void> => {
    try {
        const db = await initDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(SETTINGS_STORE_NAME, 'readwrite');
            const store = transaction.objectStore(SETTINGS_STORE_NAME);
            const request = store.put({ id: 'root_music_folder', handle });

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
            transaction.oncomplete = () => db.close();
        });
    } catch (err) {
        console.error("Failed to save directory handle", err);
    }
};

export const getDirectoryHandle = async (): Promise<any | null> => {
    try {
        const db = await initDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(SETTINGS_STORE_NAME, 'readonly');
            const store = transaction.objectStore(SETTINGS_STORE_NAME);
            const request = store.get('root_music_folder');

            request.onsuccess = () => resolve(request.result ? request.result.handle : null);
            request.onerror = () => reject(request.error);
            transaction.oncomplete = () => db.close();
        });
    } catch (err) {
        console.error("Failed to get directory handle", err);
        return null;
    }
};
