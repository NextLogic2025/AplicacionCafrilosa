function readEnv(key: string) {
  return String((import.meta.env as Record<string, unknown>)[key] ?? '').trim()
}

function normalizeBaseUrl(url: string) {
  return url.replace(/\/$/, '')
}

export const env = {
  api: {
    auth: normalizeBaseUrl(readEnv('VITE_AUTH_BASE_URL')),
    usuarios: normalizeBaseUrl(readEnv('VITE_USUARIOS_BASE_URL')),
    catalogo: normalizeBaseUrl(readEnv('VITE_CATALOGO_BASE_URL')),
    orders: normalizeBaseUrl(readEnv('VITE_orders_BASE_URL')),
    warehouse: normalizeBaseUrl(readEnv('VITE_WAREHOUSE_BASE_URL')),
  },
  googleMaps: {
    apiKey: readEnv('VITE_GOOGLE_MAPS_API_KEY'),
  },
} as const
