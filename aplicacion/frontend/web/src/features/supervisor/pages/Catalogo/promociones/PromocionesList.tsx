import { useMemo, useCallback } from 'react'
import { Pencil, Trash2, Search, Package, UserPlus } from 'lucide-react'
import { LoadingSpinner } from 'components/ui/LoadingSpinner'
import { Percent } from 'lucide-react'
import type { Campania } from '../../../services/promocionesApi'
import { PromocionesFilters } from '../../../components/PromocionesFilters'

interface PromocionesListProps {
  campanias: Campania[]
  isLoading: boolean
  filtroEstado: 'todas' | 'activas' | 'inactivas'
  filtroAlcance: 'todos' | 'GLOBAL' | 'POR_LISTA' | 'POR_CLIENTE'
  onEstadoChange: (valor: 'todas' | 'activas' | 'inactivas') => void
  onAlcanceChange: (valor: 'todos' | 'GLOBAL' | 'POR_LISTA' | 'POR_CLIENTE') => void
  onEdit: (campania: Campania) => void
  onDelete: (id: number) => void
  onViewDetails: (campania: Campania) => void
  onAddProducts?: (campania: Campania) => void
  onAddClientes?: (campania: Campania) => void
}

export function PromocionesList({
  campanias,
  isLoading,
  filtroEstado,
  filtroAlcance,
  onEstadoChange,
  onAlcanceChange,
  onEdit,
  onDelete,
  onViewDetails,
  onAddProducts,
  onAddClientes,
}: PromocionesListProps) {
  // Filtrar campañas
  const campaniasFiltradas = useMemo(() => {
    return campanias.filter((campania) => {
      if (filtroEstado === 'activas' && !campania.activo) return false
      if (filtroEstado === 'inactivas' && campania.activo) return false
      if (filtroAlcance !== 'todos' && campania.alcance !== filtroAlcance) return false
      return true
    })
  }, [campanias, filtroEstado, filtroAlcance])

  const handleDelete = useCallback(
    (id: number, e: React.MouseEvent) => {
      e.stopPropagation()
      if (window.confirm('¿Eliminar esta campaña?')) {
        onDelete(id)
      }
    },
    [onDelete]
  )

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <PromocionesFilters
        filtroEstado={filtroEstado}
        filtroAlcance={filtroAlcance}
        onEstadoChange={onEstadoChange}
        onAlcanceChange={onAlcanceChange}
      />

      {/* Grid o Empty State */}
      {campaniasFiltradas.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed border-neutral-300 p-12 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-neutral-100">
            <Percent className="h-8 w-8 text-neutral-400" />
          </div>
          <h3 className="mt-4 text-lg font-semibold text-neutral-900">
            {campanias.length === 0 ? 'No hay campañas' : 'No hay campañas que coincidan con los filtros'}
          </h3>
          <p className="mt-2 text-sm text-neutral-600">
            {campanias.length === 0
              ? 'Crea tu primera campaña promocional'
              : 'Intenta ajustar los filtros'}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {campaniasFiltradas.map((campania) => (
            <div
              key={campania.id}
              className="relative rounded-2xl border border-neutral-200 bg-white p-0 shadow-md transition hover:shadow-lg cursor-pointer flex flex-col min-h-[340px]"
              onClick={() => onViewDetails(campania)}
            >
              {/* Header con ícono destacado */}
              <div className="flex items-center justify-between px-6 pt-6 pb-2">
                <div className="flex-1 pr-3">
                  <h3 className="text-lg font-bold text-neutral-900 mb-0.5 capitalize">{campania.nombre}</h3>
                  {campania.descripcion && (
                    <p className="line-clamp-2 text-sm text-neutral-600 mb-1">{campania.descripcion}</p>
                  )}
                </div>
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-red/10 to-brand-red/30 shadow">
                  <Percent className="h-6 w-6 text-brand-red" />
                </div>
              </div>

              {/* Badges de estado y alcance */}
              <div className="flex gap-2 px-6 pb-2">
                <span
                  className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold shadow-sm ${
                    campania.activo
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-neutral-100 text-neutral-700'
                  }`}
                >
                  {campania.activo ? 'Activa' : 'Inactiva'}
                </span>
                <span
                  className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold bg-neutral-100 text-neutral-700 shadow-sm"
                >
                  {campania.alcance === 'GLOBAL'
                    ? 'General'
                    : campania.alcance === 'POR_LISTA'
                    ? 'Por lista'
                    : 'Por cliente'}
                </span>
              </div>

              {/* Info Dates & Discount */}
              <div className="px-6 pb-2">
                <div className="flex text-xs mb-0.5">
                  <span className="text-neutral-600">Inicio:</span>
                  <span className="ml-auto font-medium text-neutral-900">
                    {new Date(campania.fecha_inicio).toLocaleDateString('es-ES', {
                      day: '2-digit',
                      month: '2-digit',
                    })}
                  </span>
                </div>
                <div className="flex text-xs mb-0.5">
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
                    <span className="ml-auto font-bold text-brand-red text-base">
                      {campania.tipo_descuento === 'PORCENTAJE'
                        ? `${campania.valor_descuento}%`
                        : `$${campania.valor_descuento}`}
                    </span>
                  </div>
                )}
              </div>

              {/* Quick Action Buttons */}
              {(onAddProducts || (onAddClientes && campania.alcance === 'POR_CLIENTE')) && (
                <div className="flex gap-2 px-6 pb-2">
                  {onAddProducts && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onAddProducts(campania)
                      }}
                      className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-neutral-300 bg-neutral-50 px-3 py-2 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-100 shadow-sm"
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
                        onAddClientes(campania)
                      }}
                      className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-neutral-300 bg-neutral-50 px-3 py-2 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-100 shadow-sm"
                      title="Agregar clientes"
                    >
                      <UserPlus className="h-4 w-4" />
                      <span>Clientes</span>
                    </button>
                  )}
                </div>
              )}

              {/* Main Action Buttons */}
              <div className="flex gap-2 px-6 pt-2 pb-6 mt-auto">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onEdit(campania)
                  }}
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-brand-red bg-white px-3 py-2 text-sm font-semibold text-brand-red shadow-sm transition hover:bg-brand-red/90 hover:text-white hover:shadow-md focus:outline-none focus:ring-2 focus:ring-brand-red/40"
                  title="Editar campaña"
                >
                  <Pencil className="h-4 w-4" />
                  <span>Editar</span>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDelete(campania.id, e)
                  }}
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-red-600 bg-white px-3 py-2 text-sm font-semibold text-red-600 shadow-sm transition hover:bg-red-600 hover:text-white hover:shadow-md focus:outline-none focus:ring-2 focus:ring-red-400"
                  title="Eliminar campaña"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Eliminar</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
