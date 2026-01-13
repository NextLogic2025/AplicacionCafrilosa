import React from 'react';

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

export interface ZonaMapaGoogleProps {
  lat?: number;
  lng?: number;
  zoom?: number;
  style?: React.CSSProperties;
}

export const ZonaMapaGoogle: React.FC<ZonaMapaGoogleProps> = ({ lat = -12.0464, lng = -77.0428, zoom = 12, style }) => {
  // Puedes ajustar el centro y el zoom por defecto
  const mapUrl = `https://www.google.com/maps/embed/v1/view?key=${GOOGLE_MAPS_API_KEY}&center=${lat},${lng}&zoom=${zoom}&maptype=roadmap`;

  return (
    <div style={{ width: '100%', height: '100%', minHeight: 350, ...style }}>
      <iframe
        title="Mapa de zona"
        width="100%"
        height="100%"
        style={{ border: 0, borderRadius: 12, minHeight: 350 }}
        loading="lazy"
        allowFullScreen
        src={mapUrl}
      />
    </div>
  );
};
