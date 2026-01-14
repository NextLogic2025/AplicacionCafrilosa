import * as SecureStore from 'expo-secure-store'

const ACCESS_TOKEN_KEY = 'cafrilosa.access_token'
const REFRESH_TOKEN_KEY = 'cafrilosa.refresh_token'

const USER_NAME_KEY = 'cafrilosa.user_name'

let volatileAccessToken: string | null = null
let volatileRefreshToken: string | null = null
let volatileUserName: string | null = null

export async function getToken() {
  try {
    if (volatileAccessToken) return volatileAccessToken
    return await SecureStore.getItemAsync(ACCESS_TOKEN_KEY)
  } catch {
    return null
  }
}

export async function setToken(token: string, opts?: { persist?: boolean }) {
  const persist = opts?.persist ?? true
  volatileAccessToken = token
  if (persist) await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, token)
  else await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY)
}

export async function getRefreshToken() {
  try {
    if (volatileRefreshToken) return volatileRefreshToken
    return await SecureStore.getItemAsync(REFRESH_TOKEN_KEY)
  } catch {
    return null
  }
}

export async function setRefreshToken(token: string, opts?: { persist?: boolean }) {
  const persist = opts?.persist ?? true
  volatileRefreshToken = token
  if (persist) await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, token)
  else await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY)
}

export async function getUserName() {
  try {
    if (volatileUserName) return volatileUserName
    return await SecureStore.getItemAsync(USER_NAME_KEY)
  } catch {
    return null
  }
}

export async function setUserName(name: string, opts?: { persist?: boolean }) {
  const persist = opts?.persist ?? true
  volatileUserName = name
  if (persist) await SecureStore.setItemAsync(USER_NAME_KEY, name)
  else await SecureStore.deleteItemAsync(USER_NAME_KEY)
}

export async function clearTokens() {
  volatileAccessToken = null
  volatileRefreshToken = null
  volatileUserName = null
  await Promise.all([
    SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY),
    SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY),
    SecureStore.deleteItemAsync(USER_NAME_KEY)
  ])
}

