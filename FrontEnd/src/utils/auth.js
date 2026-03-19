import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'userToken';

export async function saveToken(token) {
  if (!token) return;
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function getToken() {
  return await SecureStore.getItemAsync(TOKEN_KEY);
}

export async function clearToken() {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}
