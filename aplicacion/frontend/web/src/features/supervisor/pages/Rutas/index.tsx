import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ZonaMapaGoogle } from '../../components/ZonaMapaGoogle';
import { PageHero } from 'components/ui/PageHero';
import { Plus, Map } from 'lucide-react';
import { ZonaSelector } from '../../components/ZonaSelector';
import { obtenerRuteroPorZonaYDia } from '../../services/ruteroApi';
import { obtenerZonas } from '../../services/zonasApi';

type DiaSemana = 'LUNES' | 'MARTES' | 'MIERCOLES' | 'JUEVES' | 'VIERNES';

interface Ruta {
  id?: string;
  cliente_id: string;
  prioridad_visita: string;
  frecuencia: string;
  hora_estimada?: string;
  sucursal_nombre?: string | null;
  ubicacion_gps?: {
    type: 'Point';
    coordinates: [number, number];
  } | null;
}

export default function RutasPage() {
  // Estado para zona seleccionada y día seleccionado
  const [zonaSeleccionada, setZonaSeleccionada] = useState('');
  const diasSemana = [
    'Lunes',
    'Martes',
    'Miércoles',
    'Jueves',
    'Viernes',
  ];
  const [diaSeleccionado, setDiaSeleccionado] = useState(diasSemana[0]);
  const [rutas, setRutas] = useState<Ruta[]>([]);
  const [loadingRutas, setLoadingRutas] = useState(false);
  const [poligonoZona, setPoligonoZona] = useState<Array<{ lat: number; lng: number }>>([]);
  const [puntosMapa, setPuntosMapa] = useState<Array<{ lat: number; lng: number; nombre?: string }>>([]);
  const [zonas, setZonas] = useState<any[]>([]);

  const navigate = useNavigate();

  // Cargar todas las zonas al inicio
  useEffect(() => {
    obtenerZonas().then(setZonas).catch(() => setZonas([]));
  }, []);

  useEffect(() => {
    async function cargarRutasYPoligono() {
      setLoadingRutas(true);
      setRutas([]);
      setPoligonoZona([]);
      setPuntosMapa([]);
      if (!zonaSeleccionada) {
        setLoadingRutas(false);
        return;
      }
      // Mapear día a número (API: Lunes=2, Martes=3, ... Viernes=6)
      const diaMap: Record<string, number> = {
        'Lunes': 1,
        'Martes': 2,
        'Miércoles': 3,
        'Jueves': 4,
        'Viernes': 5,
      };
      try {
        // Buscar zona seleccionada y su polígono
        const zonaObj = zonas.find(z => String(z.id) === String(zonaSeleccionada));
        // El polígono puede venir como string JSON, array, o null
        if (zonaObj && zonaObj.poligono_geografico) {
          let poligono = zonaObj.poligono_geografico;
          if (typeof poligono === 'string') {
            try {
              poligono = JSON.parse(poligono);
            } catch {}
          }
          // Si es GeoJSON tipo Polygon, transformar a array de {lat, lng}
          if (poligono && poligono.type === 'Polygon' && Array.isArray(poligono.coordinates)) {
            // Tomar el primer anillo (array de [lng, lat])
            const coords = poligono.coordinates[0];
            const poligonoGoogle = coords.map((c: [number, number]) => ({ lat: c[1], lng: c[0] }));
            setPoligonoZona(poligonoGoogle);
            console.log('Polígono transformado:', poligonoGoogle);
          } else if (Array.isArray(poligono)) {
            setPoligonoZona(poligono);
            console.log('Polígono cargado:', poligono);
          } else {
            setPoligonoZona([]);
            console.warn('Polígono no es array ni GeoJSON:', poligono);
          }
        } else {
          setPoligonoZona([]);
          console.warn('No hay polígono para la zona seleccionada');
        }
        // Cargar rutas
        const rutasApi = await obtenerRuteroPorZonaYDia(Number(zonaSeleccionada), diaMap[diaSeleccionado]);
        console.log('Rutas recibidas desde el API:', rutasApi);
         
        // Filtrar rutas localmente para asegurar que coincidan con la zona y el día seleccionados
        const rutasFiltradas = rutasApi.filter(ruta => {
          const rutaDia = Number(ruta.dia_semana || ruta.dia);
          const diaSeleccionadoNum = diaMap[diaSeleccionado];
          return (
            ruta.zona_id === Number(zonaSeleccionada) &&
            rutaDia === diaSeleccionadoNum
          );
        });
        console.log('Rutas filtradas por zona y día:', rutasFiltradas);
        console.log('Rutas filtradas localmente:', rutasFiltradas);
        setRutas(rutasFiltradas as Ruta[]);
        // Extraer puntos de las rutas filtradas (si tienen ubicación)
        const puntos = rutasFiltradas
          .map((r: any) => {
            // Buscar coordenadas en r.ubicacion_gps, r.cliente.ubicacion_gps, o r.sucursal.ubicacion_gps
            let gps = r.ubicacion_gps;
            if (!gps && r.cliente && r.cliente.ubicacion_gps) gps = r.cliente.ubicacion_gps;
            if (!gps && r.sucursal && r.sucursal.ubicacion_gps) gps = r.sucursal.ubicacion_gps;
            if (gps && Array.isArray(gps.coordinates)) {
              return {
                lat: gps.coordinates[1],
                lng: gps.coordinates[0],
                nombre: r.sucursal_nombre || r.cliente_nombre || 'Sucursal no definida',
              };
            }
            return null;
          })
          .filter((p): p is { lat: number; lng: number; nombre: string } => p !== null);
        setPuntosMapa(puntos as { lat: number; lng: number; nombre: string }[]);
        console.log('Puntos de rutas:', puntos);
      } catch {
        setRutas([]);
        setPoligonoZona([]);
        setPuntosMapa([]);
      }
      setLoadingRutas(false);
    }
    cargarRutasYPoligono();
  }, [zonaSeleccionada, diaSeleccionado, zonas]);

  return (
    <div className="space-y-6">
      <PageHero
        title="Gestión de Rutas"
        subtitle="Organiza y administra las rutas de tus equipos de ventas o supervisión"
        chips={['Logística', 'Rutas', 'Cobertura']}
      />
      {/* Barra de selección de zona y días */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border border-neutral-200 rounded-xl bg-gradient-to-r from-white via-neutral-50 to-white p-5 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 flex-wrap w-full">
          <ZonaSelector value={zonaSeleccionada} onChange={setZonaSeleccionada} />
          <div className="flex gap-1 sm:gap-2 flex-wrap bg-neutral-100 rounded-lg px-2 py-1 border border-neutral-200">
            {diasSemana.map(dia => (
              <button
                key={dia}
                type="button"
                onClick={() => setDiaSeleccionado(dia)}
                className={
                  `px-4 py-1.5 rounded-lg text-sm font-medium border transition-all duration-150 outline-none focus:ring-2 ` +
                  (diaSeleccionado === dia
                    ? 'bg-brand-red text-white border-brand-red shadow-md scale-105'
                    : 'bg-white text-neutral-700 border-transparent hover:bg-neutral-200 hover:text-brand-red')
                }
                style={{ minWidth: 80 }}
              >
                {dia}
              </button>
            ))}
          </div>
        </div>
        <div className="flex gap-2">
          <button
            className="flex items-center gap-2 rounded-lg bg-brand-red px-5 py-2 text-sm font-semibold text-white shadow hover:bg-brand-red-dark transition-all duration-150"
            onClick={() => navigate('/supervisor/rutas/crear')}
          >
            <Plus className="h-4 w-4" />
            Crear
          </button>
          <button
            className="flex items-center gap-2 rounded-lg bg-brand-red px-5 py-2 text-sm font-semibold text-white shadow hover:bg-brand-red-dark transition-all duration-150"
            // Aquí puedes poner la lógica para el mapa general
          >
            <Plus className="h-4 w-4" />
            Mapa General
          </button>
        </div>
      </div>
      {/* Mapa Google debajo de la barra */}
      <div className="w-full my-4">
        <ZonaMapaGoogle poligono={poligonoZona} puntos={puntosMapa} zoom={13} />
      </div>
      {/* Listado de rutas guardadas */}
      <div className="w-full my-4">
        {loadingRutas ? (
          <div className="text-center py-8 text-brand-red font-semibold">Cargando rutas...</div>
        ) : rutas.length === 0 ? (
          <div className="text-center py-8 text-neutral-500">
            <Map className="mx-auto mb-4 h-12 w-12 text-neutral-400" />
            <h3 className="text-lg font-semibold text-neutral-700">Sin rutas planificadas</h3>
            <p className="text-sm text-neutral-500 mt-2">Aquí podrás crear, visualizar y gestionar rutas por zona y día. Selecciona clientes y zonas para comenzar.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="font-semibold text-brand-red text-lg">Rutas guardadas para la zona y día seleccionados:</div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {rutas.map(ruta => (
                <div key={ruta.id} className="bg-white border border-neutral-200 rounded-xl shadow-sm p-4 flex flex-col gap-2">
                  <div className="font-semibold text-brand-red text-lg mb-1">Ruta</div>
                  <div className="text-sm text-neutral-700"><span className="font-medium">Sucursal:</span> {ruta.sucursal_nombre || 'No definida'}</div>
                  <div className="text-sm text-neutral-700"><span className="font-medium">Prioridad:</span> {ruta.prioridad_visita}</div>
                  <div className="text-sm text-neutral-700"><span className="font-medium">Frecuencia:</span> {ruta.frecuencia}</div>
                  <div className="text-sm text-neutral-700"><span className="font-medium">Hora estimada:</span> {ruta.hora_estimada || 'No definida'}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )

}
