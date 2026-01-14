function readEnv(key: string) {
  return String((process.env as Record<string, unknown>)[key] ?? '').trim()
}

function normalizeBaseUrl(url: string) {
  return url.replace(/\/$/, '')
}

export const env = {
  auth: {
    loginUrl: readEnv('EXPO_PUBLIC_AUTH_LOGIN_URL'),
    forgotPasswordUrl: readEnv('EXPO_PUBLIC_AUTH_FORGOT_PASSWORD_URL'),
  },
  api: {
    baseUrl: normalizeBaseUrl(readEnv('EXPO_PUBLIC_API_BASE_URL')),
    catalogUrl: normalizeBaseUrl(readEnv('EXPO_PUBLIC_CATALOG_API_URL') || 'http://10.0.2.2:3002'),
    usersUrl: normalizeBaseUrl(readEnv('EXPO_PUBLIC_USERS_API_URL')),
    // Prioridad: Variable de entorno (para dispositivo físico/LAN).
    // Fallback: 10.0.2.2:3004 (para emulador Android si no hay .env)
    ordersUrl: normalizeBaseUrl(readEnv('EXPO_PUBLIC_ORDERS_API_URL') || 'http://10.0.2.2:3004'),
  },
} as const
