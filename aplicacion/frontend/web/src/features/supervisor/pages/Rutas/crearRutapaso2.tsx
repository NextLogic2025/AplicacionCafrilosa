import React, { useState, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle, Circle, X, ArrowLeft, Save, Plus } from 'lucide-react';

type Prioridad = 'ALTA' | 'MEDIA' | 'BAJA';
type Frecuencia = 'SEMANAL' | 'QUINCENAL' | 'MENSUAL';

interface Destino {
  id: string;
  nombre: string;
  clienteId: string;
  sucursales: string[];
  hora: string;
  prioridad: Prioridad;
  frecuencia: Frecuencia;
}

const AVAILABLE_HOURS = [
  '07:00', '08:00', '09:00', '10:00', '11:00', '12:00',
  '13:00', '14:00', '15:00', '16:00', '17:00', '18:00',
];
const PRIORIDADES = [
  { value: 'ALTA', label: 'Alta', color: 'bg-red-500' },
  { value: 'MEDIA', label: 'Media', color: 'bg-yellow-400' },
  { value: 'BAJA', label: 'Baja', color: 'bg-green-500' },
];
const FRECUENCIAS = [
  { value: 'SEMANAL', label: 'Semanal' },
  { value: 'QUINCENAL', label: 'Quincenal' },
  { value: 'MENSUAL', label: 'Mensual' },
];
const DIAS_SEMANA = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];

function ordenarDestinos(destinos: Destino[]) {
  const prioridadOrden: Record<Prioridad, number> = { 'ALTA': 0, 'MEDIA': 1, 'BAJA': 2 };
  return [...destinos].sort((a, b) => {
    const pa = prioridadOrden[a.prioridad] ?? 3;
    const pb = prioridadOrden[b.prioridad] ?? 3;
    if (pa !== pb) return pa - pb;
    return (a.hora || '').localeCompare(b.hora || '');
  });
}

