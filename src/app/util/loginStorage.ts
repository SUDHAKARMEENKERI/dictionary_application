export interface LoginStorageData {
  isLogIn?: boolean;
  mobile?: string;
  firstName?: string;
  lastName?: string;
}

export function readLoginStorage(): LoginStorageData | null {
  const raw = localStorage.getItem('login');
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    return parsed as LoginStorageData;
  } catch {
    return null;
  }
}

export function readLoginMobile(): string {
  return (readLoginStorage()?.mobile ?? '').toString().trim();
}

export function readLoginDisplayName(): string {
  const login = readLoginStorage();
  if (!login) return '';
  return [login.firstName, login.lastName].filter(Boolean).join(' ').trim();
}
