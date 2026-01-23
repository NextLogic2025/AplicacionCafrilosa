
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

    const selectedSucursal = useMemo(() => sucursales.find(s => s.id === selectedSucursalId) ?? null, [sucursales, selectedSucursalId])





    useEffect(() => {
        if (!perfil) fetchPerfilCliente()
    }, [perfil, fetchPerfilCliente])

    useEffect(() => {
        fetchSucursales()
    }, [fetchSucursales])

    useEffect(() => {
        console.log('[useCarritoPage] Sucursales updated:', sucursales)
    }, [sucursales])



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

        try {
            await crearPedidoDesdeCarrito({})
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
        creditoDisponible,
        superaCredito,
        condicionComercial,
        destinoDescripcion,
        confirmarPedido,
        perfil,
        selectedSucursalId,
        setSelectedSucursalId,
        destinoTipo,
        handleDestinoTipoChange
    }
}
