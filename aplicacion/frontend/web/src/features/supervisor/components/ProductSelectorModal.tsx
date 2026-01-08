import { useState } from 'react'
import { Modal } from 'components/ui/Modal'
import { TextField } from 'components/ui/TextField'
import { Button } from 'components/ui/Button'
import { NotificationStack } from 'components/ui/NotificationStack'
import { X } from 'lucide-react'
import type { ProductoPromocion } from '../services/promocionesApi'
import type { Product } from '../services/productosApi'
import type { Notification } from '../../../hooks/useNotification'

interface ProductSelectorModalProps {
  isOpen: boolean
  onClose: () => void
  productos: Product[]
  productosAsignados: ProductoPromocion[]
  onAddProduct: (productoId: string, precioOferta?: number) => Promise<void>
  onDeleteProduct: (productoId: string) => Promise<void>
  hideAssigned?: boolean
  notifications?: Notification[]
  onRemoveNotification?: (id: string) => void
}

export function ProductSelectorModal({
  isOpen,
  onClose,
  productos,
  productosAsignados,
  onAddProduct,
  onDeleteProduct,
  hideAssigned = false,
  notifications = [],
  onRemoveNotification,
}: ProductSelectorModalProps) {
  const [selectedProductId, setSelectedProductId] = useState<string>('')
  const [precioOferta, setPrecioOferta] = useState<number>(0)
  const [searchProducto, setSearchProducto] = useState<string>('')

  const handleClose = () => {
    setSelectedProductId('')
    setPrecioOferta(0)
    setSearchProducto('')
    onClose()
  }

  const handleAdd = async () => {
    if (!selectedProductId) {
      alert('Selecciona un producto')
      return
    }
    await onAddProduct(selectedProductId, precioOferta || undefined)
    setSelectedProductId('')
    setPrecioOferta(0)
    setSearchProducto('')
  }

  const productosAsignadosArray = Array.isArray(productosAsignados) ? productosAsignados : []
  
  const productosDisponibles = productos.filter(
    (p) =>
      !productosAsignadosArray.find((pa) => pa.producto_id === p.id) &&
      (p.nombre.toLowerCase().includes(searchProducto.toLowerCase()) ||
        p.codigo_sku.toLowerCase().includes(searchProducto.toLowerCase()))
  )

  return (
    <Modal
      isOpen={isOpen}
      title="Gestionar Productos de Campaña"
      onClose={handleClose}
      headerGradient="blue"
      maxWidth="lg"
    >
      <div className="relative space-y-6">
        {notifications && notifications.length > 0 && (
          <div className="mb-4">
            <NotificationStack 
              notifications={notifications} 
              onRemove={onRemoveNotification || (() => {})} 
            />
          </div>
        )}
        {/* Productos asignados (opcional) */}
        {!hideAssigned && (
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-gray-900">Productos asignados</h4>
            {productosAsignadosArray.length === 0 ? (
              <p className="text-sm text-gray-500">No hay productos asignados</p>
            ) : (
              <div className="space-y-2">
                {productosAsignadosArray.map((pp, idx) => {
                  const promoProductoId = pp.producto_id || pp.producto?.id
                  const productoData = promoProductoId ? productos.find((p) => p.id === promoProductoId) : undefined
                  const nombreMostrar = productoData?.nombre || pp.producto?.nombre || promoProductoId || 'Producto'
                  const skuMostrar = productoData?.codigo_sku || pp.producto?.codigo_sku
                  return (
                    <div
                      key={`${promoProductoId || 'sin-id'}-${idx}`}
                      className="flex items-center justify-between rounded-lg bg-gray-50 p-3"
                    >
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {nombreMostrar}
                        </p>
                        {skuMostrar && (
                          <p className="text-xs text-gray-600">{skuMostrar}</p>
                        )}
                        {pp.precio_oferta_fijo && (
                          <p className="text-xs text-gray-600">Precio oferta: ${pp.precio_oferta_fijo}</p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => onDeleteProduct(promoProductoId || pp.producto_id)}
                        className="text-gray-400 hover:text-red-500"
                        title="Eliminar"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        <div className="border-t border-gray-200 pt-4">
          <h4 className="mb-3 text-sm font-semibold text-gray-900">Agregar nuevo producto</h4>
          <div className="space-y-4">
            <div className="grid gap-2">
              <label className="text-xs text-neutral-600">Buscar producto</label>
              <input
                type="text"
                placeholder="Busca por nombre o código..."
                value={searchProducto}
                onChange={(e) => setSearchProducto(e.target.value)}
                className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-neutral-900 outline-none transition focus:border-brand-blue/60 focus:shadow-[0_0_0_4px_rgba(20,95,255,0.18)]"
              />
            </div>

            {selectedProductId && (
              <div className="grid gap-2">
                <label className="text-xs text-neutral-600">Producto seleccionado</label>
                <div className="rounded-lg bg-blue-50 p-3">
                  <p className="text-sm font-medium text-gray-900">
                    {productos.find((p) => p.id === selectedProductId)?.nombre}
                  </p>
                  <p className="text-xs text-gray-600">
                    {productos.find((p) => p.id === selectedProductId)?.codigo_sku}
                  </p>
                </div>
              </div>
            )}

            {searchProducto && (
              <div className="space-y-2">
                <label className="text-xs text-neutral-600">
                  Resultados ({productosDisponibles.length})
                </label>
                <div className="max-h-64 overflow-y-auto rounded-lg border border-neutral-200">
                  {productosDisponibles.slice(0, 20).map((producto) => (
                    <button
                      key={producto.id}
                      type="button"
                      onClick={() => {
                        setSelectedProductId(producto.id)
                        setSearchProducto('')
                      }}
                      className={`w-full border-b border-neutral-200 px-4 py-3 text-left transition hover:bg-blue-50 ${
                        selectedProductId === producto.id ? 'bg-blue-100' : 'bg-white'
                      }`}
                    >
                      <p className="text-sm font-medium text-gray-900">{producto.nombre}</p>
                      <p className="text-xs text-gray-600">{producto.codigo_sku}</p>
                    </button>
                  ))}
                  {productosDisponibles.length === 0 && (
                    <div className="px-4 py-8 text-center">
                      <p className="text-sm text-gray-500">No se encontraron productos</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            <TextField
              label="Precio de oferta (opcional)"
              tone="light"
              type="number"
              step="0.01"
              placeholder="Ej: 15.50"
              value={precioOferta || ''}
              onChange={(e) => setPrecioOferta(parseFloat(e.target.value) || 0)}
            />

            <div className="flex justify-end gap-3">
              <Button
                type="button"
                onClick={handleAdd}
                className="bg-brand-blue text-white hover:bg-brand-blue/90"
                disabled={!selectedProductId}
              >
                Agregar producto
              </Button>
            </div>
          </div>
        </div>

        <div className="flex justify-end border-t border-gray-200 pt-4">
          <Button
            type="button"
            onClick={handleClose}
            className="bg-neutral-200 text-neutral-700 hover:bg-neutral-300"
          >
            Cerrar
          </Button>
        </div>
      </div>
    </Modal>
  )
}
