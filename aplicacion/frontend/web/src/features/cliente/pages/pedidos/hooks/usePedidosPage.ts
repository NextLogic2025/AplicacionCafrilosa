
import { useState, useEffect } from 'react'
import { useCliente } from '../../../hooks/useCliente'
import { Pedido } from '../../../types'

export const usePedidosPage = () => {
    const {
        pedidos,
        pedidosTotalPaginas,
        cargando,
        error,
        fetchPedidos,
        cancelarPedido,
        limpiarError,
        obtenerPedidoPorId,
    } = useCliente()

    const [successMessage, setSuccessMessage] = useState<string | null>(null)
    const [pedidoSeleccionado, setPedidoSeleccionado] = useState<Pedido | null>(null)
    const [paginaActual, setPaginaActual] = useState(1)

    useEffect(() => {
        fetchPedidos(paginaActual)
    }, [fetchPedidos, paginaActual])

    useEffect(() => {
        const handler = (ev: Event) => {
            const detail = (ev as CustomEvent)?.detail as any
            if (detail && typeof detail.message === 'string') setSuccessMessage(detail.message)
            fetchPedidos(paginaActual)
        }
        window.addEventListener('pedidoCreado', handler as EventListener)
        return () => window.removeEventListener('pedidoCreado', handler as EventListener)
    }, [fetchPedidos, paginaActual])

    useEffect(() => {
        if (!successMessage) return
        const t = setTimeout(() => setSuccessMessage(null), 4000)
        return () => clearTimeout(t)
    }, [successMessage])

    const cambiarPagina = (pagina: number) => setPaginaActual(pagina)

    // Wrapper for cancelarPedido to handle confirmation logic if needed, 
    // though the UI component usually handles the confirmation usage.
    // We expose the raw function here.

    return {
        pedidos,
        pedidosTotalPaginas,
        cargando,
        error,
        fetchPedidos,
        cancelarPedido,
        limpiarError,
        obtenerPedidoPorId,
        successMessage,
        setSuccessMessage,
        pedidoSeleccionado,
        setPedidoSeleccionado,
        paginaActual,
        cambiarPagina
    }
}
