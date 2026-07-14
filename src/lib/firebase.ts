import { db } from '../lib/firebase';
import {
  collection,
  addDoc,
  query,
  where,
  onSnapshot,
  deleteDoc,
  doc,
  orderBy,
  Timestamp
} from 'firebase/firestore';

export interface CapturedPhoto {
  id?: string;
  photo: string; // Base64 data URL
  timestamp: number;
  itemType: 'bread' | 'pizza' | 'croissant' | 'cake' | 'cookie' | 'pie' | 'dough' | 'hamburger';
  temperature: number;
  isOfficial?: boolean;
  code?: string;
}

const CAPTURES_COLLECTION = 'captures';

// Local IndexedDB (نتركها كما هي كنسخة احتياطية محلية فقط)
const DB_NAME = 'OvenSimulatorDB';
const STORE_NAME = 'captures';
const DB_VERSION = 1;

export function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = () => {
      const dbLocal = request.result;
      if (!dbLocal.objectStoreNames.contains(STORE_NAME)) {
        dbLocal.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
      }
    };
  });
}

export async function saveCapture(capture: Omit<CapturedPhoto, 'id'>): Promise<number> {
  try {
    const dbLocal = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = dbLocal.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.add(capture);
      request.onsuccess = () => resolve(request.result as number);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Failed to save capture locally:', error);
    return 0;
  }
}

export async function getAllCaptures(): Promise<CapturedPhoto[]> {
  try {
    const dbLocal = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = dbLocal.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result as CapturedPhoto[]);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    return [];
  }
}

export async function deleteCapture(id: number): Promise<void> {
  try {
    const dbLocal = await openDatabase();
    const transaction = dbLocal.transaction(STORE_NAME, 'readwrite');
    transaction.objectStore(STORE_NAME).delete(id);
  } catch (error) {
    console.error('Failed to delete local capture:', error);
  }
}

export async function clearAllCaptures(): Promise<void> {
  try {
    const dbLocal = await openDatabase();
    const transaction = dbLocal.transaction(STORE_NAME, 'readwrite');
    transaction.objectStore(STORE_NAME).clear();
  } catch (error) {
    console.error('Failed to clear local captures:', error);
  }
}

// ============ Firebase Cloud Sharing (بديل السيرفر القديم بالكامل) ============

export async function saveCaptureToServer(
  capture: Omit<CapturedPhoto, 'id'>,
  code: string = '2007'
): Promi
