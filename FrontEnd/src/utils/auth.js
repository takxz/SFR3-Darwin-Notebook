import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'userToken';
const DEBUG_BYPASS_TOKEN = 'debug-bypass-token';

export function isAuthBypassEnabled() {
  return __DEV__ && process.env.EXPO_PUBLIC_SKIP_AUTH === 'true';
}

export async function saveToken(token) {
  if (!token) return;
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function getToken() {
  if (isAuthBypassEnabled()) {
    return DEBUG_BYPASS_TOKEN;
  }

  return await SecureStore.getItemAsync(TOKEN_KEY);
}

export async function clearToken() {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}
