import { Pencil, Trash2, Percent, Package, UserPlus } from 'lucide-react'
import type { Campania } from '../services/promocionesApi'

interface CampaniaCardProps {
  campania: Campania
  onEdit: () => void
  onDelete: () => void
  onViewDetails?: () => void
  onAddProducts?: () => void
  onAddClientes?: () => void
}

export function CampaniaCard({ campania, onEdit, onDelete, onViewDetails, onAddProducts, onAddClientes }: CampaniaCardProps) {
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (window.confirm('¿Eliminar esta campaña?')) {
      onDelete()
    }
  }

  return (
    <div
      className="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md cursor-pointer"
      onClick={onViewDetails}
    >
      {/* Header con ícono */}
      <div className="mb-4 flex items-start justify-between">
        <div className="flex-1 pr-3">
          <h3 className="text-base font-bold text-neutral-900">{campania.nombre}</h3>
          {campania.descripcion && (
            <p className="mt-1 line-clamp-2 text-xs text-neutral-600">{campania.descripcion}</p>
          )}
        </div>
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-neutral-100">
          <Percent className="h-5 w-5 text-neutral-600" />
        </div>
      </div>

      {/* Info Dates & Discount */}
      <div className="mb-4 space-y-1 border-t border-neutral-200 pt-3">
        <div className="flex text-xs">
          <span className="text-neutral-600">Inicio:</span>
          <span className="ml-auto font-medium text-neutral-900">
            {new Date(campania.fecha_inicio).toLocaleDateString('es-ES', {
              day: '2-digit',
              month: '2-digit',
            })}
          </span>
        </div>
        <div className="flex text-xs">
          <span className="text-neutral-600">Fin:</span>
          <span className="ml-auto font-medium text-neutral-900">
            {new Date(campania.fecha_fin).toLocaleDateString('es-ES', {
              day: '2-digit',
              month: '2-digit',
            })}
          </span>
        </div>
        {campania.valor_descuento && (
          <div className="flex text-xs">
            <span className="text-neutral-600">Descuento:</span>
            <span className="ml-auto font-semibold text-brand-red">
              {campania.tipo_descuento === 'PORCENTAJE'
                ? `${campania.valor_descuento}%`
                : `$${campania.valor_descuento}`}
            </span>
          </div>
        )}
      </div>

      {/* Status Badges */}
      <div className="mb-4 flex gap-2">
        <span
          className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold ${
            campania.activo
              ? 'bg-emerald-100 text-emerald-700'
              : 'bg-neutral-100 text-neutral-700'
          }`}
        >
          {campania.activo ? 'Activa' : 'Inactiva'}
        </span>
        <span
          className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold bg-neutral-100 text-neutral-700`}
        >
          {campania.alcance === 'GLOBAL'
            ? 'General'
            : campania.alcance === 'POR_LISTA'
            ? 'Por lista'
            : 'Por cliente'}
        </span>
      </div>

      {/* Quick Action Buttons */}
      {(onAddProducts || (onAddClientes && campania.alcance === 'POR_CLIENTE')) && (
        <div className="mb-3 flex gap-2">
          {onAddProducts && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onAddProducts()
              }}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-neutral-300 bg-neutral-50 px-3 py-2 text-sm font-semibold text-neutral-700 transition-colors hover:bg-neutral-100"
              title="Agregar productos"
            >
              <Package className="h-4 w-4" />
              <span>Productos</span>
            </button>
          )}
          {onAddClientes && campania.alcance === 'POR_CLIENTE' && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onAddClientes()
              }}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-neutral-300 bg-neutral-50 px-3 py-2 text-sm font-semibold text-neutral-700 transition-colors hover:bg-neutral-100"
              title="Agregar Empresas"
            >
              <UserPlus className="h-4 w-4" />
              <span>Clientes</span>
            </button>
          )}
        </div>
      )}

      {/* Main Action Buttons */}
      <div className="flex gap-2">
        <button
          onClick={(e) => {
            e.stopPropagation()
            onEdit()
          }}
          className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-brand-red px-3 py-2 text-sm font-semibold text-brand-red transition-colors hover:bg-red-50"
          title="Editar campaña"
        >
          <Pencil className="h-4 w-4" />
          <span>Editar</span>
        </button>
        <button
          onClick={handleDelete}
          className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-red-600 px-3 py-2 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50"
          title="Eliminar campaña"
        >
          <Trash2 className="h-4 w-4" />
          <span>Eliminar</span>
        </button>
      </div>
    </div>
  )
}
