import React from 'react';
import { GoogleMap, Polygon, Marker, InfoWindow, useJsApiLoader } from '@react-google-maps/api';
import { GOOGLE_MAP_LIBRARIES, GOOGLE_MAP_SCRIPT_ID, GOOGLE_MAPS_API_KEY } from '../../../config/googleMaps';

export interface PuntoMapa {
  lat: number;
  lng: number;
  nombre?: string;
}

export interface ZonaMapaGoogleProps {
  poligono?: Array<{ lat: number; lng: number }>;
  puntos?: PuntoMapa[];
  center?: { lat: number; lng: number };
  zoom?: number;
  style?: React.CSSProperties;
}

export const ZonaMapaGoogle: React.FC<ZonaMapaGoogleProps> = ({
  poligono = [],
  puntos = [],
  center,
  zoom = 13,
  style,
}) => {
  const { isLoaded, loadError } = useJsApiLoader({
    id: GOOGLE_MAP_SCRIPT_ID,
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries: GOOGLE_MAP_LIBRARIES,
  });

  // Calcular centro si no se pasa
  const mapCenter = center ||
    (poligono.length > 0
      ? poligono[0]
      : puntos.length > 0
        ? puntos[0]
        : { lat: -3.99313, lng: -79.20422 });

  if (!isLoaded) return <div style={{ minHeight: 350 }}>Cargando mapa...</div>;

  return (
    <div style={{ width: '100%', height: 350, borderRadius: 12, ...style }}>
      <GoogleMap
        mapContainerStyle={{ width: '100%', height: '100%', borderRadius: 12 }}
        center={mapCenter}
        zoom={zoom}
        options={{
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: false,
          zoomControl: true,
        }}
      >
        {poligono.length > 0 && (
          <Polygon
            path={poligono}
            options={{
              fillColor: '#FF0000',
              fillOpacity: 0.15,
              strokeColor: '#FF0000',
              strokeOpacity: 0.7,
              strokeWeight: 2,
            }}
          />
        )}
        {puntos.map((p, i) => (
          <React.Fragment key={i}>
            <Marker
              position={{ lat: p.lat, lng: p.lng }}
              icon={{
                path: google.maps.SymbolPath.CIRCLE,
                scale: 8,
                fillColor: '#d32f2f',
                fillOpacity: 1,
                strokeColor: '#ffffff',
                strokeWeight: 2,
              }}
            />
            {p.nombre && (
              <InfoWindow
                position={{ lat: p.lat, lng: p.lng }}
                options={{
                  pixelOffset: new google.maps.Size(0, -15),
                  disableAutoPan: true,
                }}
              >
                <div style={{
                  background: 'white',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  color: '#d32f2f',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                  whiteSpace: 'nowrap',
                }}>
                  {p.nombre}
                </div>
              </InfoWindow>
            )}
          </React.Fragment>
        ))}
      </GoogleMap>
    </div>
  );
};

