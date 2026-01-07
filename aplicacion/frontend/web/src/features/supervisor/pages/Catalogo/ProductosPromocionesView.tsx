import { Package, Percent } from 'lucide-react'
import type { Campania, ProductoPromocion } from '../../services/promocionesApi'
import type { Product } from '../../services/productosApi'

interface ProductosPromocionesViewProps {
  campanias: Campania[]
  productosEnPromociones: Map<string, ProductoPromocion[]>
  products: Product[]
  isLoading: boolean
}

export function ProductosPromocionesView({
  campanias,
  productosEnPromociones,
  products,
  isLoading,
}: ProductosPromocionesViewProps) {
  // Crear un mapa de productos por ID para acceso rápido
  const productosMap = new Map(products.map((p) => [p.id, p]))

  // Filtrar campañas que tienen productos
  const campaniasConProductos = campanias.filter((campania) => {
    const productosPromo = productosEnPromociones.get(String(campania.id)) || []
    return productosPromo.length > 0
  })

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-red border-t-transparent"></div>
      </div>
    )
  }

  if (campaniasConProductos.length === 0) {
    return (
      <div className="rounded-2xl border-2 border-dashed border-neutral-300 bg-neutral-50 p-12 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-neutral-200">
          <Percent className="h-8 w-8 text-neutral-500" />
        </div>
        <h3 className="mt-4 text-lg font-semibold text-neutral-900">
          No hay productos en promociones
        </h3>
        <p className="mt-2 text-sm text-neutral-600">
          Los productos que estén en campañas promocionales aparecerán aquí
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {campaniasConProductos.map((campania) => {
        const productosPromo = productosEnPromociones.get(String(campania.id)) || []
        
        // Obtener productos completos usando el mapa
        const productosCompletos = productosPromo
          .map((pp) => {
            const producto = productosMap.get(pp.producto_id || pp.id)
            return producto ? { ...pp, productoData: producto } : null
          })
          .filter((p) => p !== null)

        if (productosCompletos.length === 0) return null

        return (
          <div key={campania.id} className="rounded-lg border border-neutral-200 bg-white p-6">
            {/* Header de la campaña */}
            <div className="mb-4 flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-red/10">
                    <Percent className="h-5 w-5 text-brand-red" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-neutral-900">{campania.nombre}</h3>
                    {campania.descripcion && (
                      <p className="text-sm text-neutral-600">{campania.descripcion}</p>
                    )}
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                  <span className="rounded-full bg-neutral-100 px-3 py-1 font-semibold text-neutral-700">
                    {new Date(campania.fecha_inicio).toLocaleDateString('es-ES')} -{' '}
                    {new Date(campania.fecha_fin).toLocaleDateString('es-ES')}
                  </span>
                  {campania.valor_descuento && (
                    <span className="rounded-full bg-brand-red/10 px-3 py-1 font-semibold text-brand-red">
                      {campania.tipo_descuento === 'PORCENTAJE'
                        ? `${campania.valor_descuento}% OFF`
                        : `$${campania.valor_descuento} OFF`}
                    </span>
                  )}
                  <span
                    className={`rounded-full px-3 py-1 font-semibold ${
                      campania.activo
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-neutral-100 text-neutral-700'
                    }`}
                  >
                    {campania.activo ? 'Activa' : 'Inactiva'}
                  </span>
                </div>
              </div>
            </div>

            {/* Grid de productos */}
            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {productosCompletos.map((item) => {
                const product = item!.productoData
                return (
                  <div
                    key={item!.producto_id || item!.id}
                    className="rounded-lg border border-neutral-200 bg-neutral-50 p-4"
                  >
                    <div className="flex items-start gap-3">
                      {product.imagen_url ? (
                        <img
                          src={product.imagen_url}
                          alt={product.nombre}
                          className="h-16 w-16 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-neutral-200">
                          <Package className="h-8 w-8 text-neutral-400" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-neutral-500">SKU: {product.codigo_sku}</p>
                        <h4 className="font-semibold text-neutral-900 truncate">{product.nombre}</h4>
                        {item!.precio_oferta_fijo && (
                          <p className="mt-1 text-sm font-bold text-brand-red">
                            Precio Oferta: ${item!.precio_oferta_fijo}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
