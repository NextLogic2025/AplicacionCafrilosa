import { useCallback, useMemo, useState } from 'react'
import { Conversacion, Entrega, EstadoPedido, Factura, Notificacion, Pedido, PerfilCliente, Producto, Ticket } from '../types'
import * as api from '../services/clientApi'

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
      setPedidos(res.items ?? [])
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

  const cancelarPedido = useCallback((id: string) => {
    setPedidos(prev =>
      prev.map(p => (p.id === id ? { ...p, status: EstadoPedido.CANCELLED } : p)),
    )
  }, [])

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
    cancelarPedido,
    crearTicket,
    marcarNotificacionComoLeida,
    marcarTodasComoLeidas,
    limpiarError,
    crearPedidoDesdeCarrito: async () => {
      try {
        const nuevo = await api.createPedidoFromCart()
        setPedidos(prev => [nuevo, ...prev])
      } catch {
        // si falla la API, no generamos datos locales
      }
    },
  }
}
