
import { useEffect, useState } from 'react'
import { useCart } from '../../cartContext'
import { toast } from 'sonner'
import { PageHero } from '../../../../components/ui/PageHero'
import { EmptyContent } from '../../../../components/ui/EmptyContent'
import { ProductCard } from '../../../../components/ui/ProductCard'
import { Percent } from 'lucide-react'
import { getAllProducts, Product } from '../../../supervisor/services/productosApi'
import type { Producto } from '../../../cliente/types'

export default function VendedorPromociones() {
  const { addToCart } = useCart();
  const [loading, setLoading] = useState(true)
  const [promos, setPromos] = useState<Producto[]>([])

  useEffect(() => {
    let mounted = true
    const load = async () => {
      setLoading(true)
      const resp = await getAllProducts().catch(() => [])
      if (!mounted) return
      // Mapear Product (backend) a Producto (frontend)
      const productos: Producto[] = (resp || []).map((p: Product) => {
        const anyP = p as any
        const rawBase = anyP.precio_base ?? anyP.precio ?? null
        const rawOferta = anyP.precio_oferta ?? null
        const precioBase = typeof rawBase === 'string' ? Number(rawBase) : rawBase
        const precioOferta = typeof rawOferta === 'string' ? Number(rawOferta) : rawOferta
        const price = (precioOferta ?? precioBase ?? 0) as number
        return {
          id: p.id,
          name: p.nombre,
          description: p.descripcion || '',
          price,
          precio_original: typeof precioBase === 'number' && precioOferta != null ? precioBase : (typeof anyP.precio_original === 'number' ? anyP.precio_original : undefined),
          precio_oferta: typeof precioOferta === 'number' ? precioOferta : undefined,
          promociones: anyP.promociones || undefined,
          image: p.imagen_url || '',
          category: p.categoria?.nombre || '',
          inStock: p.activo,
          rating: 0,
          reviews: 0,
        }
      })
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
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 auto-rows-fr">
            {promos.map((p) => (
              <div key={p.id} className="h-full">
                <ProductCard
                  producto={p}
                  onAddToCart={() => {
                    addToCart({
                      id: p.id,
                      name: p.name,
                      unitPrice: p.precio_oferta ?? p.price,
                      quantity: 1,
                      image: p.image,
                      promo: true,
                    });
                    toast.success('Promoción agregada al carrito');
                  }}
                  fetchPromos
                />
              </div>
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
