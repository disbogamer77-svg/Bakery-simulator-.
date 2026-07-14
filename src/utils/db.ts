// Robust IndexedDB helper for storing camera captures client-side.

export interface CapturedPhoto {
  id?: number;
  photo: string; // Base64 data URL
  timestamp: number;
  itemType: 'bread' | 'pizza' | 'croissant' | 'cake' | 'cookie' | 'pie' | 'dough' | 'hamburger';
  temperature: number;
  isOfficial?: boolean;
}

const DB_NAME = 'OvenSimulatorDB';
const STORE_NAME = 'captures';
const DB_VERSION = 1;

export function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(request.error);
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
      }
    };
  });
}

export async function saveCapture(capture: Omit<CapturedPhoto, 'id'>): Promise<number> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(transaction.objectStoreNames[0]);
      const request = store.add(capture);

      request.onsuccess = () => {
        resolve(request.result as number);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  } catch (error) {
    console.error('Failed to save capture to IndexedDB:', error);
    // Fallback to localStorage
    const fallbackList = JSON.parse(localStorage.getItem('captures_fallback') || '[]');
    const newId = fallbackList.length + 1;
    const item = { id: newId, ...capture };
    fallbackList.push(item);
    localStorage.setItem('captures_fallback', JSON.stringify(fallbackList));
    return newId;
  }
}

export async function getAllCaptures(): Promise<CapturedPhoto[]> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        resolve(request.result as CapturedPhoto[]);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  } catch (error) {
    console.error('Failed to get captures from IndexedDB, using localStorage:', error);
    return JSON.parse(localStorage.getItem('captures_fallback') || '[]');
  }
}

export async function deleteCapture(id: number): Promise<void> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(id);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  } catch (error) {
    console.error('Failed to delete capture, updating localStorage:', error);
    const fallbackList = JSON.parse(localStorage.getItem('captures_fallback') || '[]');
    const filtered = fallbackList.filter((item: any) => item.id !== id);
    localStorage.setItem('captures_fallback', JSON.stringify(filtered));
  }
}

export async function clearAllCaptures(): Promise<void> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.clear();

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  } catch (error) {
    localStorage.removeItem('captures_fallback');
  }
}

// Global Cloud Sharing APIs for user-to-user photo sharing via code "2007"
export async function saveCaptureToServer(capture: Omit<CapturedPhoto, 'id'>, token?: string | null): Promise<CapturedPhoto | null> {
  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    const response = await fetch('/api/captures', {
      method: 'POST',
      headers,
      body: JSON.stringify(capture)
    });
    if (!response.ok) throw new Error('Failed to save photo to cloud server');
    return await response.json();
  } catch (err) {
    console.error('Failed to save capture to server:', err);
    return null;
  }
}

export async function getCapturesFromServer(token?: string | null): Promise<CapturedPhoto[]> {
  try {
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    const response = await fetch('/api/captures', { headers });
    if (!response.ok) throw new Error('Failed to get captures from cloud server');
    return await response.json();
  } catch (err) {
    console.error('Failed to get captures from server:', err);
    return [];
  }
}

export async function clearCapturesOnServer(token?: string | null): Promise<boolean> {
  try {
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    const response = await fetch('/api/captures/clear', { 
      method: 'POST',
      headers
    });
    return response.ok;
  } catch (err) {
    console.error('Failed to clear captures on server:', err);
    return false;
  }
}

export async function deleteCaptureFromServer(id: number, token?: string | null): Promise<boolean> {
  try {
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    const response = await fetch(`/api/captures/${id}`, { 
      method: 'DELETE',
      headers
    });
    return response.ok;
  } catch (err) {
    console.error('Failed to delete capture from server:', err);
    return false;
  }
}

