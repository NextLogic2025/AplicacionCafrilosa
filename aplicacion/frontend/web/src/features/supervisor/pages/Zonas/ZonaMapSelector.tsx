import { useCallback, useMemo } from 'react'
import { GoogleMap, Polygon, DrawingManager, useJsApiLoader } from '@react-google-maps/api'
import { Alert } from 'components/ui/Alert'

const GOOGLE_MAP_LIBRARIES: ["drawing"] = ['drawing']

interface ZonaMapSelectorProps {
  apiKey: string | undefined
  polygon: google.maps.LatLngLiteral[]
  onPolygonChange: (path: google.maps.LatLngLiteral[]) => void
  center?: google.maps.LatLngLiteral
}

const containerStyle = {
  width: '100%',
  height: '360px',
}

const defaultCenter: google.maps.LatLngLiteral = {
  lat: -3.99313, // Loja como punto de referencia central
  lng: -79.20422,
}

export function ZonaMapSelector({ apiKey, polygon, onPolygonChange, center }: ZonaMapSelectorProps) {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: apiKey ?? '',
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

  if (!apiKey) {
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
