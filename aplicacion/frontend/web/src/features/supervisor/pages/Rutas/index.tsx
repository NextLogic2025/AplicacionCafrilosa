import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ZonaMapaGoogle } from '../../components/ZonaMapaGoogle';
import { PageHero } from 'components/ui/PageHero';
import { Modal } from 'components/ui/Modal';
import { FormField } from 'components/ui/FormField';
import { Plus, Map } from 'lucide-react';
import { ZonaSelector } from '../../components/ZonaSelector';
import { obtenerRuteroPorZonaYDia, editarRutaFiltrada } from '../../services/ruteroApi';
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

  // Estado para edición de ruta
  const [rutaEditando, setRutaEditando] = useState<Ruta | null>(null);
  const [editForm, setEditForm] = useState({
    zona_id: '',
    dia_semana: '',
    frecuencia: '',
    prioridad_visita: '',
    orden_sugerido: '',
    hora_estimada_arribo: '',
    activo: true,
  });
  const [editLoading, setEditLoading] = useState(false);

  // Estado para notificaciones toast
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

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
            } catch { }
          }
          // Si es GeoJSON tipo Polygon, transformar a array de {lat, lng}
          if (poligono && poligono.type === 'Polygon' && Array.isArray(poligono.coordinates)) {
            // Tomar el primer anillo (array de [lng, lat])
            const coords = poligono.coordinates[0];
            const poligonoGoogle = coords.map((c: [number, number]) => ({ lat: c[1], lng: c[0] }));
            setPoligonoZona(poligonoGoogle);
          } else if (Array.isArray(poligono)) {
            setPoligonoZona(poligono);
          } else {
            setPoligonoZona([]);
          }
        } else {
          setPoligonoZona([]);
        }
        // Cargar rutas
        const diaSeleccionadoNum = diaMap[diaSeleccionado];
        const rutasApi = await obtenerRuteroPorZonaYDia(Number(zonaSeleccionada), diaSeleccionadoNum);

        // Filtrar rutas localmente para asegurar que coincidan con la zona y el día seleccionados
        const rutasFiltradas = rutasApi.filter(ruta => {
          const rutaDia = Number(ruta.dia_semana);
          return (
            ruta.zona_id === Number(zonaSeleccionada) &&
            rutaDia === diaSeleccionadoNum
          );
        });
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
      } catch {
        setRutas([]);
        setPoligonoZona([]);
        setPuntosMapa([]);
      }
      setLoadingRutas(false);
    }
    cargarRutasYPoligono();
  }, [zonaSeleccionada, diaSeleccionado, zonas]);

  // Cuando se abre el modal, cargar los datos actuales
  useEffect(() => {
    if (rutaEditando) {
      setEditForm({
        zona_id: zonaSeleccionada,
        dia_semana: String(diasSemana.indexOf(diaSeleccionado) + 1),
        frecuencia: rutaEditando.frecuencia || '',
        prioridad_visita: rutaEditando.prioridad_visita || '',
        orden_sugerido: '1',
        hora_estimada_arribo: rutaEditando.hora_estimada || '',
        activo: true,
      });
    }
  }, [rutaEditando]);

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
            Rutas Inactivas
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
                  <button
                    className="mt-2 px-4 py-1 rounded bg-brand-red text-white font-semibold hover:bg-brand-red-dark"
                    onClick={() => setRutaEditando(ruta)}
                  >
                    Editar
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      {/* Modal de edición */}
      <Modal
        isOpen={!!rutaEditando}
        title="Editar Ruta"
        onClose={() => setRutaEditando(null)}
        headerGradient="red"
        maxWidth="md"
      >
        <form
          onSubmit={async e => {
            e.preventDefault();
            setEditLoading(true);
            try {
              await editarRutaFiltrada(rutaEditando!.id!, {
                zona_id: Number(editForm.zona_id),
                dia_semana: Number(editForm.dia_semana),
                frecuencia: editForm.frecuencia,
                prioridad_visita: editForm.prioridad_visita,
                orden_sugerido: Number(editForm.orden_sugerido),
                hora_estimada_arribo: editForm.hora_estimada_arribo,
                activo: editForm.activo,
              });
              setRutaEditando(null);
              // Actualizar el estado local con los campos correctamente mapeados
              setRutas(rutas => rutas.map(r =>
                r.id === rutaEditando!.id
                  ? {
                    ...r,
                    prioridad_visita: editForm.prioridad_visita,
                    frecuencia: editForm.frecuencia,
                    hora_estimada: editForm.hora_estimada_arribo, // Mapear correctamente
                  }
                  : r
              ));
              setToast({ type: 'success', message: '¡Ruta editada con éxito!' });
              setTimeout(() => setToast(null), 3000);
            } catch (err) {
              setToast({ type: 'error', message: 'Error al editar la ruta' });
              setTimeout(() => setToast(null), 3000);
            }
            setEditLoading(false);
          }}
          className="space-y-4"
        >
          <FormField
            label="Prioridad"
            type="select"
            value={editForm.prioridad_visita}
            onChange={value => setEditForm(f => ({ ...f, prioridad_visita: value }))}
            options={[
              { label: 'ALTA', value: 'ALTA' },
              { label: 'MEDIA', value: 'MEDIA' },
              { label: 'BAJA', value: 'BAJA' },
            ]}
          />
          <FormField
            label="Día de la semana"
            type="select"
            value={editForm.dia_semana}
            onChange={value => setEditForm(f => ({ ...f, dia_semana: value }))}
            options={[
              { label: 'Lunes', value: '1' },
              { label: 'Martes', value: '2' },
              { label: 'Miércoles', value: '3' },
              { label: 'Jueves', value: '4' },
              { label: 'Viernes', value: '5' },
            ]}
          />
          <FormField
            label="Frecuencia"
            type="select"
            value={editForm.frecuencia}
            onChange={value => setEditForm(f => ({ ...f, frecuencia: value }))}
            options={[
              { label: 'SEMANAL', value: 'SEMANAL' },
              { label: 'QUINCENAL', value: 'QUINCENAL' },
              { label: 'MENSUAL', value: 'MENSUAL' },
            ]}
          />
          <FormField
            label="Hora estimada de arribo"
            type="select"
            value={editForm.hora_estimada_arribo}
            onChange={value => setEditForm(f => ({ ...f, hora_estimada_arribo: value }))}
            options={[
              { label: '08:00', value: '08:00:00' },
              { label: '09:00', value: '09:00:00' },
              { label: '10:00', value: '10:00:00' },
              { label: '11:00', value: '11:00:00' },
              { label: '12:00', value: '12:00:00' },
              { label: '13:00', value: '13:00:00' },
              { label: '14:00', value: '14:00:00' },
              { label: '15:00', value: '15:00:00' },
              { label: '16:00', value: '16:00:00' },
              { label: '17:00', value: '17:00:00' },
              { label: '18:00', value: '18:00:00' },
            ]}
          />
          <div className="flex gap-3 mt-6">
            <button
              type="submit"
              className="flex-1 bg-brand-red text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-brand-red-dark transition-all duration-150 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={editLoading}
            >
              {editLoading ? 'Guardando...' : 'Guardar'}
            </button>
            <button
              type="button"
              className="flex-1 bg-neutral-200 text-neutral-700 px-6 py-2.5 rounded-lg font-semibold hover:bg-neutral-300 transition-all duration-150"
              onClick={() => setRutaEditando(null)}
            >
              Cancelar
            </button>
          </div>
        </form>
      </Modal>

      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 px-6 py-4 rounded-lg shadow-2xl flex items-center gap-3 z-50 ${toast.type === 'success'
            ? 'bg-green-500 text-white'
            : 'bg-red-500 text-white'
            }`}
          style={{
            animation: 'slideInRight 0.3s ease-out',
          }}
        >
          <div className="flex items-center gap-3">
            {toast.type === 'success' ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
            <span className="font-semibold">{toast.message}</span>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  )
}
