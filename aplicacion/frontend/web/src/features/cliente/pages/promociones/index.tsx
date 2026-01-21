import { useEffect, useState } from 'react'
import { Percent } from 'lucide-react'
import { SectionHeader } from 'components/ui/SectionHeader'
import { Alert } from 'components/ui/Alert'
import { EmptyContent } from 'components/ui/EmptyContent'
import { PageHero } from 'components/ui/PageHero'
import { getProductos } from '../../services/clientApi'
import { LoadingSpinner, SkeletonCard } from 'components/ui/LoadingSpinner'
import { ProductCard } from 'components/ui/ProductCard'
import { useCart } from '../../cart/CartContext'
import type { Producto } from '../../types'
import ProductDetailModal from '../../components/ProductDetailModal'

export default function PaginaPromociones() {
  const [loading, setLoading] = useState(true)
  const [promos, setPromos] = useState<Producto[]>([])
  const { addItem } = useCart()
  const [selectedProducto, setSelectedProducto] = useState<Producto | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)

  const openDetail = (p: Producto) => {
    setSelectedProducto(p)
    setIsDetailOpen(true)
  }
  const closeDetail = () => {
    setIsDetailOpen(false)
    setSelectedProducto(null)
  }

  useEffect(() => {
    let mounted = true
    const load = async () => {
      setLoading(true)
      const resp = await getProductos({ page: 1, per_page: 100 }).catch(() => [])
      if (!mounted) return
      const filtered = (resp || []).filter(p => p.precio_oferta != null || (Array.isArray(p.promociones) && p.promociones.length > 0))
      setPromos(filtered)
      setLoading(false)
    }
    load()
    return () => { mounted = false }
  }, [])

  return (
    <div className="space-y-6">
      <PageHero
        title="Promociones y Ofertas"
        subtitle="Descubre nuestras mejores ofertas y promociones vigentes"
        chips={[
          'Descuentos especiales',
          'Ofertas por volumen',
          'Promociones por categoría',
        ]}
      />

      <SectionHeader title="Promociones" subtitle="Estructura preparada para catálogos y ofertas" />

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 items-start">
          {Array.from({ length: 8 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : promos.length === 0 ? (
        <>
          <Alert
            type="info"
            title="Sin datos aún"
            message="Esta vista está lista para integrarse con el ERP de promociones (sin datos quemados)."
          />
          <EmptyContent
            icon={Percent}
            title="No hay promociones activas"
            subtitle="Cuando el servicio esté disponible, se mostrarán aquí."
          />
        </>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 items-start">
            {promos.map(p => (
              <ProductCard key={p.id} producto={p} onAddToCart={(item) => addItem(item)} onView={openDetail} />
            ))}
          </div>
          <ProductDetailModal isOpen={isDetailOpen} producto={selectedProducto} onClose={closeDetail} onAddToCart={addItem} />
        </>
      )}
    </div>
  )
}
