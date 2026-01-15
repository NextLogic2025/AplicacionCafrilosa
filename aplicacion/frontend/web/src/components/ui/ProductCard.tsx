import React from 'react'
import { ShoppingCart, Star } from 'lucide-react'
import { Producto } from '../../features/cliente/types'

type ProductCardProps = {
  producto: Producto
  onAddToCart: (item: { id: string; name: string; unitPrice: number; quantity: number }) => void
}

export function ProductCard({ producto, onAddToCart }: ProductCardProps) {
  return (
    <div className="overflow-hidden rounded-lg border border-gray-100 bg-white shadow transition hover:shadow-lg">
      <div className="flex h-48 w-full items-center justify-center overflow-hidden bg-gray-200">
        {producto.image && (
          <img
            src={producto.image}
            alt={producto.name}
            className="h-full w-full object-cover transition hover:scale-105"
          />
        )}
      </div>

      <div className="space-y-3 p-4">
        <h3 className="line-clamp-2 font-semibold text-gray-900">{producto.name}</h3>

        <div className="flex items-center gap-2">
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

        <p className="line-clamp-2 text-sm text-gray-600">{producto.description}</p>

        <div className="flex items-center justify-between border-t border-gray-100 pt-2">
          <div>
            <p className="text-xl font-bold text-brand-red">${producto.price.toFixed(2)}</p>
            <p className={`text-xs ${producto.inStock ? 'text-emerald-600' : 'text-brand-red'}`}>
              {producto.inStock ? 'En stock' : 'Agotado'}
            </p>
          </div>
          <button
            disabled={!producto.inStock}
            onClick={() =>
              onAddToCart({
                id: producto.id,
                name: producto.name,
                unitPrice: producto.price,
                quantity: 1,
              })
            }
            className={`rounded-lg p-2 transition ${
              producto.inStock
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
