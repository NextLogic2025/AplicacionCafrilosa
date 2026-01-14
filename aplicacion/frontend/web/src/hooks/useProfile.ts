import * as React from 'react'

import { fetchProfile, type UserProfile } from '../services/auth/authApi'
import { fetchClienteByUsuarioId } from '../features/cliente/services/clientApi'
import { obtenerVendedores, updateUsuario, getUsuario } from '../features/supervisor/services/usuariosApi'

export function useProfile() {
  const [profile, setProfile] = React.useState<UserProfile | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [client, setClient] = React.useState<any | null>(null)
  const [clientLoading, setClientLoading] = React.useState(false)
  const [clientError, setClientError] = React.useState<string | null>(null)
  const [vendedorMap, setVendedorMap] = React.useState<Record<string, { id: string; nombre: string }>>({})
  const fetchedVendorIds = React.useRef<Set<string>>(new Set())

  const loadProfile = React.useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchProfile()
      setProfile(data)
    } catch (e) {
      const message = e instanceof Error ? e.message : 'No se pudo obtener el perfil'
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [])

  const loadClient = React.useCallback(async () => {
    if (!profile?.id) return
    setClientLoading(true)
    setClientError(null)
    try {
      const clienteData = await fetchClienteByUsuarioId(profile.id)
      setClient(clienteData)
      // Si el cliente trae el nombre del vendedor en la carga, usarlo como caché
      // Si el cliente trae el nombre del vendedor en la carga, usarlo como caché
      const cachedVendorName = (clienteData as any)?.nombre_vendedor_cache ?? (clienteData as any)?.vendedor_nombre
      if (clienteData?.vendedor_asignado_id && cachedVendorName) {
        setVendedorMap((prev) => ({
          ...prev,
          [clienteData.vendedor_asignado_id]: {
            id: clienteData.vendedor_asignado_id,
            nombre: cachedVendorName,
          },
        }))
      }
      if (clienteData?.vendedor_asignado_id && clienteData?.nombre_vendedor_cache) {
        setVendedorMap((prev) => ({
          ...prev,
          [clienteData.vendedor_asignado_id]: {
            id: clienteData.vendedor_asignado_id,
            nombre: clienteData.nombre_vendedor_cache,
          },
        }))
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : 'No se pudo obtener el cliente'
      setClientError(message)
    } finally {
      setClientLoading(false)
    }
  }, [profile?.id])

  const loadVendedores = React.useCallback(async () => {
    try {
      const vendedores = await obtenerVendedores()
      const map: Record<string, { id: string; nombre: string }> = {}
      vendedores.forEach((v) => {
        map[v.id] = { id: v.id, nombre: v.nombre }
      })
      setVendedorMap(map)
    } catch (e) {
      console.error('Error al cargar vendedores:', e)
    }
  }, [])

  const updateProfile = React.useCallback(async (data: { nombre?: string; telefono?: string | null; avatarUrl?: string | null }) => {
    if (!profile?.id) throw new Error('No hay perfil cargado')
    try {
      const updatedProfile = await updateUsuario(profile.id, data)
      setProfile(updatedProfile)
    } catch (e) {
      const message = e instanceof Error ? e.message : 'No se pudo actualizar el perfil'
      setError(message)
      throw e
    }
  }, [profile?.id])

  const updateClient = React.useCallback(async (data: { identificacion?: string | null; tipo_identificacion?: string | null; razon_social?: string | null; nombre_comercial?: string | null }) => {
    if (!client?.id) throw new Error('No hay cliente cargado')
    try {
      // Aquí deberías implementar la lógica para actualizar el cliente
      // Por ahora, simulamos una actualización local
      setClient({ ...client, ...data })
    } catch (e) {
      const message = e instanceof Error ? e.message : 'No se pudo actualizar el cliente'
      setClientError(message)
      throw e
    }
  }, [client])

  React.useEffect(() => {
    loadProfile()
  }, [loadProfile])

  // Cargar vendedores solo si el usuario tiene permisos (admin/supervisor)
  React.useEffect(() => {
    const rol = profile?.rol?.nombre?.toLowerCase?.()
    if (rol === 'admin' || rol === 'supervisor') {
      loadVendedores()
    }
  }, [profile?.rol?.nombre, loadVendedores])

  React.useEffect(() => {
    const vendorId = typeof client?.vendedor_asignado_id === 'string' ? client.vendedor_asignado_id : null
    
    if (!vendorId) return
    if (vendedorMap[vendorId]) return
    if (fetchedVendorIds.current.has(vendorId)) return

    fetchedVendorIds.current.add(vendorId)
    let cancelled = false

    ;(async () => {
      try {
        const vendor = await getUsuario(vendorId)
        if (!cancelled) {
          if (vendor && vendor.id) {
            setVendedorMap((prev) => ({ ...prev, [vendor.id]: { id: vendor.id, nombre: vendor.nombre } }))
          } else {
            // No existe el vendedor en el servicio de usuarios
            setVendedorMap((prev) => ({ ...prev, [vendorId]: { id: vendorId, nombre: 'Vendedor no disponible' } }))
          }
        }
      } catch (err) {
        if (!cancelled) {
          // Guardar marcador vacío para evitar reintentos en bucle
          setVendedorMap((prev) => ({ ...prev, [vendorId]: { id: vendorId, nombre: 'Vendedor no disponible' } }))
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [client?.vendedor_asignado_id, vendedorMap])

  React.useEffect(() => {
    const rol = profile?.rol?.nombre?.toLowerCase?.()
    if (profile?.id && rol === 'cliente') {
      loadClient()
    } else {
      // Evitar 404 innecesarios en perfiles que no son cliente
      if (client !== null) setClient(null)
      if (clientError) setClientError(null)
      if (clientLoading) setClientLoading(false)
    }
  }, [profile?.id, profile?.rol?.nombre, loadClient])

  return {
    profile,
    loading,
    error,
    refresh: loadProfile,
    updateProfile,
    client,
    clientLoading,
    clientError,
    vendedorMap,
    updateClient,
  }
}
