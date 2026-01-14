import React from 'react'
import RouteCard from './RouteCard'
import type { RutaConCliente } from './index'

interface Props {
  rutas: RutaConCliente[]
  isLoading: boolean
  rutaDirecciones: Array<{ lat: number; lng: number }>
  onSelectPosition: (pos: { lat: number; lng: number } | null) => void
  onVerDetalle: (c: any) => void
}

export default function VendedorLista({ rutas, isLoading, rutaDirecciones, onSelectPosition, onVerDetalle }: Props) {
  if (isLoading) {
    return (
      <div className="flex justify-center py-10">
        <div className="text-sm text-neutral-500">Cargando rutas...</div>
      </div>
    )
  }

  if (rutas.length === 0) {
    return (
      <div className="rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-8 text-center text-sm text-neutral-600">
        No tienes visitas planificadas para este día.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {rutas.map(({ plan, cliente }, idx) => {
        const direccionDisplay = plan.direccion_entrega ?? cliente.direccion_texto ?? 'Sin dirección registrada'
        const coordsPlan = plan.ubicacion_gps?.coordinates
          ? { lat: plan.ubicacion_gps.coordinates[1], lng: plan.ubicacion_gps.coordinates[0] }
          : null
        const directionsUrl = coordsPlan ? `https://www.google.com/maps/dir/?api=1&origin=&destination=${coordsPlan.lat},${coordsPlan.lng}` : null
        const displayName = (plan.cliente_nombre ?? cliente.razon_social ?? cliente.nombre_comercial) as string
        const zonaNombre = cliente.zona_comercial?.nombre ?? (cliente.zona_comercial_id ? `Zona ${cliente.zona_comercial_id}` : plan.zona_id != null ? `Zona ${plan.zona_id}` : 'Sin zona asignada')

        return (
          <RouteCard
            key={plan.id ?? `${plan.cliente_id}-${plan.sucursal_id ?? 'main'}-${idx}`}
            plan={plan}
            cliente={cliente}
            index={idx}
            onSelect={(pos) => pos && onSelectPosition(pos)}
            onVerDetalle={onVerDetalle}
            rutaDirecciones={rutaDirecciones}
            displayName={displayName}
            zonaNombre={zonaNombre}
            direccion={direccionDisplay}
            diaLabel={''}
            frecuenciaLabel={''}
            formattedHora={plan.hora_estimada ?? plan.hora_estimada_arribo ?? ''}
            directionsUrl={directionsUrl}
          />
        )
      })}
    </div>
  )
}
