import React from 'react'
import { GoogleMap, Marker, Polyline } from '@react-google-maps/api'
import type { DiaSemana } from '../../../supervisor/services/types'
import { getMarkerIcon } from './helpers'

interface Punto {
  position: { lat: number; lng: number }
  label: string
  nombre: string
  id: string
  tipo: 'PRINCIPAL' | 'SUCURSAL'
  clienteId: string
}

export default function MapPanel({
  puntosMapa,
  rutaPolyline,
  mapaCentro,
  selectedPosition,
  isLoaded,
  loadError,
  mapContainerStyle,
}: {
  puntosMapa: Punto[]
  rutaPolyline: Array<{ lat: number; lng: number }>
  mapaCentro: { lat: number; lng: number }
  selectedPosition: { lat: number; lng: number } | null
  isLoaded: boolean
  loadError: unknown
  mapContainerStyle: any
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
          return (
            <Marker
              key={punto.id}
              position={punto.position}
              label={{ text: punto.label, color: 'white', fontSize: '14px', fontWeight: 'bold' }}
              title={`${punto.label}. ${punto.nombre}`}
              icon={icon}
            />
          )
        })}
        {rutaPolyline.length > 1 && <Polyline path={rutaPolyline} options={{ strokeColor: '#3b82f6', strokeOpacity: 0.8, strokeWeight: 3 }} />}
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
