export type AppRole = 'cliente' | 'supervisor' | 'vendedor' | 'transportista' | 'bodeguero'

export const APP_ROLES: Array<{ key: AppRole; label: string; path: string }> = [
  { key: 'cliente', label: 'Cliente', path: '/cliente' },
  { key: 'supervisor', label: 'Supervisor', path: '/app/supervisor' },
  { key: 'vendedor', label: 'Vendedor', path: '/app/vendedor' },
  { key: 'transportista', label: 'Transportista', path: '/app/transportista' },
  { key: 'bodeguero', label: 'Bodeguero', path: '/bodeguero' },
]
