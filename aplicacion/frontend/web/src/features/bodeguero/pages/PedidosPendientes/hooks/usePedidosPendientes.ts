
import { useState, useEffect } from 'react'
import { obtenerPedidos, obtenerPedidoPorId, iniciarPreparacion, type Pedido } from '../../../services/bodegueroApi'

export type EstadoFiltro = 'TODOS' | 'PENDIENTE' | 'APROBADO' | 'EN_PREPARACION' | 'FACTURADO' | 'EN_RUTA' | 'ENTREGADO'

export function usePedidosPendientes() {
    const [pedidos, setPedidos] = useState<Pedido[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [filtroEstado, setFiltroEstado] = useState<EstadoFiltro>('TODOS')
    const [searchTerm, setSearchTerm] = useState('')
    const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
    const [pedidoDetalle, setPedidoDetalle] = useState<Pedido | null>(null)
    const [isLoadingDetalle, setIsLoadingDetalle] = useState(false)

    useEffect(() => {
        cargarPedidos()
    }, [])

    const cargarPedidos = async () => {
        try {
            setIsLoading(true)
            setError(null)
            const pedidosData = await obtenerPedidos()
            console.log('[Bodeguero] Pedidos recibidos:', pedidosData)
            console.log('[Bodeguero] Total pedidos:', pedidosData.length)
            setPedidos(pedidosData)
        } catch (err: any) {
            console.error('[Bodeguero] Error al cargar pedidos:', err)
            setError(err?.message || 'Error al cargar los pedidos')
        } finally {
            setIsLoading(false)
        }
    }

    const handleVerDetalle = async (pedidoId: string) => {
        try {
            setIsLoadingDetalle(true)
            const detalle = await obtenerPedidoPorId(pedidoId)
            setPedidoDetalle(detalle)
        } catch (err: any) {
            setToast({
                type: 'error',
                message: err?.message || 'Error al cargar el detalle del pedido'
            })
            setTimeout(() => setToast(null), 3000)
        } finally {
            setIsLoadingDetalle(false)
        }
    }

    const handleIniciarPreparacion = async (pedidoId: string) => {
        try {
            await iniciarPreparacion(pedidoId)

            // Actualizar el pedido en la lista local
            setPedidos(prevPedidos =>
                prevPedidos.map(p =>
                    p.id === pedidoId ? { ...p, estado_actual: 'EN_PREPARACION' } : p
                )
            )

            // Actualizar detalle si está abierto
            if (pedidoDetalle?.id === pedidoId) {
                setPedidoDetalle({ ...pedidoDetalle, estado_actual: 'EN_PREPARACION' })
            }

            setToast({
                type: 'success',
                message: 'Pedido marcado como EN PREPARACIÓN exitosamente'
            })
            setTimeout(() => setToast(null), 3000)
        } catch (err: any) {
            setToast({
                type: 'error',
                message: err?.message || 'Error al cambiar el estado del pedido'
            })
            setTimeout(() => setToast(null), 3000)
        }
    }

    const pedidosFiltrados = pedidos.filter(pedido => {
        const matchEstado = filtroEstado === 'TODOS' || pedido.estado_actual === filtroEstado
        const searchLower = searchTerm.toLowerCase()
        const matchSearch = !searchTerm ||
            pedido.id.toLowerCase().includes(searchLower) ||
            pedido.codigo_visual.toString().includes(searchLower) ||
            pedido.cliente?.razon_social?.toLowerCase().includes(searchLower)

        return matchEstado && matchSearch
    })

    const getEstadoBadgeColor = (estado: string) => {
        switch (estado) {
            case 'PENDIENTE':
                return 'bg-yellow-100 text-yellow-800 border-yellow-200'
            case 'APROBADO':
                return 'bg-green-100 text-green-800 border-green-200'
            case 'EN_PREPARACION':
                return 'bg-blue-100 text-blue-800 border-blue-200'
            case 'FACTURADO':
                return 'bg-purple-100 text-purple-800 border-purple-200'
            case 'EN_RUTA':
                return 'bg-indigo-100 text-indigo-800 border-indigo-200'
            case 'ENTREGADO':
                return 'bg-emerald-100 text-emerald-800 border-emerald-200'
            case 'ANULADO':
                return 'bg-red-100 text-red-800 border-red-200'
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200'
        }
    }

    const formatCurrency = (value: string | number) => {
        const num = typeof value === 'string' ? parseFloat(value) : value
        return new Intl.NumberFormat('es-EC', {
            style: 'currency',
            currency: 'USD'
        }).format(num)
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('es-EC', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    return {
        pedidos,
        isLoading,
        error,
        filtroEstado,
        setFiltroEstado,
        searchTerm,
        setSearchTerm,
        toast,
        pedidoDetalle,
        setPedidoDetalle,
        isLoadingDetalle,
        pedidosFiltrados,
        handleVerDetalle,
        handleIniciarPreparacion,
        getEstadoBadgeColor,
        formatCurrency,
        formatDate
    }
}
