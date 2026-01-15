import React, { useEffect, useState } from 'react'
import { ShoppingCart, Star } from 'lucide-react'
import { Producto } from '../../features/cliente/types'
import { getAllCampanias, getProductosByCampania } from '../../features/supervisor/services/promocionesApi'

type ProductCardProps = {
  producto: Producto
  onAddToCart: (item: { id: string; name: string; unitPrice: number; quantity: number }) => void
  fetchPromos?: boolean
  onView?: (producto: Producto) => void
}

export function ProductCard({ producto, onAddToCart, fetchPromos, onView }: ProductCardProps) {
  const [remoteOffer, setRemoteOffer] = useState<number | null>(null)

  useEffect(() => {
    if (!fetchPromos) return
    if (producto.precio_oferta || (Array.isArray(producto.promociones) && producto.promociones.length > 0)) return
    let mounted = true
      ; (async () => {
        try {
          const campanias = await getAllCampanias().catch(() => [])
          await Promise.all(
            campanias.map(async (c) => {
              if (!mounted) return
              try {
                const items = await getProductosByCampania(c.id)
                const found = items.find((it: any) => (it.producto_id || it.id) === producto.id)
                if (found && mounted) {
                  const precio = (found.precio_oferta_fijo ?? (found as any).precio_oferta ?? null) as any
                  if (typeof precio === 'string') {
                    const parsed = Number(precio)
                    if (!Number.isNaN(parsed)) setRemoteOffer(parsed)
                  } else if (typeof precio === 'number') setRemoteOffer(precio)
                }
              } catch (err) {
                // ignore
              }
            })
          )
        } catch (err) {
          // ignore
        }
      })()
    return () => {
      mounted = false
    }
  }, [fetchPromos, producto])
  return (
    <div className="overflow-hidden rounded-lg border border-gray-100 bg-white shadow transition hover:shadow-lg h-full flex flex-col">
      <div className="relative flex h-60 w-full items-center justify-center overflow-hidden bg-gray-200 rounded-t-lg">
        {producto.image ? (
          <img
            src={producto.image}
            alt={producto.name}
            className={`h-full w-full object-cover transition hover:scale-105 ${onView ? 'cursor-pointer' : ''}`}
            onClick={() => onView && onView(producto)}
          />
        ) : null}

        {(() => {
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
          const ofertaRemota = remoteOffer != null ? toNumber(remoteOffer) : null

          // Decide effective price: prefer offer (local, then remote), then base, then original as fallback
          const effective = ofertaLocal ?? ofertaRemota ?? (base != null && base > 0 ? base : origField ?? null)
          const hasOffer = ofertaLocal != null || ofertaRemota != null

          if (!hasOffer) return null

          const orig = origField
          const ahorro = orig != null && effective != null && orig > effective ? Math.max(0, orig - effective) : null
          const percent = ahorro != null && orig ? Math.round((ahorro / orig) * 100) : null

          return (
            <div className="absolute top-3 right-3 flex items-center gap-2 z-20">
              <span className="bg-brand-red text-white px-3 py-1 rounded-md text-xs font-semibold shadow">
                {percent ? `-${percent}%` : 'Oferta'}
              </span>
            </div>
          )
        })()}
      </div>

      <div className="p-3 flex flex-col flex-1 min-h-0">
        <div>
          <h3 className="line-clamp-2 font-semibold text-gray-900">{producto.name}</h3>

          <div className="flex items-center gap-2 mt-2">
            <div className="flex items-center gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  size={14}
                  className={
                    i < Math.floor(producto.rating || 0)
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-gray-300'
                  }
                />
              ))}
            </div>
            <span className="text-sm text-gray-600">({producto.reviews || 0})</span>
          </div>

          <p className="line-clamp-2 text-sm text-gray-600 mt-2">{producto.description}</p>
        </div>

        <div className="flex items-end justify-between border-t border-gray-100 pt-2 mt-auto">
          <div className="flex flex-col min-h-[44px]">
            {(() => {
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
              const ofertaRemota = remoteOffer != null ? toNumber(remoteOffer) : null

              const effective = ofertaLocal ?? ofertaRemota ?? (base != null && base > 0 ? base : origField ?? null)

              // Show original price only when it's strictly greater than the effective price
              if (origField != null && effective != null && origField > effective) {
                return (
                  <>
                    <p className="text-sm text-gray-500 line-through">{`$${origField.toFixed(2)}`}</p>
                    <p className="text-xl font-bold text-brand-red">{`$${effective.toFixed(2)}`}</p>
                    <p className="text-xs text-emerald-600 font-semibold mt-1">{`Ahorra $${(origField - effective).toFixed(2)} (${Math.round(((origField - effective) / origField) * 100)}% )`}</p>
                  </>
                )
              }

              // Otherwise show single price (use effective if available)
              if (effective != null) {
                return <p className="text-xl font-bold text-brand-red">{`$${effective.toFixed(2)}`}</p>
              }

              return <p className="text-xl font-bold text-brand-red">Sin precio</p>
            })()}
          </div>
          <button
            type="button"
            disabled={!producto.inStock}
            onClick={() =>
              onAddToCart({
                id: producto.id,
                name: producto.name,
                unitPrice: producto.price,
                quantity: 1,
              })
            }
            className={`rounded-lg p-2 transition ${producto.inStock
                ? 'bg-brand-red text-white hover:bg-brand-red700'
                : 'cursor-not-allowed bg-gray-200 text-gray-400'
              }`}
          >
            <ShoppingCart size={18} />
          </button>
        </div>
      </div>
    </div>
  )
}
