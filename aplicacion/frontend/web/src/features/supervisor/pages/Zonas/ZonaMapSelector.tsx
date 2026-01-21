
import { useCallback, useMemo } from 'react'
import { GoogleMap, Polygon, DrawingManager, useJsApiLoader } from '@react-google-maps/api'
import { Alert } from 'components/ui/Alert'

import { GOOGLE_MAP_LIBRARIES, GOOGLE_MAP_SCRIPT_ID, GOOGLE_MAPS_API_KEY } from '../../../../config/googleMaps'

interface ZonaMapSelectorProps {
  polygon: google.maps.LatLngLiteral[]
  onPolygonChange: (path: google.maps.LatLngLiteral[]) => void
  center?: google.maps.LatLngLiteral
}

const containerStyle = {
  width: '100%',
  height: '450px', // Adjusted height to fit in modal
}

const defaultCenter = {
  lat: -1.831239,
  lng: -78.183406,
}

// Opciones para el DrawingManager
const drawingOptions = {
  drawingControl: true,
  drawingControlOptions: {
    position: 2, // google.maps.ControlPosition.TOP_CENTER (valor literal para evitar cargar google antes)
    drawingModes: ['polygon' as google.maps.drawing.OverlayType],
  },
  polygonOptions: {
    fillColor: '#f0412d',
    fillOpacity: 0.1,
    strokeWeight: 2,
    strokeColor: '#f0412d',
    editable: true,
    zIndex: 1,
  },
}

export function ZonaMapSelector({ polygon, onPolygonChange, center }: ZonaMapSelectorProps) {
  const { isLoaded, loadError } = useJsApiLoader({
    id: GOOGLE_MAP_SCRIPT_ID,
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries: GOOGLE_MAP_LIBRARIES,
  })

  const gmaps = typeof window !== 'undefined'
    ? (window as typeof window & { google?: typeof google }).google?.maps
    : undefined

  const drawingOptions = useMemo<google.maps.drawing.DrawingManagerOptions | undefined>(() => {
    if (!gmaps) return undefined
    return {
      drawingControl: true,
      drawingControlOptions: {
        position: gmaps.ControlPosition.TOP_CENTER,
        drawingModes: [gmaps.drawing.OverlayType.POLYGON],
      },
      polygonOptions: {
        fillColor: '#f0412d',
        fillOpacity: 0.25,
        strokeColor: '#f0412d',
        strokeOpacity: 0.8,
        strokeWeight: 2,
        clickable: false,
        draggable: false,
        editable: false,
      },
    }
  }, [gmaps])

  const polygonOptions = useMemo<google.maps.PolygonOptions>(
    () => ({
      fillColor: '#f0412d',
      fillOpacity: 0.22,
      strokeColor: '#f0412d',
      strokeOpacity: 0.85,
      strokeWeight: 2,
    }),
    []
  )

  const handlePolygonComplete = useCallback(
    (poly: google.maps.Polygon) => {
      const path = poly
        .getPath()
        .getArray()
        .map((latLng) => ({ lat: latLng.lat(), lng: latLng.lng() }))

      poly.setMap(null) // removemos el overlay porque renderizamos el nuestro controlado
      onPolygonChange(path)
    },
    [onPolygonChange]
  )

  const handleClear = () => onPolygonChange([])

  if (!GOOGLE_MAPS_API_KEY) {
    return <Alert type="error" message="Configura VITE_GOOGLE_MAPS_API_KEY en tu .env para habilitar el mapa." />
  }

  if (loadError) {
    return <Alert type="error" message="No se pudo cargar Google Maps, revisa la API key." />
  }

  return (
    <div className="space-y-2">
      <div className="overflow-hidden rounded-xl border border-neutral-200 shadow-sm">
        {isLoaded ? (
          <GoogleMap
            mapContainerStyle={containerStyle}
            center={center ?? polygon[0] ?? defaultCenter}
            zoom={polygon.length ? 13 : 12}
            options={{
              fullscreenControl: true,
              mapTypeControl: false,
              streetViewControl: false,
              clickableIcons: false,
            }}
          >
            {drawingOptions ? (
              <DrawingManager options={drawingOptions} onPolygonComplete={handlePolygonComplete} />
            ) : null}

            {polygon.length > 0 ? <Polygon path={polygon} options={polygonOptions} /> : null}
          </GoogleMap>
        ) : (
          <div className="flex h-[360px] items-center justify-center text-sm text-neutral-600">Cargando mapa...</div>
        )}
      </div>

      <div className="flex items-center justify-between text-xs text-neutral-600">
        <span>Traza el polígono en el mapa. Puedes mover el mapa y volver a trazar para ajustar.</span>
        <button
          type="button"
          onClick={handleClear}
          className="rounded-lg border border-neutral-200 px-3 py-1 font-semibold text-neutral-700 hover:bg-neutral-100"
        >
          Limpiar
        </button>
      </div>
    </div>
  )
}
