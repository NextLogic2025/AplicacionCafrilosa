import { useState } from 'react'
import { type ZonaOption } from './ClienteForm'
import { SucursalLocationPicker } from './SucursalLocationPicker'

export interface SucursalTemp {
  id?: string
  nombre_sucursal: string
  direccion_entrega?: string
  contacto_nombre?: string
  contacto_telefono?: string
  latitud?: number | null
  longitud?: number | null
  ubicacion_gps?: { type: 'Point'; coordinates: [number, number] } | null
}

interface SucursalesStepProps {
  sucursales: SucursalTemp[]
  zonaId: number | null
  zonas: ZonaOption[]
  ubicacionMatriz: google.maps.LatLngLiteral | null
  onAddSucursal: (sucursal: SucursalTemp) => void
  onRemoveSucursal: (index: number) => void
  onUpdateSucursal: (index: number, sucursal: SucursalTemp) => void
}

export function SucursalesStep({ sucursales, zonaId, zonas, ubicacionMatriz, onAddSucursal, onRemoveSucursal, onUpdateSucursal }: SucursalesStepProps) {
  const [newSucursal, setNewSucursal] = useState<SucursalTemp>({
    nombre_sucursal: '',
    direccion_entrega: '',
    contacto_nombre: '',
    contacto_telefono: '',
    latitud: null,
    longitud: null,
    ubicacion_gps: null,
  })

  function handleAddSucursal() {
    if (!newSucursal.nombre_sucursal.trim() && !newSucursal.direccion_entrega?.trim()) return
    const payload: SucursalTemp = {
      ...newSucursal,
      nombre_sucursal: newSucursal.nombre_sucursal.trim() || (newSucursal.direccion_entrega?.trim() ?? `Sucursal ${sucursales.length + 1}`),
    }
    onAddSucursal(payload)
    setNewSucursal({
      nombre_sucursal: '',
      direccion_entrega: '',
      contacto_nombre: '',
      contacto_telefono: '',
      latitud: null,
      longitud: null,
      ubicacion_gps: null,
    })
  }

  const handleStepKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' && e.target instanceof HTMLInputElement) {
      e.preventDefault()
      e.stopPropagation()
      handleAddSucursal()
    }
  }

  return (
    <div className="space-y-4" onKeyDown={handleStepKeyDown}>
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <h3 className="text-sm font-semibold text-gray-800 mb-4">Agregar Sucursal Adicional (Opcional)</h3>
        
        <div className="space-y-3">
          <input
            type="text"
            placeholder="Nombre de la sucursal"
            value={newSucursal.nombre_sucursal}
            onChange={(e) => setNewSucursal({ ...newSucursal, nombre_sucursal: e.target.value })}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-red focus:ring-2 focus:ring-brand-red/20"
          />
          
          <input
            type="text"
            placeholder="Dirección (opcional)"
            value={newSucursal.direccion_entrega}
            onChange={(e) => setNewSucursal({ ...newSucursal, direccion_entrega: e.target.value })}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-red focus:ring-2 focus:ring-brand-red/20"
          />
          
          <div className="grid grid-cols-2 gap-3">
            <input
              type="text"
              placeholder="Contacto (opcional)"
              value={newSucursal.contacto_nombre}
              onChange={(e) => setNewSucursal({ ...newSucursal, contacto_nombre: e.target.value })}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-red focus:ring-2 focus:ring-brand-red/20"
            />
            
            <input
              type="tel"
              placeholder="Teléfono (opcional)"
              value={newSucursal.contacto_telefono}
              onChange={(e) => setNewSucursal({ ...newSucursal, contacto_telefono: e.target.value })}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-red focus:ring-2 focus:ring-brand-red/20"
            />
          </div>

          <SucursalLocationPicker
            position={newSucursal.latitud && newSucursal.longitud ? { lat: newSucursal.latitud, lng: newSucursal.longitud } : null}
            zonaId={zonaId}
            zonas={zonas}
            ubicacionMatriz={ubicacionMatriz}
            onChange={(pos) => {
              const updated: SucursalTemp = {
                ...newSucursal,
                latitud: pos.lat,
                longitud: pos.lng,
                ubicacion_gps: {
                  type: 'Point',
                  coordinates: [pos.lng, pos.lat],
                },
              }
              setNewSucursal(updated)
            }}
          />
          
          <button
            type="button"
            onClick={handleAddSucursal}
            disabled={!newSucursal.nombre_sucursal.trim() && !newSucursal.direccion_entrega?.trim()}
            className="w-full rounded-lg bg-brand-red text-white px-4 py-2 font-medium hover:bg-brand-red/90 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            + Agregar Sucursal
          </button>
        </div>
      </div>

      {sucursales.length > 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <h3 className="text-sm font-semibold text-gray-800 mb-3">Sucursales Agregadas ({sucursales.length})</h3>
          
          <div className="space-y-2">
            {sucursales.map((sucursal, index) => (
              <div key={index} className="flex items-start justify-between rounded-lg border border-gray-200 bg-gray-50 p-3">
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{sucursal.nombre_sucursal}</p>
                  {sucursal.direccion_entrega && <p className="text-xs text-gray-600">📍 {sucursal.direccion_entrega}</p>}
                  {sucursal.contacto_nombre && <p className="text-xs text-gray-600">👤 {sucursal.contacto_nombre}</p>}
                  {sucursal.contacto_telefono && <p className="text-xs text-gray-600">📞 {sucursal.contacto_telefono}</p>}
                  {sucursal.latitud && sucursal.longitud && (
                    <p className="text-xs text-green-700 font-medium">🗺️ Ubicación: {sucursal.latitud.toFixed(6)}, {sucursal.longitud.toFixed(6)}</p>
                  )}
                </div>
                
                <button
                  type="button"
                  onClick={() => onRemoveSucursal(index)}
                  className="ml-2 text-red-500 hover:text-red-700 text-sm font-medium"
                >
                  Eliminar
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-6 text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          <h4 className="mt-3 text-sm font-medium text-gray-900">Sin Sucursales</h4>
          <p className="mt-1 text-xs text-gray-600">Este paso es opcional. Puedes agregar sucursales ahora o finalizar sin ellas.</p>
        </div>
      )}
    </div>
  )
}
