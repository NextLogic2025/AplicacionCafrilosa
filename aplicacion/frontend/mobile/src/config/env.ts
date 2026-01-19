function readEnv(key: string) {
  return String((process.env as Record<string, unknown>)[key] ?? '').trim()
}

function normalizeBaseUrl(url: string) {
  return url.replace(/\/$/, '')
}

function tryExtractOrigin(url: string) {
  try {
    const u = new URL(url)
    return `${u.protocol}//${u.host}`
  } catch {
    return ''
  }
}

export const env = {
  auth: {
    baseUrl: normalizeBaseUrl(readEnv('EXPO_PUBLIC_AUTH_API_URL') || tryExtractOrigin(readEnv('EXPO_PUBLIC_AUTH_LOGIN_URL'))),
    loginUrl: readEnv('EXPO_PUBLIC_AUTH_LOGIN_URL'),
    forgotPasswordUrl: readEnv('EXPO_PUBLIC_AUTH_FORGOT_PASSWORD_URL'),
  },
  api: {
    baseUrl: normalizeBaseUrl(readEnv('EXPO_PUBLIC_API_BASE_URL')),
    catalogUrl: normalizeBaseUrl(readEnv('EXPO_PUBLIC_CATALOG_API_URL') || 'http://10.0.2.2:3002'),
    usersUrl: normalizeBaseUrl(readEnv('EXPO_PUBLIC_USERS_API_URL')),
    ordersUrl: normalizeBaseUrl(readEnv('EXPO_PUBLIC_ORDERS_API_URL') || 'http://10.0.2.2:3004'),
    warehouseUrl: normalizeBaseUrl(readEnv('EXPO_PUBLIC_WAREHOUSE_API_URL') || 'http://10.0.2.2:3005'),
  },
} as const
