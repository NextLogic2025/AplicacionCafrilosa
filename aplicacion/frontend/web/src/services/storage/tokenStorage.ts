const TOKEN_KEY = 'cafrilosa.token'

export function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY) ?? sessionStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function setToken(token: string, opts?: { persist?: boolean }) {
  const persist = opts?.persist ?? true
  if (persist) localStorage.setItem(TOKEN_KEY, token)
  else sessionStorage.setItem(TOKEN_KEY, token)
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY)
  sessionStorage.removeItem(TOKEN_KEY)
}
