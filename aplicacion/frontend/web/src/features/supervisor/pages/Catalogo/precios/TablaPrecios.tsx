import { LoadingSpinner } from 'components/ui/LoadingSpinner'
import type { Product } from '../../../services/productosApi'
import type { ListaPrecio, PrecioItem } from '../../../services/preciosApi'

interface TablaPreciosProps {
  products: Product[]
  listasPrecios: ListaPrecio[]
  preciosMap: Map<string, PrecioItem[]>
  onEdit: (productoId: string) => void
  onDelete: (productoId: string, listaId: number) => void
  isLoading: boolean
}

export function TablaPrecios({ products, listasPrecios, preciosMap, onEdit, onDelete, isLoading }: TablaPreciosProps) {
  const getPrecioForProductoAndLista = (productoId: string, listaId: number): number | null => {
    const precios = preciosMap.get(productoId) || []
    const precio = precios.find((p: PrecioItem) => p.lista_id === listaId)
    return precio ? parseFloat(precio.precio as any) : null
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner />
      </div>
    )
  }

  if (products.length === 0) {
    return (
      <div className="rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
          <span className="h-8 w-8 text-gray-400">$</span>
        </div>
        <h3 className="mt-4 text-lg font-semibold text-gray-900">No hay productos</h3>
        <p className="mt-2 text-sm text-gray-600">Primero crea productos en el catálogo</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
      <table className="w-full">
        <thead className="border-b border-gray-200 bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">SKU</th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Producto</th>
            {listasPrecios.map((lista) => (
              <th key={lista.id} className="px-6 py-3 text-center text-sm font-semibold text-gray-900">
                {lista.nombre}
              </th>
            ))}
            <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {products.map((product) => (
            <tr key={product.id} className="hover:bg-gray-50 transition-colors">
              <td className="px-6 py-4 text-sm font-medium text-gray-900">{product.codigo_sku}</td>
              <td className="px-6 py-4 text-sm text-gray-700">
                <p className="font-medium">{product.nombre}</p>
              </td>
              {listasPrecios.map((lista) => {
                const precio = getPrecioForProductoAndLista(product.id, lista.id)
                return (
                  <td key={`${product.id}-${lista.id}`} className="px-6 py-4 text-center">
                    {precio !== null ? (
                      <div className="flex flex-col items-center gap-2">
                        <span className="inline-block rounded-lg px-3 py-1 text-sm font-semibold bg-green-50 text-green-800">
                          ${precio.toFixed(2)}
                        </span>
                        <button
                          type="button"
                          onClick={() => onDelete(product.id, lista.id)}
                          className="text-xs text-red-600 hover:text-red-700"
                        >
                          Eliminar precio
                        </button>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400">—</span>
                    )}
                  </td>
                )
              })}
              <td className="px-6 py-4 text-right">
                <button
                  onClick={() => onEdit(product.id)}
                  className="rounded-lg p-2 text-blue-600 transition-colors hover:bg-blue-50"
                  title="Editar precio"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
