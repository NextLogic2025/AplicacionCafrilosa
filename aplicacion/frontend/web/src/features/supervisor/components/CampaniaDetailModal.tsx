import React from 'react'
import { Modal } from 'components/ui/Modal'
import { Button } from 'components/ui/Button'
import { Trash2 } from 'lucide-react'
import type { Campania, ProductoPromocion, ClienteCampania } from '../services/promocionesApi'

interface CampaniaDetailModalProps {
  isOpen: boolean
  campania: Campania | null
  productosAsignados: ProductoPromocion[]
  clientesAsignados: ClienteCampania[]
  onClose: () => void
  onDeleteProduct: (productoId: string) => void
  onDeleteCliente?: (clienteId: string) => void
}

export function CampaniaDetailModal({
  isOpen,
  campania,
  productosAsignados,
  clientesAsignados,
  onClose,
  onDeleteProduct,
  onDeleteCliente,
}: CampaniaDetailModalProps) {
  if (!campania) return null

  return (
    <Modal
      isOpen={isOpen}
      title={campania.nombre || 'Detalles de Campaña'}
      onClose={onClose}
      headerGradient="red"
      maxWidth="lg"
    >
      <div className="space-y-6">
        {/* Información general */}
        <div className="space-y-3">
          <h3 className="font-semibold text-gray-900">Información General</h3>
          <div className="grid gap-3 text-sm">
            {campania.descripcion && (
              <div>
                <span className="text-gray-600">Descripción:</span>
                <p className="mt-1 text-gray-900">{campania.descripcion}</p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-gray-600">Fecha inicio:</span>
                <p className="font-medium text-gray-900">
                  {new Date(campania.fecha_inicio).toLocaleDateString('es-ES')}
                </p>
              </div>
              <div>
                <span className="text-gray-600">Fecha fin:</span>
                <p className="font-medium text-gray-900">
                  {new Date(campania.fecha_fin).toLocaleDateString('es-ES')}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-gray-600">Tipo de descuento:</span>
                <p className="font-medium text-gray-900">
                  {campania.tipo_descuento === 'PORCENTAJE' ? 'Porcentaje' : 'Monto fijo'}
                </p>
              </div>
              <div>
                <span className="text-gray-600">Valor:</span>
                <p className="font-semibold text-orange-600">
                  {campania.tipo_descuento === 'PORCENTAJE'
                    ? `${campania.valor_descuento}%`
                    : `$${campania.valor_descuento}`}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-gray-600">Alcance:</span>
                <p className="font-medium text-gray-900">
                  {campania.alcance === 'GLOBAL'
                    ? 'General'
                    : campania.alcance === 'POR_LISTA'
                    ? 'Por lista de precios'
                    : 'Por cliente específico'}
                </p>
              </div>
              <div>
                <span className="text-gray-600">Estado:</span>
                <span
                  className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold ${
                    campania.activo ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {campania.activo ? 'Activa' : 'Inactiva'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Productos asignados */}
        <div className="space-y-3 border-t border-gray-200 pt-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">
              Productos en Promoción ({productosAsignados.length})
            </h3>
          </div>

          {productosAsignados.length === 0 ? (
            <div className="rounded-lg bg-gray-50 p-8 text-center">
              <p className="text-sm text-gray-500">No hay productos asignados a esta campaña</p>
            </div>
          ) : (
            <div className="space-y-2">
              {productosAsignados.map((pp) => (
                <div
                  key={pp.producto_id}
                  className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4 hover:border-gray-300"
                >
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{pp.producto?.nombre || pp.producto_id}</p>
                    {pp.producto?.codigo_sku && (
                      <p className="text-xs text-gray-500">SKU: {pp.producto.codigo_sku}</p>
                    )}
                  </div>
                  {pp.precio_oferta_fijo && (
                    <div className="mr-4 text-right">
                      <p className="text-sm text-gray-600">Precio promocional</p>
                      <p className="text-lg font-semibold text-orange-600">${pp.precio_oferta_fijo}</p>
                    </div>
                  )}
                  <button
                    onClick={() => onDeleteProduct(pp.producto_id)}
                    className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600"
                    title="Eliminar de la campaña"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Clientes asignados */}
        {campania.alcance === 'POR_CLIENTE' && (
          <div className="space-y-3 border-t border-gray-200 pt-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">
                Clientes Asignados ({clientesAsignados.length})
              </h3>
            </div>

            {clientesAsignados.length === 0 ? (
              <div className="rounded-lg bg-gray-50 p-8 text-center">
                <p className="text-sm text-gray-500">No hay clientes asignados a esta campaña</p>
              </div>
            ) : (
              <div className="space-y-2">
                {clientesAsignados.map((cc) => (
                  <div
                    key={cc.cliente_id}
                    className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4 hover:border-gray-300"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{cc.cliente?.razon_social || cc.cliente_id}</p>
                      {cc.cliente?.identificacion && (
                        <p className="text-xs text-gray-500">ID: {cc.cliente.identificacion}</p>
                      )}
                    </div>
                    {onDeleteCliente && (
                      <button
                        onClick={() => onDeleteCliente(cc.cliente_id)}
                        className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600"
                        title="Eliminar de la campaña"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end border-t border-gray-200 pt-4">
          <Button
            type="button"
            onClick={onClose}
            className="bg-neutral-200 text-neutral-700 hover:bg-neutral-300"
          >
            Cerrar
          </Button>
        </div>
      </div>
    </Modal>
  )
}
