import React, { useEffect, useState } from 'react';


import { obtenerZonas } from '../services/zonasApi';

export interface Zona {
  id: string;
  nombre: string;
}

interface ZonaSelectorProps {
  value: string;
  onChange: (zonaId: string) => void;
  className?: string;
}

export const ZonaSelector: React.FC<ZonaSelectorProps> = ({ value, onChange, className }) => {
  const [zonas, setZonas] = useState<Zona[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    obtenerZonas()
      .then(setZonas)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className={className}>
      <label className="font-medium text-sm text-neutral-700 flex items-center gap-2">
        <span className="hidden sm:inline">Zona:</span>
        <select
          className="border border-neutral-300 rounded-lg px-3 py-2 text-sm bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-red transition"
          value={value}
          onChange={e => onChange(e.target.value)}
          disabled={loading}
        >
          <option value="">Selecciona una zona</option>
          {zonas.map(zona => (
            <option key={zona.id} value={zona.id}>{zona.nombre}</option>
          ))}
        </select>
      </label>
      {loading && <div className="text-xs text-neutral-400 mt-1">Cargando zonas...</div>}
      {error && <div className="text-xs text-red-500 mt-1">{error}</div>}
    </div>
  );
};
