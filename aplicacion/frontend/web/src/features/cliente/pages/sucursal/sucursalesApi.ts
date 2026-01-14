import { httpCatalogo } from '../../../../services/api/http'

export async function fetchSucursalesByCliente(clienteId: string) {
  return httpCatalogo(`/clientes/${clienteId}/sucursales`).catch(() => [])
}

export async function createSucursal(clienteId: string, dto: any) {
  return httpCatalogo(`/clientes/${clienteId}/sucursales`, { method: 'POST', body: dto }).catch(() => null)
}
