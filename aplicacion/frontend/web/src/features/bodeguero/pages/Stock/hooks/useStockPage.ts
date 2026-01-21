
import { useState, useEffect } from 'react'
import { getAllStock, getStockByProduct, StockItem } from '../../../services/stockApi'
import { getAllProducts, Product } from '../../../../supervisor/services/productosApi'
import { getSelectedRole } from '../../../../../services/storage/roleStorage'

export function useStockPage() {
    const [stock, setStock] = useState<StockItem[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
    const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false)
    const [selectedStock, setSelectedStock] = useState<StockItem | null>(null)

    const [products, setProducts] = useState<Product[]>([])
    const [selectedProduct, setSelectedProduct] = useState<string>('')
    const role = getSelectedRole()

    useEffect(() => {
        getAllProducts().then(setProducts).catch(console.error)
    }, [])

    useEffect(() => {
        fetchStock()
    }, [selectedProduct])

    const fetchStock = async () => {
        setLoading(true)
        try {
            const rawData = selectedProduct
                ? await getStockByProduct(selectedProduct)
                : await getAllStock()

            // Calculate availability on frontend since backend might return raw entities
            const processedData = rawData.map(item => {
                const fisico = Number(item.cantidadFisica)
                const reservado = Number(item.cantidadReservada || 0)
                const disponible = fisico - reservado
                return {
                    ...item,
                    cantidadDisponible: item.cantidadDisponible ?? String(disponible) // Use backend value if exists, else calc
                }
            })

            setStock(processedData)
        } catch (err: any) {
            setError(err.message || 'Error al cargar stock')
        } finally {
            setLoading(false)
        }
    }

    const handleOpenAdjust = (item: StockItem) => {
        setSelectedStock(item)
        setIsAdjustModalOpen(true)
    }

    const handleCloseAdjust = () => {
        setIsAdjustModalOpen(false)
        setSelectedStock(null)
    }

    const handleCreateSuccess = () => {
        setIsCreateModalOpen(false)
        fetchStock()
    }

    const handleAdjustSuccess = () => {
        handleCloseAdjust()
        fetchStock()
    }

    return {
        // State
        stock,
        loading,
        error,
        isCreateModalOpen,
        isAdjustModalOpen,
        selectedStock,
        products,
        selectedProduct,
        role,

        // Setters
        setIsCreateModalOpen,
        setSelectedProduct,

        // Handlers
        handleOpenAdjust,
        handleCloseAdjust,
        handleCreateSuccess,
        handleAdjustSuccess
    }
}
