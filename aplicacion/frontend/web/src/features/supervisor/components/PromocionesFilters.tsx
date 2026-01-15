import React from 'react'

interface PromocionesFiltersProps {
  filtroEstado: 'todas' | 'activas' | 'inactivas'
  filtroAlcance: 'todos' | 'GLOBAL' | 'POR_LISTA' | 'POR_CLIENTE'
  onEstadoChange: (valor: 'todas' | 'activas' | 'inactivas') => void
  onAlcanceChange: (valor: 'todos' | 'GLOBAL' | 'POR_LISTA' | 'POR_CLIENTE') => void
}

export function PromocionesFilters({
  filtroEstado,
  filtroAlcance,
  onEstadoChange,
  onAlcanceChange,
}: PromocionesFiltersProps) {
  return (
    <div className="flex flex-wrap gap-3">
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium text-gray-700">Estado:</label>
        <select
          value={filtroEstado}
          onChange={(e) => onEstadoChange(e.target.value as any)}
          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-brand-red focus:outline-none focus:ring-2 focus:ring-brand-red/20"
        >
          <option value="todas">Todas</option>
          <option value="activas">Activas</option>
          <option value="inactivas">Inactivas</option>
        </select>
      </div>

      <div className="flex items-center gap-2">
        <label className="text-sm font-medium text-gray-700">Tipo:</label>
        <select
          value={filtroAlcance}
          onChange={(e) => onAlcanceChange(e.target.value as any)}
          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-brand-red focus:outline-none focus:ring-2 focus:ring-brand-red/20"
        >
          <option value="todos">Todos</option>
          <option value="GLOBAL">General</option>
          <option value="POR_LISTA">Por lista</option>
          <option value="POR_CLIENTE">Por cliente</option>
        </select>
      </div>
    </div>
  )
}