const SupervisorRouteCreatePaso2Page: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { zone, destinations: initialDestinations = [], existingRoutes = [] } = location.state || {};

  // Estado de destinos configurables
  // Corregido: cada destino es una sucursal o dirección principal seleccionada, no el cliente
  const [destinos, setDestinos] = useState<Destino[]>(() =>
    (initialDestinations || []).map((d: any, i: number): Destino => ({
      id: d.id, // id de la sucursal o principal
      nombre: d.nombre || `Destino ${i + 1}`,
      clienteId: d.clienteId,
      sucursales: [d.id],
      hora: '',
      prioridad: 'MEDIA',
      frecuencia: 'SEMANAL',
    }))
  );
  const [diasSeleccionados, setDiasSeleccionados] = useState<string[]>([...DIAS_SEMANA]);

  // Handlers
  const handleDestinoChange = (id: string, field: keyof Destino, value: string) => {
    setDestinos((prev: Destino[]) => prev.map((d: Destino) => d.id === id ? { ...d, [field]: value } : d));
  };
  const handleEliminarDestino = (id: string) => {
    setDestinos((prev: Destino[]) => prev.filter((d: Destino) => d.id !== id));
  };
  const handleAgregarDestino = () => {
    setDestinos((prev: Destino[]) => [
      ...prev,
      {
        id: 'nuevo-' + (prev.length + 1),
        nombre: 'Nuevo destino',
        clienteId: '',
        sucursales: [],
        hora: '',
        prioridad: 'MEDIA',
        frecuencia: 'SEMANAL',
      },
    ]);
  };
  const handleToggleDia = (dia: string) => {
    setDiasSeleccionados((prev: string[]) => prev.includes(dia) ? prev.filter((d: string) => d !== dia) : [...prev, dia]);
  };

  // Ordenar destinos
  const destinosOrdenados = useMemo(() => ordenarDestinos(destinos), [destinos]);

  // Resumen final
  const resumen = {
    zona: zone,
    destinos: destinosOrdenados.length,
    dias: diasSeleccionados,
    frecuencias: destinosOrdenados.map(d => d.frecuencia),
    totalRutas: destinosOrdenados.length * diasSeleccionados.length,
  };

  return (
    <div className="max-w-3xl mx-auto py-8 space-y-6">
      {/* Indicador de pasos */}
      <div className="flex items-center justify-center gap-4 mb-6">
        <div className="flex items-center gap-2 text-green-600">
          <span className="w-8 h-8 flex items-center justify-center rounded-full border-2 border-green-600 bg-white font-bold">✓</span>
          <span>Paso 1</span>
        </div>
        <div className="w-8 h-0.5 bg-neutral-300" />
        <div className="flex items-center gap-2 text-brand-red">
          <span className="w-8 h-8 flex items-center justify-center rounded-full border-2 border-brand-red bg-white font-bold">2</span>
          <span>Paso 2</span>
        </div>
      </div>

      {/* Resumen del paso 1 */}
      <div className="flex items-center justify-between bg-neutral-50 border rounded-lg p-4 mb-2">
        <div>
          <div className="font-semibold text-neutral-800">Zona seleccionada: <span className="text-brand-red">{zone || 'Sin zona'}</span></div>
          <div className="text-sm text-neutral-600">Destinos seleccionados: {destinos.length}</div>
        </div>

      </div>

      {/* Lista de destinos configurables */}
      <div className="space-y-4">
        {destinosOrdenados.length === 0 && (
          <div className="text-neutral-500 text-center">No hay destinos configurados</div>
        )}
        {destinosOrdenados.map((destino, idx) => (
          <div key={destino.id} className="border rounded-lg p-4 flex flex-col gap-2 bg-white shadow-sm relative">
            <button
              className="absolute top-2 right-2 text-neutral-400 hover:text-red-500"
              onClick={() => handleEliminarDestino(destino.id)}
              title="Eliminar destino"
            >
              <X />
            </button>
            <div className="flex items-center gap-3">
              <span className="font-semibold text-brand-red">Destino {idx + 1}</span>
              <span className="text-xs text-neutral-500">ID: {destino.id}</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mt-2">
              {/* Selector de hora */}
              <label className="flex flex-col gap-1 text-sm">
                Hora
                <select
                  className="border rounded px-2 py-1"
                  value={destino.hora}
                  onChange={e => handleDestinoChange(destino.id, 'hora', e.target.value)}
                >
                  <option value="">Selecciona hora</option>
                  {AVAILABLE_HOURS.map(h => <option key={h} value={h}>{h}</option>)}
                </select>
              </label>
              {/* Selector de prioridad */}
              <label className="flex flex-col gap-1 text-sm">
                Prioridad
                <select
                  className="border rounded px-2 py-1"
                  value={destino.prioridad}
                  onChange={e => handleDestinoChange(destino.id, 'prioridad', e.target.value)}
                >
                  {PRIORIDADES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                </select>
              </label>
              {/* Selector de frecuencia */}
              <label className="flex flex-col gap-1 text-sm">
                Frecuencia
                <select
                  className="border rounded px-2 py-1"
                  value={destino.frecuencia}
                  onChange={e => handleDestinoChange(destino.id, 'frecuencia', e.target.value)}
                >
                  {FRECUENCIAS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                </select>
              </label>
              {/* Placeholder para más campos si se requiere */}
            </div>
          </div>
        ))}
      </div>

      {/* Selector de días */}
      <div className="flex flex-col gap-2 mt-6">
        <div className="font-medium text-neutral-800 mb-1">Días de la semana</div>
        <div className="flex gap-2 flex-wrap">
          {DIAS_SEMANA.map(dia => (
            <button
              key={dia}
              type="button"
              onClick={() => handleToggleDia(dia)}
              className={
                'px-4 py-1.5 rounded-lg text-sm font-medium border transition-all duration-150 outline-none focus:ring-2 ' +
                (diasSeleccionados.includes(dia)
                  ? 'bg-brand-red text-white border-brand-red shadow-md scale-105'
                  : 'bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-200')
              }
              style={{ minWidth: 80 }}
            >
              {diasSeleccionados.includes(dia) ? <CheckCircle className="inline w-4 h-4 mr-1" /> : <Circle className="inline w-4 h-4 mr-1" />}
              {dia}
            </button>
          ))}
        </div>
      </div>

      {/* Vista previa del mapa (opcional, placeholder) */}
      <div className="mt-6">
        <div className="font-medium text-neutral-800 mb-2">Vista previa del mapa (opcional)</div>
        <div className="h-40 bg-neutral-100 border rounded-lg flex items-center justify-center text-neutral-400">
          Mapa aquí (opcional)
        </div>
      </div>

      {/* Resumen final */}
      <div className="mt-6 border rounded-lg bg-neutral-50 p-4">
        <div className="font-semibold text-neutral-800 mb-1">Resumen</div>
        <div className="text-sm text-neutral-700">Zona: <span className="text-brand-red font-bold">{resumen.zona}</span></div>
        <div className="text-sm text-neutral-700">Destinos: {resumen.destinos}</div>
        <div className="text-sm text-neutral-700">Días: {resumen.dias.join(', ')}</div>
        <div className="text-sm text-neutral-700">Frecuencias: {resumen.frecuencias.join(', ')}</div>
        <div className="text-sm text-neutral-700">Total rutas: <span className="font-bold">{resumen.totalRutas}</span></div>
      </div>

      {/* Botones */}
      <div className="flex justify-between mt-6 gap-4">
        <button
          className="flex items-center gap-2 rounded-lg bg-neutral-200 px-5 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-300"
          onClick={() => navigate('/supervisor/rutas')}
        >
          <ArrowLeft className="w-4 h-4" /> Inicio
        </button>
        <button
          className="flex items-center gap-2 rounded-lg bg-brand-red px-5 py-2 text-sm font-semibold text-white hover:bg-brand-red-dark"
          onClick={() => alert('Ruta guardada (simulado)')}
        >
          <Save className="w-4 h-4" /> Guardar
        </button>
      </div>
    </div>
  );
};

export default SupervisorRouteCreatePaso2Page;
