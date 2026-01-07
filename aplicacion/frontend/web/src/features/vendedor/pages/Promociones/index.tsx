
import { useEffect, useState } from 'react'
import { PageHero } from '../../../../components/ui/PageHero'
import { EmptyContent } from '../../../../components/ui/EmptyContent'
import { ProductCard } from '../../../../components/ui/ProductCard'
import { Percent } from 'lucide-react'
import { getAllProducts, Product } from '../../../supervisor/services/productosApi'
// Si tienes un contexto de carrito para vendedor, impórtalo aquí
// import { useCart } from '../../cart/CartContext'
import type { Producto } from '../../cliente/types'

export default function VendedorPromociones() {
  const [loading, setLoading] = useState(true)
  const [promos, setPromos] = useState<Producto[]>([])
  // const { addItem } = useCart() // Si tienes carrito para vendedor

  useEffect(() => {
    let mounted = true
    const load = async () => {
      setLoading(true)
      const resp = await getAllProducts().catch(() => [])
      if (!mounted) return
      // Mapear Product (backend) a Producto (frontend)
      const productos: Producto[] = (resp || []).map((p: Product) => ({
        id: p.id,
        name: p.nombre,
        description: p.descripcion || '',
        price: 0, // Si tienes precio real, mapéalo aquí
        image: p.imagen_url || '',
        category: p.categoria?.nombre || '',
        inStock: p.activo,
        rating: 0,
        reviews: 0,
        promociones: (p as any).promociones || [],
        precio_oferta: (p as any).precio_oferta ?? null,
      }))
      // Filtrar productos con promociones activas
      const filtered = productos.filter(p => p.precio_oferta != null || (Array.isArray(p.promociones) && p.promociones.length > 0))
      setPromos(filtered)
      setLoading(false)
    }
    load()
    return () => { mounted = false }
  }, [])

  return (
    <div className="space-y-6">
      <PageHero
        title="Promociones Activas"
        subtitle="Aplica promociones al crear pedidos"
        chips={[
          { label: 'Solo lectura', variant: 'neutral' },
          { label: 'Aplicación automática', variant: 'green' },
        ]}
      />

      {/* Promociones Activas */}
      <section className="rounded-xl border border-neutral-200 bg-white p-6">
        <h3 className="text-lg font-bold text-neutral-950 mb-4">Promociones Vigentes</h3>
        {loading ? (
          <div className="flex justify-center items-center h-32">Cargando promociones...</div>
        ) : promos.length === 0 ? (
          <EmptyContent
            icon={<Percent className="h-16 w-16" />}
            title="No hay promociones activas"
            description="Las promociones vigentes se mostrarán aquí"
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {promos.map((p) => (
              <ProductCard key={p.id} producto={p} onAddToCart={() => {}} />
            ))}
          </div>
        )}
      </section>

      {/* Información */}
      <section className="rounded-xl border border-blue-200 bg-blue-50 p-6">
        <h4 className="font-semibold text-blue-900 mb-2">Aplicación de Promociones</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>✓ Visualiza todas las promociones activas con sus condiciones</li>
          <li>✓ Aplica promociones al momento de crear pedidos</li>
          <li>✓ El sistema valida automáticamente el cumplimiento de condiciones</li>
          <li>✓ Puedes combinar múltiples promociones según reglas del negocio</li>
        </ul>
      </section>
    </div>
  )
}
