import { Percent, Calendar, Tag } from 'lucide-react'
import type { Campania } from '../services/promocionesApi'

interface CampaniaCardProps {
  campania: Campania
  onEdit: () => void
  onDelete: () => void
  onManageProducts: () => void
  onViewDetails?: () => void
  onManageClientes?: () => void
}

export function CampaniaCard({ campania, onEdit, onDelete, onManageProducts, onViewDetails, onManageClientes }: CampaniaCardProps) {
  return (
    <div 
      className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md cursor-pointer"
      onClick={onViewDetails}
    >
      <div className="mb-4 flex items-start justify-between">
        <div className="flex-1">
          <h3 className="text-lg font-bold text-gray-900">{campania.nombre}</h3>
          {campania.descripcion && (
            <p className="mt-1 text-sm text-gray-600">{campania.descripcion}</p>
          )}
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100">
          <Percent className="h-5 w-5 text-orange-600" />
        </div>
      </div>

      <div className="space-y-2 border-t border-gray-200 pt-4">
        <div className="flex items-center gap-2 text-sm">
          <Calendar className="h-4 w-4 text-gray-400" />
          <span className="text-gray-600">Inicio:</span>
          <span className="font-medium text-gray-900">
            {new Date(campania.fecha_inicio).toLocaleDateString('es-ES')}
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Calendar className="h-4 w-4 text-gray-400" />
          <span className="text-gray-600">Fin:</span>
          <span className="font-medium text-gray-900">
            {new Date(campania.fecha_fin).toLocaleDateString('es-ES')}
          </span>
        </div>
        {campania.tipo_descuento && campania.valor_descuento && (
          <div className="flex items-center gap-2 text-sm">
            <Tag className="h-4 w-4 text-gray-400" />
            <span className="text-gray-600">Descuento:</span>
            <span className="font-semibold text-orange-600">
              {campania.tipo_descuento === 'PORCENTAJE'
                ? `${campania.valor_descuento}%`
                : `$${campania.valor_descuento}`}
            </span>
          </div>
        )}
      </div>

      <div className="mt-4 flex items-center gap-2">
        <span
          className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold ${
            campania.activo ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
          }`}
        >
          {campania.activo ? 'Activa' : 'Inactiva'}
        </span>
        <span
          className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold ${
            campania.alcance === 'GLOBAL'
              ? 'bg-blue-100 text-blue-800'
              : campania.alcance === 'POR_LISTA'
              ? 'bg-purple-100 text-purple-800'
              : 'bg-indigo-100 text-indigo-800'
          }`}
        >
          {campania.alcance === 'GLOBAL'
            ? 'General'
            : campania.alcance === 'POR_LISTA'
            ? 'Por lista'
            : 'Por cliente'}
        </span>
      </div>

      <div className="mt-4 flex gap-2">
        <button
          onClick={(e) => {
            e.stopPropagation()
            onEdit()
          }}
          className="flex-1 rounded-lg px-3 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50"
        >
          Editar
        </button>
        {campania.alcance === 'POR_CLIENTE' && onManageClientes && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onManageClientes()
            }}
            className="flex-1 rounded-lg px-3 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-50"
            title="Asignar clientes a la campaña"
          >
            Asignar clientes
          </button>
        )}
        <button
          onClick={(e) => {
            e.stopPropagation()
            onManageProducts()
          }}
          className="flex-1 rounded-lg px-3 py-2 text-sm font-semibold text-green-700 hover:bg-green-50"
          title="Agregar o gestionar productos"
        >
          Agregar productos
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation()
            onDelete()
          }}
          className="flex-1 rounded-lg px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50"
        >
          Eliminar
        </button>
      </div>
    </div>
  )
}
