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
  },
  // Feature flags / toggles
  featureFlags: {
    // Si se establece a '1', se desactiva el uso/creación de pedidos locales (fallback en localStorage)
    disableLocalPedidos: readEnv('VITE_DISABLE_LOCAL_PEDIDOS') === '1',
    httpDebug: readEnv('VITE_HTTP_DEBUG') === '1',
    showDebugEndpoints: readEnv('VITE_SHOW_DEBUG_ENDPOINTS') === '1' || import.meta.env.DEV === true,
  },
  googleMaps: {
    apiKey: readEnv('VITE_GOOGLE_MAPS_API_KEY'),
  },
} as const
