
import { useState, useCallback, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCart } from '../../../cart/CartContext'
import { useCliente } from '../../../hooks/useCliente'
import type { DestinoTipo } from '../types'

export const useCarritoPage = () => {
    const navigate = useNavigate()
    const { items, total, updateQuantity, removeItem, clearCart, warnings, removedItems } = useCart()
    const { crearPedidoDesdeCarrito, perfil, fetchPerfilCliente, sucursales, fetchSucursales } = useCliente()

    const [selectedSucursalId, setSelectedSucursalId] = useState<string | null>(null)
    const [destinoTipo, setDestinoTipo] = useState<DestinoTipo>('cliente')
    const [invalidSucursalMessage, setInvalidSucursalMessage] = useState<string | null>(null)

    const isUuid = useCallback((value: string | null | undefined) => {
        if (!value) return false
        return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
    }, [])

    const selectedSucursal = useMemo(() => sucursales.find(s => s.id === selectedSucursalId) ?? null, [sucursales, selectedSucursalId])

    useEffect(() => {
        if (!perfil) fetchPerfilCliente()
    }, [perfil, fetchPerfilCliente])

    useEffect(() => {
        fetchSucursales()
    }, [fetchSucursales])

    useEffect(() => {
        if (destinoTipo !== 'sucursal') {
            setInvalidSucursalMessage(null)
            return
        }
        if (!selectedSucursalId) {
            setInvalidSucursalMessage('Selecciona una sucursal disponible para enviar el pedido.')
            return
        }
        const stillExists = sucursales.some(s => s.id === selectedSucursalId)
        if (!stillExists) {
            setSelectedSucursalId(null)
            setInvalidSucursalMessage('La sucursal seleccionada ya no está disponible, elige otra opción.')
            return
        }
        setInvalidSucursalMessage(isUuid(selectedSucursalId) ? null : 'Esta sucursal no cuenta con un identificador compatible con el servicio de pedidos. Usa la dirección principal o solicita que actualicen el catálogo.')
    }, [selectedSucursalId, sucursales, isUuid, destinoTipo])

    useEffect(() => {
        if (destinoTipo === 'sucursal' && !selectedSucursalId && sucursales.length > 0) {
            setSelectedSucursalId(sucursales[0].id)
        }
        if (destinoTipo === 'sucursal' && sucursales.length === 0) {
            setDestinoTipo('cliente')
            setSelectedSucursalId(null)
        }
    }, [destinoTipo, selectedSucursalId, sucursales])

    const creditoDisponible = Math.max((perfil?.creditLimit || 0) - (perfil?.currentDebt || 0), 0)
    const superaCredito = total > creditoDisponible
    const condicionComercial = superaCredito ? 'Contado' : 'Crédito'
    const condicionPagoApi = superaCredito ? 'CONTADO' : 'CREDITO'
    const destinoDescripcion = destinoTipo === 'cliente'
        ? 'Cliente principal'
        : selectedSucursal
            ? `${selectedSucursal.nombre}${selectedSucursal.ciudad ? ` · ${selectedSucursal.ciudad}` : ''}`
            : 'Selecciona una sucursal'

    const handleDestinoTipoChange = (tipo: DestinoTipo) => {
        if (tipo === 'sucursal' && sucursales.length === 0) return
        setDestinoTipo(tipo)
        if (tipo === 'cliente') {
            setSelectedSucursalId(null)
        } else if (!selectedSucursalId && sucursales.length > 0) {
            setSelectedSucursalId(sucursales[0].id)
        }
    }

    const confirmarPedido = async () => {
        if (items.length === 0) return
        if (superaCredito) return
        const wantsSucursal = destinoTipo === 'sucursal'
        const sucursalIdForApi = wantsSucursal && selectedSucursalId && isUuid(selectedSucursalId) ? selectedSucursalId : undefined
        if (wantsSucursal && !selectedSucursalId) {
            setInvalidSucursalMessage('Selecciona una sucursal para poder enviar el pedido a esa ubicación.')
            return
        }
        if (wantsSucursal && selectedSucursalId && !sucursalIdForApi) {
            setInvalidSucursalMessage('La sucursal seleccionada no tiene un identificador válido. El pedido se enviará al cliente principal hasta que el catálogo tenga IDs válidos.')
            return
        }
        try {
            await crearPedidoDesdeCarrito({
                sucursalId: sucursalIdForApi,
                condicionPago: condicionPagoApi,
            })
            clearCart()
            try { window.dispatchEvent(new CustomEvent('pedidoCreado', { detail: { message: 'Pedido creado correctamente' } })) } catch { }
            navigate('/cliente/pedidos', { replace: true })
        } catch (e) {
            alert('No se pudo crear el pedido: ' + (e instanceof Error ? e.message : 'error'))
        }
    }

    return {
        items,
        total,
        updateQuantity,
        removeItem,
        clearCart,
        warnings,
        removedItems,
        sucursales,
        selectedSucursalId,
        setSelectedSucursalId,
        destinoTipo,
        invalidSucursalMessage,
        creditoDisponible,
        superaCredito,
        condicionComercial,
        destinoDescripcion,
        handleDestinoTipoChange,
        confirmarPedido
    }
}
