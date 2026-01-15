import React from 'react'
import { CalendarDays, Navigation, MoveRight, MapPin, Flag } from 'lucide-react'
import type { Cliente } from '../../../supervisor/services/clientesApi'
import type { RuteroPlanificado } from '../../../supervisor/services/types'

interface Props {
  plan: RuteroPlanificado
  cliente: Cliente
  index: number
  onSelect?: (pos: { lat: number; lng: number } | null) => void
  onVerDetalle: (c: Cliente, sucursalId?: string | null) => void
  sucursalId?: string | null
  rutaDirecciones: Array<{ lat: number; lng: number }>
  displayName: string
  zonaNombre: string
  sucursalZona?: string | null
  direccion: string
  contactTelefono?: string | null
  coords?: { lat: number; lng: number } | null
  showCoords?: boolean
  diaLabel: string
  frecuenciaLabel: string
  formattedHora: string
  directionsUrl: string | null
}

export default function RouteCard({ plan, cliente, index, onSelect, onVerDetalle, sucursalId, displayName, zonaNombre, sucursalZona, direccion, contactTelefono, coords, showCoords = false, diaLabel, frecuenciaLabel, formattedHora, directionsUrl }: Props) {
  return (
    <article
      onClick={() => onSelect?.(null)}
      className="group relative overflow-hidden rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md cursor-pointer"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-neutral-500">Orden #{plan.orden_sugerido}</p>
          <h3 className="text-lg font-bold text-neutral-900">{displayName}</h3>
          <div className="flex flex-col">
            <span className="text-sm font-medium text-red-600">{zonaNombre}</span>
            <span className="mt-1 text-sm font-medium text-blue-600">{sucursalZona ? `Sucursal: ${sucursalZona}` : 'Sucursal: Matriz'}</span>
          </div>
        </div>
        <span className={`flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold ${plan.prioridad_visita === 'ALTA' ? 'bg-red-100 text-red-800 border-red-300' : ''}`}>
          <Flag className="h-3.5 w-3.5" />
          {plan.prioridad_visita.toLowerCase()}
        </span>
      </div>

      <div className="mt-4 grid gap-3 text-sm text-neutral-700 md:grid-cols-4">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-brand-red" />
          <span>{diaLabel}</span>
        </div>
        <div className="flex items-center gap-2">
          <Navigation className="h-4 w-4 text-brand-red" />
          <span>{frecuenciaLabel}</span>
        </div>
        <div className="flex items-center gap-2">
          <MoveRight className="h-4 w-4 text-brand-red" />
          <span>{formattedHora}</span>
        </div>
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-brand-red" />
          <span className="truncate" title={direccion}>{direccion}</span>
        </div>
      </div>

      <div className="mt-4 flex justify-end">
        <div className="flex flex-wrap items-center gap-4">
          {contactTelefono && (
            <div className="text-sm text-neutral-700">Contacto: {contactTelefono}</div>
          )}
          {showCoords && coords && (
            <div className="text-sm text-emerald-600">Ubicación: {coords.lat.toFixed(6)}, {coords.lng.toFixed(6)}</div>
          )}
          {directionsUrl && (
            <a href={directionsUrl} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-brand-red transition hover:text-brand-red-dark">Cómo llegar</a>
          )}
          <button type="button" onClick={() => onVerDetalle(cliente, sucursalId)} className="text-sm font-semibold text-brand-red transition hover:text-brand-red-dark">Ver detalles del cliente</button>
        </div>
      </div>
    </article>
  )
}
