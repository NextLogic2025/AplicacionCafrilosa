import React from 'react'
import MapPanel from './MapPanel'

export default function VendedorMapa({
  puntosMapa,
  rutaPolyline,
  mapaCentro,
  selectedPosition,
  isLoaded,
  loadError,
  isLoading,
  mapContainerStyle,
}: any) {
  return (
    <div className="flex h-full flex-col rounded-2xl border border-neutral-200 bg-white shadow-sm">
      <div className="border-b border-neutral-200 bg-neutral-50 px-4 py-3">
        <h3 className="text-sm font-semibold text-neutral-900">Mapa y ruta</h3>
        <p className="text-xs text-neutral-500">Visualiza el recorrido sugerido para el día seleccionado.</p>
      </div>

      <div className="relative flex-1">
        {isLoading ? (
          <div className="flex h-full items-center justify-center">
            <div className="text-sm text-neutral-500">Cargando mapa...</div>
          </div>
        ) : (
          <MapPanel
            puntosMapa={puntosMapa}
            rutaPolyline={rutaPolyline}
            mapaCentro={mapaCentro}
            selectedPosition={selectedPosition}
            isLoaded={isLoaded}
            loadError={loadError}
            mapContainerStyle={mapContainerStyle}
          />
        )}
      </div>

      {/* Leyenda */}
      <div className="border-t border-neutral-200 bg-neutral-50 p-3">
        <div className="flex items-center justify-between text-xs text-neutral-600">
          <div className="flex gap-4">
            <div className="flex items-center gap-1">
              <div className="h-3 w-3 rounded-full bg-red-500" />
              <span>Matriz</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="h-3 w-3 rounded-full bg-blue-500" />
              <span>Sucursal</span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <div className="h-0.5 w-6 bg-blue-500" />
            <span>Ruta sugerida</span>
          </div>
        </div>
      </div>
    </div>
  )
}
