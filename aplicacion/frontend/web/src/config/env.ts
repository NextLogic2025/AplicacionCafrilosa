function readEnv(key: string) {
  return String((import.meta.env as Record<string, unknown>)[key] ?? '').trim()
}

function normalizeBaseUrl(url: string) {
  return url.replace(/\/$/, '')
}

export const env = {
  auth: {
    loginUrl: readEnv('VITE_AUTH_LOGIN_URL'),
    forgotPasswordUrl: readEnv('VITE_AUTH_FORGOT_PASSWORD_URL'),
  },
  api: {
    baseUrl: normalizeBaseUrl(readEnv('VITE_API_BASE_URL')),
  },
} as const
