import React from 'react'
import RouteCard from './RouteCard'

interface Props {
  rutas: any[]
  isLoading: boolean
  rutaDirecciones: Array<{ lat: number; lng: number }>
  onSelectPosition: (pos: { lat: number; lng: number } | null) => void
  onVerDetalle: (c: any, sucursalId?: string | null) => void
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
        // Determinar si la ruta apunta a una sucursal y preferir datos de la sucursal
        const sucursalObj = (plan.sucursal_id && cliente?.sucursales && Array.isArray(cliente.sucursales))
          ? cliente.sucursales.find((s: any) => String(s.id) === String(plan.sucursal_id))
          : null
        const direccionDisplay =
          // Priorizar dirección definida en el plan (puede venir de la sucursal)
          plan.direccion_entrega ??
          // luego la dirección de la sucursal si existe
          (sucursalObj?.direccion_entrega ?? cliente.direccion_texto) ??
          'Sin dirección registrada'

        const coordsPlan =
          // Priorizar coords del plan (puede venir ya enriquecido)
          plan.ubicacion_gps?.coordinates
            ? { lat: plan.ubicacion_gps.coordinates[1], lng: plan.ubicacion_gps.coordinates[0] }
            // si no, usar coords de la sucursal si existe
            : sucursalObj?.ubicacion_gps?.coordinates
            ? { lat: sucursalObj.ubicacion_gps.coordinates[1], lng: sucursalObj.ubicacion_gps.coordinates[0] }
            : null

        const directionsUrl = coordsPlan ? `https://www.google.com/maps/dir/?api=1&origin=&destination=${coordsPlan.lat},${coordsPlan.lng}` : null

        // Nombre a mostrar: si es sucursal (cuando plan.sucursal_id está presente)
        const isSucursal = Boolean(plan.sucursal_id)
        let sucursalCandidate = (plan.sucursal_nombre ?? '').toString().trim()
        const isPlaceholderMatriz = sucursalCandidate.length === 0 || sucursalCandidate.toLowerCase() === 'matriz'
        if (isPlaceholderMatriz) sucursalCandidate = sucursalObj?.nombre_sucursal ?? ''

        let displayName: string
        if (isSucursal) {
          if (sucursalCandidate && sucursalCandidate.length > 0) {
            // Prefer the sucursal's explicit name
            displayName = sucursalCandidate
          } else {
            // Fallback: show cliente name and indicate it's a sucursal
            const clienteName = (plan.cliente_nombre ?? cliente.razon_social ?? cliente.nombre_comercial) as string
            displayName = `${clienteName} — Sucursal`
          }
        } else {
          displayName = (plan.cliente_nombre ?? cliente.razon_social ?? cliente.nombre_comercial) as string
        }

        // Zona: preferir la zona de la sucursal si está disponible
        const zonaNombre = (sucursalObj?.zona_nombre)
          ? sucursalObj.zona_nombre
          : (cliente.zona_comercial?.nombre ?? (cliente.zona_comercial_id ? `Zona ${cliente.zona_comercial_id}` : plan.zona_id != null ? `Zona ${plan.zona_id}` : 'Sin zona asignada'))
        // Determinar nombre de sucursal para mostrar en la tarjeta
        let sucursalZona: string | null = null
        if (isSucursal) {
          if (sucursalCandidate && sucursalCandidate.length > 0) {
            sucursalZona = sucursalCandidate
          } else if (cliente?.sucursales && Array.isArray(cliente.sucursales) && plan.sucursal_id) {
            const s = cliente.sucursales.find((x: any) => String(x.id) === String(plan.sucursal_id))
            if (s && s.nombre_sucursal) sucursalZona = s.nombre_sucursal
            else sucursalZona = 'Sucursal'
          } else {
            // Si plan.sucursal_id está presente pero no tenemos datos de la sucursal, mostrar 'Sucursal' en lugar de 'Matriz'
            sucursalZona = 'Sucursal'
          }
        } else {
          sucursalZona = null
        }

        const contactTelefono = plan.sucursal_id ? (sucursalObj?.contacto_telefono ?? cliente.contacto_telefono) : cliente.contacto_telefono

        return (
          <RouteCard
            key={plan.id ?? `${plan.cliente_id}-${plan.sucursal_id ?? 'main'}-${idx}`}
            plan={plan}
            cliente={cliente}
            index={idx}
            onSelect={(pos) => pos && onSelectPosition(pos)}
            onVerDetalle={onVerDetalle}
            sucursalId={plan.sucursal_id ?? null}
            rutaDirecciones={rutaDirecciones}
            displayName={displayName}
            zonaNombre={zonaNombre}
            sucursalZona={sucursalZona}
            direccion={direccionDisplay}
            contactTelefono={contactTelefono}
            coords={coordsPlan}
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
