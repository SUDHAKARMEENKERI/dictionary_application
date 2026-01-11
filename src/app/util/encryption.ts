/**
 * Simple encryption/decryption utility for localStorage data
 * Uses AES-like encryption with a secret key
 */

const SECRET_KEY = 'CareerPrepBook@2026#SecureKey!'; // Change this to a strong secret key

/**
 * Encrypts a string using XOR cipher with the secret key
 * For production, consider using crypto-js or Web Crypto API
 */
export function encrypt(plainText: string): string {
  if (!plainText) return '';
  
  try {
    // Convert to base64 first
    const base64 = btoa(plainText);
    
    // XOR encryption with secret key
    let encrypted = '';
    for (let i = 0; i < base64.length; i++) {
      const charCode = base64.charCodeAt(i) ^ SECRET_KEY.charCodeAt(i % SECRET_KEY.length);
      encrypted += String.fromCharCode(charCode);
    }
    
    // Convert to base64 again for safe storage
    return btoa(encrypted);
  } catch (error) {
    console.error('Encryption error:', error);
    return '';
  }
}

/**
 * Decrypts an encrypted string
 */
export function decrypt(encryptedText: string): string {
  if (!encryptedText) return '';
  
  try {
    // Decode from base64
    const decoded = atob(encryptedText);
    
    // XOR decryption with secret key
    let decrypted = '';
    for (let i = 0; i < decoded.length; i++) {
      const charCode = decoded.charCodeAt(i) ^ SECRET_KEY.charCodeAt(i % SECRET_KEY.length);
      decrypted += String.fromCharCode(charCode);
    }
    
    // Decode from base64 again
    return atob(decrypted);
  } catch (error) {
    console.error('Decryption error:', error);
    return '';
  }
}

/**
 * Encrypts and stores data in localStorage
 */
export function setEncryptedItem(key: string, value: any): void {
  try {
    const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
    const encrypted = encrypt(stringValue);
    localStorage.setItem(key, encrypted);
  } catch (error) {
    console.error('Error setting encrypted item:', error);
  }
}

/**
 * Retrieves and decrypts data from localStorage
 */
export function getEncryptedItem(key: string): string | null {
  try {
    const encrypted = localStorage.getItem(key);
    if (!encrypted) return null;
    
    return decrypt(encrypted);
  } catch (error) {
    console.error('Error getting encrypted item:', error);
    return null;
  }
}

/**
 * Retrieves and decrypts JSON data from localStorage
 */
export function getEncryptedJSON<T = any>(key: string): T | null {
  try {
    const decrypted = getEncryptedItem(key);
    if (!decrypted) return null;
    
    return JSON.parse(decrypted) as T;
  } catch (error) {
    console.error('Error parsing encrypted JSON:', error);
    return null;
  }
}

/**
 * Removes encrypted item from localStorage
 */
export function removeEncryptedItem(key: string): void {
  localStorage.removeItem(key);
}

/**
 * Clears all localStorage
 */
export function clearEncryptedStorage(): void {
  localStorage.clear();
}
