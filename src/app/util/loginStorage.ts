import { setEncryptedItem, getEncryptedJSON, removeEncryptedItem, clearEncryptedStorage } from './encryption';

export interface LoginStorageData {
  isLogIn?: boolean;
  mobile?: string;
  firstName?: string;
  lastName?: string;
  role?: string;
  email?: string;
  admin?: boolean;
}

const LOGIN_KEY = 'login';

/**
 * Reads encrypted login data from localStorage
 */
export function readLoginStorage(): LoginStorageData | null {
  try {
    return getEncryptedJSON<LoginStorageData>(LOGIN_KEY);
  } catch (error) {
    console.error('Error reading login storage:', error);
    return null;
  }
}

/**
 * Saves encrypted login data to localStorage
 */
export function saveLoginStorage(data: LoginStorageData): void {
  try {
    setEncryptedItem(LOGIN_KEY, data);
  } catch (error) {
    console.error('Error saving login storage:', error);
  }
}

/**
 * Updates specific fields in login storage
 */
export function updateLoginStorage(updates: Partial<LoginStorageData>): void {
  const current = readLoginStorage() || {};
  saveLoginStorage({ ...current, ...updates });
}

/**
 * Removes login data from localStorage
 */
export function clearLoginStorage(): void {
  removeEncryptedItem(LOGIN_KEY);
}

/**
 * Clears all localStorage
 */
export function clearAllStorage(): void {
  clearEncryptedStorage();
}

export function readLoginMobile(): string {
  return (readLoginStorage()?.mobile ?? '').toString().trim();
}

export function readLoginDisplayName(): string {
  const login = readLoginStorage();
  if (!login) return '';
  return [login.firstName, login.lastName].filter(Boolean).join(' ').trim();
}

export function isUserLoggedIn(): boolean {
  const login = readLoginStorage();
  return !!(login && login.isLogIn && login.mobile);
}

export function isUserAdmin(): boolean {
  const mobile = (readLoginStorage()?.mobile ?? '').toString().trim();
  return mobile === '9611675325';
}
