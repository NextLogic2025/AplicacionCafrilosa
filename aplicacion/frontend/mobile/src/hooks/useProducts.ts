import { useState, useEffect, useCallback } from 'react'
import { Product, ProductService } from '../services/api/ProductService'

export function useProducts() {
    const [products, setProducts] = useState<Product[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchProducts = useCallback(async () => {
        try {
            setLoading(true)
            setError(null)
            const data = await ProductService.getProducts()
            setProducts(data)
        } catch (err) {
            setError('Error al cargar productos')
            console.error(err)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchProducts()
    }, [fetchProducts])

    return {
        products,
        loading,
        error,
        refresh: fetchProducts
    }
}
