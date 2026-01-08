import { useCallback, useEffect, useRef, useState } from 'react'
import { GoogleMap, Polygon, useJsApiLoader } from '@react-google-maps/api'

type LatLngLiteral = google.maps.LatLngLiteral

interface ZonaMapSelectorProps {
  apiKey: string | undefined
  polygon: LatLngLiteral[]
  onPolygonChange: (path: LatLngLiteral[]) => void
}

const GOOGLE_MAP_LIBRARIES: ('drawing' | 'geometry')[] = ['drawing', 'geometry']

const MAP_CONTAINER_STYLE = {
  width: '100%',
  height: '300px',
}

const DEFAULT_CENTER = {
  lat: 4.6097,
  lng: -74.0817, // Bogotá
}

export function ZonaMapSelector({ apiKey, polygon, onPolygonChange }: ZonaMapSelectorProps) {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: apiKey || '',
    libraries: GOOGLE_MAP_LIBRARIES,
  })

  const mapRef = useRef<google.maps.Map | null>(null)
  const drawingManagerRef = useRef<google.maps.drawing.DrawingManager | null>(null)
  const polygonRef = useRef<google.maps.Polygon | null>(null)

  const [currentPolygon, setCurrentPolygon] = useState<LatLngLiteral[]>(polygon)

  useEffect(() => {
    setCurrentPolygon(polygon)
  }, [polygon])

  const onMapLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map

    // Initialize Drawing Manager
    const drawingManager = new google.maps.drawing.DrawingManager({
      drawingMode: google.maps.drawing.OverlayType.POLYGON,
      drawingControl: true,
      drawingControlOptions: {
        position: google.maps.ControlPosition.TOP_CENTER,
        drawingModes: [google.maps.drawing.OverlayType.POLYGON],
      },
      polygonOptions: {
        fillColor: '#dc2626',
        fillOpacity: 0.1,
        strokeColor: '#dc2626',
        strokeOpacity: 0.6,
        strokeWeight: 2,
        clickable: true,
        editable: true,
        zIndex: 1,
      },
    })

    drawingManager.setMap(map)
    drawingManagerRef.current = drawingManager

    // Listen for polygon complete
    google.maps.event.addListener(drawingManager, 'polygoncomplete', (polygon: google.maps.Polygon) => {
      const path = polygon.getPath()
      const pathArray: LatLngLiteral[] = []
      for (let i = 0; i < path.getLength(); i++) {
        const latLng = path.getAt(i)
        pathArray.push({ lat: latLng.lat(), lng: latLng.lng() })
      }
      setCurrentPolygon(pathArray)
      onPolygonChange(pathArray)

      // Remove previous polygon if exists
      if (polygonRef.current) {
        polygonRef.current.setMap(null)
      }
      polygonRef.current = polygon

      // Listen for polygon edit
      google.maps.event.addListener(polygon.getPath(), 'set_at', updatePolygon)
      google.maps.event.addListener(polygon.getPath(), 'insert_at', updatePolygon)
      google.maps.event.addListener(polygon.getPath(), 'remove_at', updatePolygon)

      // Switch back to hand mode after drawing
      drawingManager.setDrawingMode(null)
    })

    function updatePolygon() {
      if (!polygonRef.current) return
      const path = polygonRef.current.getPath()
      const pathArray: LatLngLiteral[] = []
      for (let i = 0; i < path.getLength(); i++) {
        const latLng = path.getAt(i)
        pathArray.push({ lat: latLng.lat(), lng: latLng.lng() })
      }
      setCurrentPolygon(pathArray)
      onPolygonChange(pathArray)
    }
  }, [onPolygonChange])

  const onMapUnmount = useCallback(() => {
    if (drawingManagerRef.current) {
      google.maps.event.clearInstanceListeners(drawingManagerRef.current)
      drawingManagerRef.current = null
    }
    if (polygonRef.current) {
      google.maps.event.clearInstanceListeners(polygonRef.current)
      polygonRef.current = null
    }
    mapRef.current = null
  }, [])

  if (!apiKey) {
    return (
      <div className="flex h-[300px] items-center justify-center rounded-lg border border-gray-200 bg-gray-50">
        <div className="text-sm text-gray-500">Configura VITE_GOOGLE_MAPS_API_KEY para usar el mapa</div>
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="flex h-[300px] items-center justify-center rounded-lg border border-gray-200 bg-red-50">
        <div className="text-sm text-red-600">Error cargando Google Maps</div>
      </div>
    )
  }

  if (!isLoaded) {
    return (
      <div className="flex h-[300px] items-center justify-center rounded-lg border border-gray-200 bg-gray-50">
        <div className="text-sm text-gray-500">Cargando mapa...</div>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-gray-200 overflow-hidden">
      <GoogleMap
        mapContainerStyle={MAP_CONTAINER_STYLE}
        center={DEFAULT_CENTER}
        zoom={12}
        onLoad={onMapLoad}
        onUnmount={onMapUnmount}
        options={{
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: false,
        }}
      >
        {/* Display current polygon */}
        {currentPolygon.length > 0 && (
          <Polygon
            paths={currentPolygon}
            options={{
              fillColor: '#dc2626',
              fillOpacity: 0.1,
              strokeColor: '#dc2626',
              strokeOpacity: 0.6,
              strokeWeight: 2,
            }}
          />
        )}
      </GoogleMap>
    </div>
  )
}