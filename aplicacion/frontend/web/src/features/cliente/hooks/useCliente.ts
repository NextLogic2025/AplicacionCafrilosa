import { useCallback, useMemo, useState } from 'react'
import { Conversacion, Entrega, EstadoPedido, Factura, Notificacion, Pedido, PerfilCliente, Producto, SucursalCliente, Ticket } from '../types'
import * as api from '../services/clientApi'

type CrearPedidoDesdeCarritoOptions = Parameters<typeof api.createPedidoFromCart>[0]

export function useCliente() {
  const [perfil, setPerfil] = useState<PerfilCliente | null>(null)
  const [pedidos, setPedidos] = useState<Pedido[]>([])
  const [pedidosTotalPaginas, setPedidosTotalPaginas] = useState(1)
  const [pedidosPaginaActual, setPedidosPaginaActual] = useState(1)
  const [productos, setProductos] = useState<Producto[]>([])
  const [facturas, setFacturas] = useState<Factura[]>([])
  const [entregas, setEntregas] = useState<Entrega[]>([])
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([])
  const [conversaciones, setConversaciones] = useState<Conversacion[]>([])
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [sucursales, setSucursales] = useState<SucursalCliente[]>([])
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const unreadMessageCount = useMemo(
    () => conversaciones.reduce((sum, conv) => sum + (conv.unreadCount || 0), 0),
    [conversaciones],
  )

  const fetchPerfilCliente = useCallback(async () => {
    setCargando(true)
    try {
      const data = await api.getPerfilCliente()
      setPerfil(data ?? null)
    } catch {
      setPerfil(null)
    } finally {
      setCargando(false)
    }
  }, [])

  const fetchPedidos = useCallback(async (pagina = 1) => {
    setCargando(true)
    try {
      const res = await api.getPedidos(pagina)
      const serverItems = (res.items ?? []) as Pedido[]
      setPedidos(serverItems)
      setPedidosPaginaActual(res.page ?? pagina)
      setPedidosTotalPaginas(res.totalPages ?? 1)
    } catch {
      setPedidos([])
      setPedidosPaginaActual(pagina)
      setPedidosTotalPaginas(1)
    } finally {
      setCargando(false)
    }
  }, [])

  const fetchSucursales = useCallback(async () => {
    setCargando(true)
    try {
      const listado = await api.getSucursalesCliente()
      setSucursales(listado ?? [])
    } catch {
      setSucursales([])
    } finally {
      setCargando(false)
    }
  }, [])

  const fetchFacturas = useCallback(async () => {
    setCargando(true)
    try {
      const res = await api.getFacturas()
      setFacturas(res ?? [])
    } catch {
      setFacturas([])
    } finally {
      setCargando(false)
    }
  }, [])

  const fetchEntregas = useCallback(async () => {
    setCargando(true)
    try {
      const res = await api.getEntregas()
      setEntregas(res ?? [])
    } catch {
      setEntregas([])
    } finally {
      setCargando(false)
    }
  }, [])

  const fetchProductos = useCallback(async (options?: { page?: number; per_page?: number; category?: string; categoryId?: number }) => {
    setCargando(true)
    try {
      const res = await api.getProductos(options)
      setProductos(res ?? [])
    } catch {
      setProductos([])
    } finally {
      setCargando(false)
    }
  }, [])

  const fetchNotificaciones = useCallback(async () => {
    setCargando(true)
    try {
      const res = await api.getNotificaciones()
      setNotificaciones(res ?? [])
    } catch {
      setNotificaciones([])
    } finally {
      setCargando(false)
    }
  }, [])

  const fetchConversaciones = useCallback(async () => {
    setCargando(true)
    try {
      const res = await api.getConversaciones()
      setConversaciones(res ?? [])
    } catch {
      setConversaciones([])
    } finally {
      setCargando(false)
    }
  }, [])

  const fetchTickets = useCallback(async () => {
    setCargando(true)
    try {
      const res = await api.getTickets()
      setTickets(res ?? [])
    } catch {
      setTickets([])
    } finally {
      setCargando(false)
    }
  }, [])

  const cancelarPedido = useCallback(async (id: string) => {
    // Optimistically update UI
    setPedidos(prev => prev.map(p => (p.id === id ? { ...p, status: EstadoPedido.CANCELLED } : p)))
    try {
      const ok = await api.deletePedido(id)
      if (!ok) throw new Error('No se pudo cancelar el pedido')
      // success: keep state as is (already marked cancelled)
    } catch (err) {
      // If server fails (404/500), keep optimistic cancel locally and show a non-blocking warning.
      setError('Cancelado localmente (no confirmado por el servidor).')
      // Do not reload list to avoid overwriting the optimistic state.
    }
  }, [fetchPedidos, pedidosPaginaActual])

  const crearTicket = useCallback(async (nuevo: Omit<Ticket, 'id' | 'createdAt' | 'updatedAt' | 'messages'>) => {
    try {
      const creado = await api.createTicket(nuevo)
      setTickets(prev => [creado, ...prev])
    } catch {
      // si falla, no agregamos nada
    }
  }, [])

  const marcarNotificacionComoLeida = useCallback((id: string) => {
    setNotificaciones(prev => prev.map(n => (n.id === id ? { ...n, read: true } : n)))
  }, [])

  const marcarTodasComoLeidas = useCallback(() => {
    setNotificaciones(prev => prev.map(n => ({ ...n, read: true })))
  }, [])

  const limpiarError = useCallback(() => setError(null), [])

  const crearPedidoDesdeCarrito = useCallback(
    async (options?: CrearPedidoDesdeCarritoOptions) => {
      try {
        const nuevo = await api.createPedidoFromCart(options)
        setPedidos(prev => [nuevo, ...prev])
        try {
          window.dispatchEvent(new CustomEvent('pedidoCreado', { detail: { message: 'Pedido creado correctamente' } }))
        } catch {}
        return nuevo
      } catch (err) {
        const message = err instanceof Error ? err.message : 'No se pudo crear el pedido'
        setError(message)
        throw err
      }
    },
    [],
  )

  return {
    perfil,
    pedidos,
    pedidosTotalPaginas,
    pedidosPaginaActual,
    productos,
    facturas,
    entregas,
    notificaciones,
    conversaciones,
    tickets,
    sucursales,
    unreadMessageCount,
    cargando,
    error,
    fetchPerfilCliente,
    fetchPedidos,
    fetchFacturas,
    fetchEntregas,
    fetchProductos,
    fetchNotificaciones,
    fetchConversaciones,
    fetchTickets,
    fetchSucursales,
    cancelarPedido,
    crearTicket,
    marcarNotificacionComoLeida,
    marcarTodasComoLeidas,
    limpiarError,
    crearPedidoDesdeCarrito,
  }
}
