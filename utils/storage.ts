// -------------------------------------------------------------
// utils/storage.ts
// Upload history (AsyncStorage) + Company ID (SecureStore)
//
// WHY two different stores?
//   AsyncStorage  — plain text, survives app updates, fine for
//                   non-sensitive history data (filenames, dates).
//   SecureStore   — encrypted Keystore (Android) / Keychain (iOS),
//                   required for any user-identity value like companyId
//                   that must not be readable from plain storage.
// -------------------------------------------------------------

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { UploadHistoryItem } from '@/types/models';

// ── Keys ──────────────────────────────────────────────────────
const HISTORY_KEY      = '@efr_upload_history';
const COMPANY_ID_KEY   = 'efr_company_id';   // SecureStore: no @ prefix needed
const MAX_HISTORY_ITEMS = 20;

// ── Upload History (AsyncStorage — non-sensitive) ─────────────

export async function getUploadHistory(): Promise<UploadHistoryItem[]> {
  try {
    const raw = await AsyncStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as UploadHistoryItem[];
  } catch {
    return [];
  }
}

export async function saveUploadToHistory(item: UploadHistoryItem): Promise<void> {
  try {
    const existing = await getUploadHistory();
    const updated = [item, ...existing].slice(0, MAX_HISTORY_ITEMS);
    await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
  } catch (e) {
    console.warn('[Storage] Failed to save upload history:', e);
  }
}

export async function clearUploadHistory(): Promise<void> {
  try {
    await AsyncStorage.removeItem(HISTORY_KEY);
  } catch (e) {
    console.warn('[Storage] Failed to clear upload history:', e);
  }
}

// ── Company ID (SecureStore — user-identity value) ────────────

/**
 * Read the stored company ID.
 * Returns null if not yet saved (user not logged in, or first install).
 */
export async function getCompanyId(): Promise<number | null> {
  const idStr = await SecureStore.getItemAsync(COMPANY_ID_KEY);
  return idStr ? parseInt(idStr, 10) : null;
}

/**
 * Persist the company ID after a successful login.
 * Stored in SecureStore (encrypted) so it cannot be read from plain storage.
 */
export async function saveCompanyId(id: number): Promise<void> {
  await SecureStore.setItemAsync(COMPANY_ID_KEY, id.toString());
}

/**
 * Remove the company ID on logout.
 * Call this alongside clearTokens() in authService so the user's
 * identity data is fully wiped from the device.
 */
export async function clearCompanyId(): Promise<void> {
  await SecureStore.deleteItemAsync(COMPANY_ID_KEY);
}

