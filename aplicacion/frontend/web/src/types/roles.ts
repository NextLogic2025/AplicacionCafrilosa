export type AppRole = 'cliente' | 'supervisor' | 'vendedor' | 'transportista' | 'bodeguero'

export const APP_ROLES: Array<{ key: AppRole; label: string; path: string }> = [
  { key: 'cliente', label: 'Cliente', path: '/cliente' },
  { key: 'supervisor', label: 'Supervisor', path: '/supervisor' },
  { key: 'vendedor', label: 'Vendedor', path: '/vendedor' },
  { key: 'transportista', label: 'Transportista', path: '/transportista' },
  { key: 'bodeguero', label: 'Bodeguero', path: '/bodeguero' },
]
