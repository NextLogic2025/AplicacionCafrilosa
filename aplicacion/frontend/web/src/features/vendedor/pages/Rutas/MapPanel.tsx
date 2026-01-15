import React, { useMemo, useState, useEffect } from 'react'
import { GoogleMap, Marker, Polyline, Circle, InfoWindow, Polygon } from '@react-google-maps/api'
import type { DiaSemana } from '../../../supervisor/services/types'
import { getMarkerIcon } from './helpers'

interface Punto {
  position: { lat: number; lng: number }
  label: string
  nombre: string
  id: string
  tipo: 'PRINCIPAL' | 'SUCURSAL'
  clienteId: string
  sucursalId?: string | number | null
  direccion?: string
}

export default function MapPanel({
  puntosMapa,
  rutaPolyline,
  mapaCentro,
  selectedPosition,
  isLoaded,
  loadError,
  mapContainerStyle,
  areaPolygon,
  showDetails = false,
  selectedClienteId = null,
  selectedSucursalId = null,
}: {
  puntosMapa: Punto[]
  rutaPolyline: Array<{ lat: number; lng: number }>
  mapaCentro: { lat: number; lng: number }
  selectedPosition: { lat: number; lng: number } | null
  isLoaded: boolean
  loadError: unknown
  mapContainerStyle: any
  areaPolygon?: Array<{ lat: number; lng: number }>
  showDetails?: boolean
  selectedClienteId?: string | number | null
  selectedSucursalId?: string | number | null
}) {
  const ready = isLoaded && !loadError && typeof window !== 'undefined' && (window as any).google && (window as any).google.maps

  if (!ready) {
    // Fallback visible mientras Google Maps carga o si hay un error
    return (
      <div className="flex h-full items-center justify-center px-4 text-center text-xs text-neutral-500">
        {loadError ? 'No se pudo cargar Google Maps.' : 'Iniciando mapa...'}
      </div>
    )
  }
    // Ajustar posiciones cuando varios marcadores comparten la misma lat/lng
    const adjustedPositions = useMemo(() => {
      const groups = new Map<string, typeof puntosMapa>()
      puntosMapa.forEach((p) => {
        const key = `${p.position.lat.toFixed(6)}|${p.position.lng.toFixed(6)}`
        const arr = groups.get(key) || []
        arr.push(p)
        groups.set(key, arr)
      })

      const map = new Map<string, { lat: number; lng: number }>()
      groups.forEach((group) => {
        if (group.length === 1) {
          map.set(group[0].id, group[0].position)
          return
        }
        const angleStep = (2 * Math.PI) / group.length
        const radius = 0.00006 // ~6-7 meters
        group.forEach((p, i) => {
          const angle = i * angleStep
          map.set(p.id, { lat: p.position.lat + Math.sin(angle) * radius, lng: p.position.lng + Math.cos(angle) * radius })
        })
      })
      return map
    }, [puntosMapa])

    // Control de InfoWindows abiertos
    const [openInfo, setOpenInfo] = useState<Record<string, boolean>>({})

    // Si showDetails es true, abrir info de matriz y sucursal automáticamente
    useEffect(() => {
      if (!showDetails) return
      try {
        const matriz = puntosMapa.find((p: Punto) => p.tipo === 'PRINCIPAL')
        const sucursal = puntosMapa.find((p: Punto) => p.tipo === 'SUCURSAL')
        const next: Record<string, boolean> = {}
        if (matriz) next[matriz.id] = true
        if (sucursal) next[sucursal.id] = true
        if (Object.keys(next).length) setOpenInfo((s) => ({ ...s, ...next }))
      } catch (err) {
        // ignore
      }
    }, [showDetails, puntosMapa])

    try {
    return (
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={selectedPosition ?? mapaCentro}
        zoom={13}
        options={{ streetViewControl: false, mapTypeControl: false, fullscreenControl: false, clickableIcons: false }}
      >
        {puntosMapa.map((punto) => {
          const icon = getMarkerIcon(punto.tipo === 'SUCURSAL' ? '#2563eb' : '#ef4444')
          const pos = (adjustedPositions.get(punto.id) as { lat: number; lng: number }) ?? punto.position
          return (
            <Marker
              key={punto.id}
              position={pos}
              label={{ text: punto.label, color: 'white', fontSize: '14px', fontWeight: 'bold' }}
              title={`${punto.label}. ${punto.nombre}`}
              icon={icon}
              onClick={() => setOpenInfo((s) => ({ ...s, [punto.id]: true }))}
            />
          )
        })}

        {/* InfoWindows por marcador (abiertos mediante click o showDetails) */}
        {puntosMapa.map((punto) => {
          const isOpen = openInfo[punto.id]
          if (!isOpen) return null
          const pos = (adjustedPositions.get(punto.id) as { lat: number; lng: number }) ?? punto.position
          return (
            <InfoWindow key={`info-${punto.id}`} position={pos} onCloseClick={() => setOpenInfo((s) => ({ ...s, [punto.id]: false }))}>
              <div className="max-w-xs text-sm">
                <strong>{punto.nombre}</strong>
                <div className="text-neutral-600">{punto.direccion ?? 'Sin dirección'}</div>
              </div>
            </InfoWindow>
          )
        })}
        {rutaPolyline.length > 1 && <Polyline path={rutaPolyline} options={{ strokeColor: '#3b82f6', strokeOpacity: 0.8, strokeWeight: 3 }} />}

        {/* Polígono opcional (por ejemplo: área de la sucursal o zona) */}
        {showDetails && areaPolygon && areaPolygon.length > 2 && (
          <Polygon
            path={areaPolygon}
            options={{ fillColor: '#10b981', fillOpacity: 0.06, strokeColor: '#10b981', strokeOpacity: 0.6, strokeWeight: 2 }}
          />
        )}

        {/* Si existe una matriz y una sucursal distintas, dibujar conexión y círculos de énfasis */}
        {(() => {
          try {
            // Sólo dibujar la conexión y círculos si estamos en modo detalle
            if (!showDetails || !selectedClienteId) return null

            const matriz = puntosMapa.find((p: Punto) => p.tipo === 'PRINCIPAL' && String(p.clienteId) === String(selectedClienteId))
            const sucursal = puntosMapa.find((p: Punto) => p.tipo === 'SUCURSAL' && String(p.clienteId) === String(selectedClienteId) && (
              selectedSucursalId ? String(p.sucursalId) === String(selectedSucursalId) : true
            ))

            if (matriz && sucursal) {
              const a = matriz.position
              const b = sucursal.position
              const almostEqual = (x: number, y: number) => Math.abs(x - y) < 0.00001
              const same = almostEqual(a.lat, b.lat) && almostEqual(a.lng, b.lng)
              if (!same) {
                return (
                  <>
                    <Polyline
                      path={[a, b]}
                      options={{ strokeColor: '#f97316', strokeOpacity: 0.9, strokeWeight: 2 }}
                    />
                    <Circle center={a} radius={40} options={{ fillColor: '#ef4444', fillOpacity: 0.08, strokeColor: '#ef4444', strokeOpacity: 0.4 }} />
                    <Circle center={b} radius={40} options={{ fillColor: '#2563eb', fillOpacity: 0.08, strokeColor: '#2563eb', strokeOpacity: 0.4 }} />
                  </>
                )
              }
            }
          } catch (err) {
            // ignore
          }
          return null
        })()}
      </GoogleMap>
    )
  } catch (err) {
    // Evitar que un error en la API rompa toda la UI
    // eslint-disable-next-line no-console
    console.error('GoogleMap render error', err)
    return (
      <div className="flex h-full items-center justify-center px-4 text-center text-xs text-red-600">Error al inicializar el mapa.</div>
    )
  }
}
