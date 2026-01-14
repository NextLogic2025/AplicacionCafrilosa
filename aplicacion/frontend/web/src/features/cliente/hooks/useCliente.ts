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
      // Load persisted local-only pedidos from localStorage
      let localOnly: Pedido[] = []
      try {
        const rawLocal = localStorage.getItem('cafrilosa:localPedidos')
        localOnly = rawLocal ? (JSON.parse(rawLocal) as Pedido[]) : []
      } catch {
        localOnly = []
      }
      const serverItems = (res.items ?? []) as Pedido[]
      // Merge, preferring local items first and avoiding duplicates by id
      const merged = [...localOnly, ...serverItems.filter(si => !localOnly.some(lp => lp.id === si.id))]
      setPedidos(merged)
      setPedidosPaginaActual(res.page ?? pagina)
      setPedidosTotalPaginas(res.totalPages ?? 1)
    } catch {
      // keep persisted local-only pedidos if fetch fails
      try {
        const rawLocal = localStorage.getItem('cafrilosa:localPedidos')
        const localOnly = rawLocal ? (JSON.parse(rawLocal) as Pedido[]) : []
        setPedidos(localOnly)
      } catch {
        setPedidos([])
      }
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
        try { window.dispatchEvent(new CustomEvent('pedidoCreado', { detail: { message: 'Pedido creado correctamente' } })) } catch {}
        return
      } catch (err) {
        // Backend failed — create a local-only pedido so the UX continues to work
        try {
          const raw = localStorage.getItem('cafrilosa:cart')
          const cart = raw ? JSON.parse(raw) : []
          const total = Array.isArray(cart) ? cart.reduce((s: number, it: any) => s + (Number(it.unitPrice || 0) * Number(it.quantity || 0)), 0) : 0
          const fakeId = `local-${Date.now()}`
          const localPedido = {
            id: fakeId,
            orderNumber: `L-${String(Date.now()).slice(-6)}`,
            createdAt: new Date().toISOString(),
            totalAmount: total,
            status: 'PENDIENTE',
            items: Array.isArray(cart)
              ? cart.map((it: any) => ({ id: String(it.id), productName: it.name ?? '', quantity: Number(it.quantity || 0), unit: 'UN', unitPrice: Number(it.unitPrice || 0), subtotal: Number(it.unitPrice || 0) * Number(it.quantity || 0) }))
              : [],
          }
          setPedidos(prev => [localPedido as any, ...prev])
          // persist local pedido so it survives reloads/navigation
          try {
            const rawLocal = localStorage.getItem('cafrilosa:localPedidos')
            const prevLocal = rawLocal ? JSON.parse(rawLocal) as Pedido[] : []
            localStorage.setItem('cafrilosa:localPedidos', JSON.stringify([localPedido as any, ...prevLocal]))
          } catch {}
          try { window.dispatchEvent(new CustomEvent('pedidoCreado', { detail: { message: 'Pedido creado localmente (no sincronizado con servidor)' } })) } catch {}
          // clear local cart (keep behavior consistent)
          localStorage.setItem('cafrilosa:cart', JSON.stringify([]))
        } catch (_) {
          // ignore fallback failures
        }
      }
    },
  }
}
