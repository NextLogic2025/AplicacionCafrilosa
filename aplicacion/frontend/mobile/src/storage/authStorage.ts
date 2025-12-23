import * as SecureStore from 'expo-secure-store'

const TOKEN_KEY = 'cafrilosa.token'
let volatileToken: string | null = null

export async function getToken() {
  try {
    if (volatileToken) return volatileToken
    return await SecureStore.getItemAsync(TOKEN_KEY)
  } catch {
    return null
  }
}

export async function setToken(token: string, opts?: { persist?: boolean }) {
  const persist = opts?.persist ?? true
  volatileToken = token
  if (persist) await SecureStore.setItemAsync(TOKEN_KEY, token)
  else await SecureStore.deleteItemAsync(TOKEN_KEY)
}

export async function clearToken() {
  volatileToken = null
  await SecureStore.deleteItemAsync(TOKEN_KEY)
}
