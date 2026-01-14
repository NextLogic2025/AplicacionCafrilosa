import { useState } from 'react'
import { getProductosByCampania, addProductoPromo, deleteProductoPromo, type ProductoPromocion } from './promocionesApi'
import { getAllProducts, type Product } from './productosApi'

export function usePromocionesProductos() {
  const [productos, setProductos] = useState<Product[]>([])
  const [productosPromo, setProductosPromo] = useState<ProductoPromocion[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadProductos = async () => {
    setIsLoading(true)
    try {
      const data = await getAllProducts()
      setProductos(data)
      setError(null)
    } catch (err: any) {
      setError(err.message || 'Error al cargar productos')
    } finally {
      setIsLoading(false)
    }
  }

  const loadProductosPromo = async (campaniaId: string | number) => {
    setIsLoading(true)
    try {
      const id = typeof campaniaId === 'string' ? parseInt(campaniaId) : campaniaId
      // Siempre recargar productos para asegurar datos actualizados
      const productosList = await getAllProducts()
      setProductos(productosList)
      const data: any[] = await getProductosByCampania(id) as any

      let normalizados: ProductoPromocion[] = []
      if (Array.isArray(data) && data.length > 0 && 'codigo_sku' in data[0]) {
        // La API devolvió productos completos con campo "promociones"
        normalizados = (data as any[]).map((p: any) => ({
          campania_id: id,
          producto_id: p.id,
          precio_oferta_fijo: p.promociones?.[0]?.precio_oferta ?? null,
          producto: {
            id: p.id,
            codigo_sku: p.codigo_sku,
            nombre: p.nombre,
          },
        }))
      } else {
        // Forma clásica: ProductoPromocion[]; enriquecer con lista de productos
        normalizados = (data as ProductoPromocion[]).map((pp) => {
          const prod = productosList.find((p) => p.id === pp.producto_id || p.id === (pp as any)?.producto?.id)
          return prod
            ? { ...pp, producto: { id: prod.id, codigo_sku: prod.codigo_sku, nombre: prod.nombre } }
            : pp
        })
      }

      setProductosPromo(normalizados)
      setError(null)
    } catch (err: any) {
      setError(err.message || 'Error al cargar productos de la campaña')
    } finally {
      setIsLoading(false)
    }
  }

  const addProducto = async (campaniaId: string | number, productoId: string) => {
    const id = typeof campaniaId === 'string' ? parseInt(campaniaId) : campaniaId
    try {
      setError(null)
      await addProductoPromo(id, { producto_id: productoId })
      await loadProductosPromo(id)
      return { success: true, message: 'Producto agregado exitosamente' }
    } catch (err: any) {
      const errorMsg = err.message || 'Error al agregar el producto'
      setError(errorMsg)
      return { success: false, message: errorMsg }
    }
  }

  const removeProducto = async (campaniaId: string | number, productoId: string) => {
    const id = typeof campaniaId === 'string' ? parseInt(campaniaId) : campaniaId
    try {
      setError(null)
      await deleteProductoPromo(id, productoId)
      await loadProductosPromo(id)
      return { success: true, message: 'Producto removido exitosamente' }
    } catch (err: any) {
      const errorMsg = err.message || 'Error al remover el producto'
      setError(errorMsg)
      return { success: false, message: errorMsg }
    }
  }

  return {
    productos,
    productosPromo,
    isLoading,
    error,
    loadProductos,
    loadProductosPromo,
    addProducto,
    removeProducto,
  }
}
