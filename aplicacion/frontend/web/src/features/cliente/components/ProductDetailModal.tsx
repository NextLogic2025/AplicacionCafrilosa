import React from 'react'
import { ShoppingCart, Star } from 'lucide-react'
import { Modal } from 'components/ui/Modal'
import type { Producto } from '../types'

export function ProductDetailModal({
  isOpen,
  producto,
  onClose,
  onAddToCart,
}: {
  isOpen: boolean
  producto: Producto | null
  onClose: () => void
  onAddToCart: (item: { id: string; name: string; unitPrice: number; quantity: number }) => void
}) {
  if (!producto) return null

  const toNumber = (v: any): number | null => {
    if (typeof v === 'number' && Number.isFinite(v)) return v
    if (typeof v === 'string') {
      const n = Number(v)
      return Number.isFinite(n) ? n : null
    }
    return null
  }

  const ofertaLocal = toNumber(producto.precio_oferta)
  const base = toNumber(producto.price)
  const origField = toNumber(producto.precio_original)
  const effective = ofertaLocal ?? base ?? origField ?? null

  const ahorro = origField != null && effective != null && origField > effective ? Math.max(0, origField - effective) : null

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={producto.name || 'Detalle del producto'} headerGradient="red" maxWidth="md">
      <div className="space-y-4">
        <div className="w-full overflow-hidden rounded-lg bg-gray-100">
          {producto.image ? (
            <img src={producto.image} alt={producto.name} className="w-full h-56 object-cover" />
          ) : (
            <div className="w-full h-56 flex items-center justify-center text-gray-300">Sin imagen</div>
          )}
        </div>

        <div>
          <h3 className="text-lg font-semibold text-gray-900">{producto.name}</h3>
          <div className="flex items-center gap-2 mt-2">
            <div className="flex items-center gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} size={14} className={i < Math.floor(producto.rating || 0) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'} />
              ))}
            </div>
            <span className="text-sm text-gray-600">({producto.reviews || 0})</span>
          </div>

          <p className="mt-3 text-sm text-gray-700">{producto.description}</p>

            <div className="mt-4 space-y-2 text-sm text-gray-700">
            <p><strong>Categoría:</strong> {producto.category}</p>
            <p><strong>Stock:</strong> {producto.inStock ? 'Disponible' : 'Agotado'}</p>
            <p className="break-all"><strong>ID:</strong> {producto.id}</p>
            {producto.campania_aplicada_id != null && <p><strong>Campaña aplicada:</strong> {producto.campania_aplicada_id}</p>}
          </div>

          {Array.isArray(producto.promociones) && producto.promociones.length > 0 && (
            <div className="mt-3">
              <h4 className="text-sm font-semibold text-gray-800 mb-1">Promociones</h4>
              <ul className="list-disc list-inside text-sm text-gray-700">
                {producto.promociones.map((pr: any, idx: number) => {
                  if (pr && typeof pr === 'object') {
                    const title = pr.nombre ?? pr.campania_nombre ?? `Promo ${idx + 1}`
                    const price = pr.precio_oferta ?? pr.precio_oferta_fijo ?? null
                    const tipo = pr.tipo_descuento ?? pr.tipo ?? null
                    return (
                      <li key={idx} className="mb-1">
                        <div className="font-medium text-gray-800">{title}</div>
                        <div className="text-gray-600 text-sm">{price != null ? `Precio oferta: $${Number(price).toFixed(2)}` : null}{tipo ? ` — ${tipo}` : null}</div>
                      </li>
                    )
                  }
                  return <li key={idx}>{String(pr)}</li>
                })}
              </ul>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between pt-2 border-t">
          <div>
            {origField != null && ahorro != null ? (
              <>
                <p className="text-sm text-gray-500 line-through">{`$${origField.toFixed(2)}`}</p>
                <p className="text-xl font-bold text-brand-red">{`$${effective?.toFixed(2)}`}</p>
                <p className="text-xs text-emerald-600 font-semibold mt-1">{`Ahorra $${ahorro.toFixed(2)} (${Math.round((ahorro / origField) * 100)}% )`}</p>
              </>
            ) : effective != null ? (
              <p className="text-xl font-bold text-brand-red">{`$${effective.toFixed(2)}`}</p>
            ) : (
              <p className="text-xl font-bold text-brand-red">Sin precio</p>
            )}
          </div>
          <button
            onClick={() => onAddToCart({ id: producto.id, name: producto.name, unitPrice: producto.price, quantity: 1 })}
            className={`rounded-lg px-4 py-2 text-white ${producto.inStock ? 'bg-brand-red hover:brightness-90' : 'bg-gray-300 text-gray-600 cursor-not-allowed'}`}
            disabled={!producto.inStock}
          >
            <div className="flex items-center gap-2">
              <ShoppingCart size={16} />
              <span className="font-semibold">Agregar</span>
            </div>
          </button>
        </div>
      </div>
    </Modal>
  )
}

export default ProductDetailModal
