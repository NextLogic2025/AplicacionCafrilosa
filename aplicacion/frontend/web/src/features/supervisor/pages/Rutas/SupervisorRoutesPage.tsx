import React, { useEffect, useState } from 'react';
import { RouteCard } from '../../components/routes/RouteCard';
import { FabMenu } from '../../components/routes/FabMenu';
import { DAYS } from '../../types/routes';
import { RouteService } from '../../services/RouteService';

// Simulación de fetch de zonas (puedes reemplazar por tu propio servicio de zonas)
async function fetchZonas() {
  // GET /api/zonas
  const res = await fetch(`${import.meta.env.VITE_CATALOGO_BASE_URL}/api/zonas`);
  return res.json();
}

export default function SupervisorRoutesPage() {
  const [zonas, setZonas] = useState<any[]>([]);
  const [zonaSeleccionada, setZonaSeleccionada] = useState<string | null>(null);
  const [diaSeleccionado, setDiaSeleccionado] = useState<number>(1);
  const [rutas, setRutas] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Cargar zonas al montar
  useEffect(() => {
    fetchZonas().then(zs => {
      console.log('Respuesta de /api/zonas:', zs);
      if (Array.isArray(zs)) {
        setZonas(zs);
        if (zs.length > 0) setZonaSeleccionada(zs[0].id?.toString() || zs[0].id);
      } else {
        setZonas([]);
      }
    }).catch(err => {
      console.error('Error al cargar zonas:', err);
      setZonas([]);
    });
  }, []);

  // Cargar rutas cuando cambia zona o día
  useEffect(() => {
    if (!zonaSeleccionada) return;
    setLoading(true);
    RouteService.getAll().then((all) => {
      setRutas(
        all.filter(r => r.activo && r.zona_id?.toString() === zonaSeleccionada && r.dia_semana === diaSeleccionado)
      );
      setLoading(false);
    });
  }, [zonaSeleccionada, diaSeleccionado]);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Planificador de Rutas</h1>

      {/* Selector de zona */}
      <div className="mb-4 flex gap-2 items-center">
        <span className="font-medium">Zona:</span>
        {Array.isArray(zonas) && zonas.length > 0 ? (
          <select
            className="border rounded px-2 py-1"
            value={zonaSeleccionada || ''}
            onChange={e => setZonaSeleccionada(e.target.value)}
          >
            {zonas.map(z => (
              <option key={z.id} value={z.id}>{z.nombre}</option>
            ))}
          </select>
        ) : (
          <span className="text-neutral-400">No hay zonas disponibles</span>
        )}
      </div>

      {/* Tabs de días */}
      <div className="mb-6 flex gap-2">
        {DAYS.map(d => (
          <button
            key={d.id}
            className={`px-4 py-2 rounded-full font-medium border transition ${diaSeleccionado === d.id ? 'bg-brand-red text-white border-brand-red' : 'bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-100'}`}
            onClick={() => setDiaSeleccionado(d.id)}
          >
            {d.label}
          </button>
        ))}
      </div>

      {/* Lista de rutas */}
      {loading ? (
        <div className="text-neutral-400">Cargando rutas...</div>
      ) : rutas.length === 0 ? (
        <div className="text-neutral-400">No hay rutas para esta zona y día.</div>
      ) : (
        <div className="grid gap-4">
          {rutas.map(ruta => (
            <RouteCard key={ruta.id} route={ruta} />
          ))}
        </div>
      )}

      {/* FAB Menu */}
      <FabMenu onCreate={() => {}} onShowInactive={() => {}} />
    </div>
  );
}
