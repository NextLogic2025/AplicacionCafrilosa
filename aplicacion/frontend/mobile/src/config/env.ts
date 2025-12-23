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
  },
} as const
