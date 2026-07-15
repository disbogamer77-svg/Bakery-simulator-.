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

// Global Cloud Sharing APIs for user-to-user photo sharing via Firestore
import { db, auth } from '../lib/firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  deleteDoc, 
  getDocFromServer 
} from 'firebase/firestore';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// CRITICAL CONSTRAINT: When the application initially boots, call getFromServer to test the connection.
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration.");
    }
  }
}
testConnection();

export async function saveCaptureToServer(capture: Omit<CapturedPhoto, 'id'>, _token?: string | null): Promise<CapturedPhoto | null> {
  const id = Date.now() + Math.floor(Math.random() * 1000);
  const path = `captures/${id}`;
  try {
    const docRef = doc(db, 'captures', String(id));
    const payload = {
      photo: capture.photo,
      timestamp: capture.timestamp,
      itemType: capture.itemType,
      temperature: capture.temperature,
      isOfficial: !!capture.isOfficial,
      userId: auth.currentUser?.uid || null
    };
    await setDoc(docRef, payload);
    return { id, ...payload };
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, path);
    return null;
  }
}

export async function getCapturesFromServer(_token?: string | null): Promise<CapturedPhoto[]> {
  const path = 'captures';
  try {
    const q = collection(db, 'captures');
    const snapshot = await getDocs(q);
    const results: CapturedPhoto[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      results.push({
        id: Number(doc.id),
        photo: data.photo,
        timestamp: data.timestamp,
        itemType: data.itemType as any,
        temperature: data.temperature,
        isOfficial: data.isOfficial,
      });
    });
    return results;
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
    return [];
  }
}

export async function clearCapturesOnServer(_token?: string | null): Promise<boolean> {
  const path = 'captures';
  try {
    const q = collection(db, 'captures');
    const snapshot = await getDocs(q);
    const deletePromises: Promise<void>[] = [];
    snapshot.forEach((doc) => {
      deletePromises.push(deleteDoc(doc.ref));
    });
    await Promise.all(deletePromises);
    return true;
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
    return false;
  }
}

export async function deleteCaptureFromServer(id: number, _token?: string | null): Promise<boolean> {
  const path = `captures/${id}`;
  try {
    const docRef = doc(db, 'captures', String(id));
    await deleteDoc(docRef);
    return true;
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
    return false;
  }
}

