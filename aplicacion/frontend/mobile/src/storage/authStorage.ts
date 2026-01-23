import { secureDeleteItem, secureGetItem, secureSetItem } from './secureStorage'

const ACCESS_TOKEN_KEY = 'cafrilosa.access_token'
const REFRESH_TOKEN_KEY = 'cafrilosa.refresh_token'

const USER_NAME_KEY = 'cafrilosa.user_name'

let volatileAccessToken: string | null = null
let volatileRefreshToken: string | null = null
let volatileUserName: string | null = null

export async function getToken() {
  try {
    if (volatileAccessToken) return volatileAccessToken
    return await secureGetItem(ACCESS_TOKEN_KEY)
  } catch {
    return null
  }
}

export async function setToken(token: string, opts?: { persist?: boolean }) {
  const persist = opts?.persist ?? true
  volatileAccessToken = token
  if (persist) await secureSetItem(ACCESS_TOKEN_KEY, token)
  else await secureDeleteItem(ACCESS_TOKEN_KEY)
}

export async function getRefreshToken() {
  try {
    if (volatileRefreshToken) return volatileRefreshToken
    return await secureGetItem(REFRESH_TOKEN_KEY)
  } catch {
    return null
  }
}

export async function setRefreshToken(token: string, opts?: { persist?: boolean }) {
  const persist = opts?.persist ?? true
  volatileRefreshToken = token
  if (persist) await secureSetItem(REFRESH_TOKEN_KEY, token)
  else await secureDeleteItem(REFRESH_TOKEN_KEY)
}

export async function getUserName() {
  try {
    if (volatileUserName) return volatileUserName
    return await secureGetItem(USER_NAME_KEY)
  } catch {
    return null
  }
}

export async function setUserName(name: string, opts?: { persist?: boolean }) {
  const persist = opts?.persist ?? true
  volatileUserName = name
  if (persist) await secureSetItem(USER_NAME_KEY, name)
  else await secureDeleteItem(USER_NAME_KEY)
}

export async function clearTokens() {
  volatileAccessToken = null
  volatileRefreshToken = null
  volatileUserName = null
  await Promise.all([
    secureDeleteItem(ACCESS_TOKEN_KEY),
    secureDeleteItem(REFRESH_TOKEN_KEY),
    secureDeleteItem(USER_NAME_KEY)
  ])
}

