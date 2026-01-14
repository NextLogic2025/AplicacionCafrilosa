import React, { useEffect, useState } from 'react';
import { GoogleMap, Polygon, Marker } from '@react-google-maps/api';
import { loadGoogleMaps } from '../../../utils/googleMapsLoader';

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
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const loadMap = async () => {
      const loaded = await loadGoogleMaps();
      setIsLoaded(loaded);
    };
    loadMap();
  }, []);

  // Calcular centro si no se pasa
  const mapCenter = center ||
    (poligono.length > 0
      ? poligono[0]
      : puntos.length > 0
      ? puntos[0]
      : { lat: -12.0464, lng: -77.0428 });

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
          <Marker key={i} position={{ lat: p.lat, lng: p.lng }} label={p.nombre ? { text: p.nombre, color: '#d32f2f' } : undefined} />
        ))}
      </GoogleMap>
    </div>
  );
};
