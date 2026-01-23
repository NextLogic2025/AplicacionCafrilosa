import { z } from 'zod'

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

function getRawEnv(key: string): string | undefined {
  const value = (process.env as Record<string, string | undefined>)[key]
  if (!value) return undefined
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : undefined
}

const envSchema = z.object({
  EXPO_PUBLIC_AUTH_API_URL: z.string().url().optional(),
  EXPO_PUBLIC_AUTH_LOGIN_URL: z.string().url(),
  EXPO_PUBLIC_AUTH_FORGOT_PASSWORD_URL: z.string().url().optional(),
  EXPO_PUBLIC_API_BASE_URL: z.string().url(),
  EXPO_PUBLIC_CATALOG_API_URL: z.string().url().optional(),
  EXPO_PUBLIC_USERS_API_URL: z.string().url(),
  EXPO_PUBLIC_ORDERS_API_URL: z.string().url().optional(),
  EXPO_PUBLIC_WAREHOUSE_API_URL: z.string().url().optional(),
  EXPO_PUBLIC_LOGISTICS_API_URL: z.string().url().optional(),
  EXPO_PUBLIC_FINANCE_API_URL: z.string().url().optional(),
})

const parsedEnv = envSchema.safeParse({
  EXPO_PUBLIC_AUTH_API_URL: getRawEnv('EXPO_PUBLIC_AUTH_API_URL'),
  EXPO_PUBLIC_AUTH_LOGIN_URL: getRawEnv('EXPO_PUBLIC_AUTH_LOGIN_URL'),
  EXPO_PUBLIC_AUTH_FORGOT_PASSWORD_URL: getRawEnv('EXPO_PUBLIC_AUTH_FORGOT_PASSWORD_URL'),
  EXPO_PUBLIC_API_BASE_URL: getRawEnv('EXPO_PUBLIC_API_BASE_URL'),
  EXPO_PUBLIC_CATALOG_API_URL: getRawEnv('EXPO_PUBLIC_CATALOG_API_URL'),
  EXPO_PUBLIC_USERS_API_URL: getRawEnv('EXPO_PUBLIC_USERS_API_URL'),
  EXPO_PUBLIC_ORDERS_API_URL: getRawEnv('EXPO_PUBLIC_ORDERS_API_URL'),
  EXPO_PUBLIC_WAREHOUSE_API_URL: getRawEnv('EXPO_PUBLIC_WAREHOUSE_API_URL'),
  EXPO_PUBLIC_LOGISTICS_API_URL: getRawEnv('EXPO_PUBLIC_LOGISTICS_API_URL'),
  EXPO_PUBLIC_FINANCE_API_URL: getRawEnv('EXPO_PUBLIC_FINANCE_API_URL'),
})

if (!parsedEnv.success) {
  console.error('Variables de entorno inválidas. Verifica EXPO_PUBLIC_* en tu .env o tu entorno:', parsedEnv.error.format())
  throw new Error('Configuración del entorno inválida')
}

const {
  EXPO_PUBLIC_AUTH_API_URL,
  EXPO_PUBLIC_AUTH_LOGIN_URL,
  EXPO_PUBLIC_AUTH_FORGOT_PASSWORD_URL,
  EXPO_PUBLIC_API_BASE_URL,
  EXPO_PUBLIC_CATALOG_API_URL,
  EXPO_PUBLIC_USERS_API_URL,
  EXPO_PUBLIC_ORDERS_API_URL,
  EXPO_PUBLIC_WAREHOUSE_API_URL,
  EXPO_PUBLIC_LOGISTICS_API_URL,
  EXPO_PUBLIC_FINANCE_API_URL,
} = parsedEnv.data

const DEFAULT_URLS = {
  catalog: 'http://10.0.2.2:3002',
  orders: 'http://10.0.2.2:3004',
  warehouse: 'http://10.0.2.2:3005',
  logistics: 'http://10.0.2.2:3006',
  finance: 'http://10.0.2.2:3007',
}

export const env = {
  auth: {
    baseUrl: normalizeBaseUrl(EXPO_PUBLIC_AUTH_API_URL || tryExtractOrigin(EXPO_PUBLIC_AUTH_LOGIN_URL)),
    loginUrl: EXPO_PUBLIC_AUTH_LOGIN_URL,
    forgotPasswordUrl: EXPO_PUBLIC_AUTH_FORGOT_PASSWORD_URL ?? '',
  },
  api: {
    baseUrl: normalizeBaseUrl(EXPO_PUBLIC_API_BASE_URL),
    catalogUrl: normalizeBaseUrl(EXPO_PUBLIC_CATALOG_API_URL ?? DEFAULT_URLS.catalog),
    usersUrl: normalizeBaseUrl(EXPO_PUBLIC_USERS_API_URL),
    ordersUrl: normalizeBaseUrl(EXPO_PUBLIC_ORDERS_API_URL ?? DEFAULT_URLS.orders),
    warehouseUrl: normalizeBaseUrl(EXPO_PUBLIC_WAREHOUSE_API_URL ?? DEFAULT_URLS.warehouse),
    logisticsUrl: normalizeBaseUrl(EXPO_PUBLIC_LOGISTICS_API_URL ?? DEFAULT_URLS.logistics),
    financeUrl: normalizeBaseUrl(EXPO_PUBLIC_FINANCE_API_URL ?? DEFAULT_URLS.finance),
  },
} as const
