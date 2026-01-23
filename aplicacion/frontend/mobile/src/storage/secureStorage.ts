import * as SecureStore from 'expo-secure-store'

let secureStoreAvailable: boolean | null = null

async function ensureSecureStoreAvailable() {
  if (secureStoreAvailable === null) {
    try {
      secureStoreAvailable = await SecureStore.isAvailableAsync()
    } catch {
      secureStoreAvailable = false
    }
  }

  return secureStoreAvailable
}

export async function secureGetItem(key: string) {
  if (!(await ensureSecureStoreAvailable())) return null

  try {
    return await SecureStore.getItemAsync(key)
  } catch {
    return null
  }
}

export async function secureSetItem(key: string, value: string) {
  if (!(await ensureSecureStoreAvailable())) return

  try {
    await SecureStore.setItemAsync(key, value)
  } catch {
    // ignore storage errors; volatile cache is still valid
  }
}

export async function secureDeleteItem(key: string) {
  if (!(await ensureSecureStoreAvailable())) return

  try {
    await SecureStore.deleteItemAsync(key)
  } catch {
    // swallow failures to avoid noisy crashes
  }
}
