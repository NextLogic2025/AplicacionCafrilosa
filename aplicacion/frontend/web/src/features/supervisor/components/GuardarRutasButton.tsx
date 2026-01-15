import React, { useState } from 'react';
import { Save } from 'lucide-react';
import { crearRuta, CrearRutaPayload } from '../services/ruteroApi';

interface GuardarRutasButtonProps {
  destinos: Array<{
    id: string;
    clienteId: string;
    nombre: string;
    sucursales: string[];
    hora: string;
    prioridad: string;
    frecuencia: string;
  }>;
  zonaId: number | string;
  diasSeleccionados: string[];
  onSuccess?: () => void;
}

const diasMap: Record<string, number> = {
  'Lunes': 1,
  'Martes': 2,
  'Miércoles': 3,
  'Jueves': 4,
  'Viernes': 5,
};

export const GuardarRutasButton: React.FC<GuardarRutasButtonProps> = ({ destinos, zonaId, diasSeleccionados, onSuccess }) => {
  const [guardando, setGuardando] = useState(false);
  const [mensajeGuardado, setMensajeGuardado] = useState<string | null>(null);

  const handleGuardarRutas = async () => {
    setGuardando(true);
    setMensajeGuardado(null);
    try {
      let orden = 1;
      for (const destino of destinos) {
        for (const dia of diasSeleccionados) {
          const payload: CrearRutaPayload = {
            cliente_id: destino.clienteId,
            sucursal_id: destino.id.startsWith('principal-') ? null : destino.id,
            zona_id: Number(zonaId),
            dia_semana: diasMap[dia],
            frecuencia: destino.frecuencia,
            prioridad_visita: destino.prioridad === 'ALTA' ? 'ALTA' : destino.prioridad === 'MEDIA' ? 'NORMAL' : 'BAJA',
            orden_sugerido: orden,
            hora_estimada_arribo: destino.hora || null,
          };
          await crearRuta(payload);
        }
        orden++;
      }
      setMensajeGuardado('Rutas guardadas correctamente.');
      if (onSuccess) onSuccess();
    } catch (err) {
      setMensajeGuardado('Error al guardar rutas.');
    }
    setGuardando(false);
  };

  return (
    <div>
      <button
        className={`flex items-center gap-2 rounded-lg bg-brand-red px-5 py-2 text-sm font-semibold text-white hover:bg-brand-red-dark ${guardando ? 'opacity-50 cursor-not-allowed' : ''}`}
        onClick={handleGuardarRutas}
        disabled={guardando}
      >
        <Save className="w-4 h-4" /> {guardando ? 'Guardando...' : 'Guardar'}
      </button>
      {mensajeGuardado && (
        <div className="text-sm mt-2 text-green-600">{mensajeGuardado}</div>
      )}
    </div>
  );
};
