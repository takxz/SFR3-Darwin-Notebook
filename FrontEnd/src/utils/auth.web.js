const TOKEN_KEY = 'userToken';
const DEBUG_BYPASS_TOKEN = 'debug-bypass-token';

export function isAuthBypassEnabled() {
  return __DEV__ && typeof process !== 'undefined' && process.env.EXPO_PUBLIC_SKIP_AUTH === 'true';
}

export async function saveToken(token) {
  if (!token) return;
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch (e) {
    console.warn('LocalStorage not available:', e);
  }
}

export async function getToken() {
  if (isAuthBypassEnabled()) {
    return DEBUG_BYPASS_TOKEN;
  }

  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch (e) {
    console.warn('LocalStorage access error:', e);
    return null;
  }
}

export async function clearToken() {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch (e) {
    console.warn('LocalStorage clear error:', e);
  }
}
