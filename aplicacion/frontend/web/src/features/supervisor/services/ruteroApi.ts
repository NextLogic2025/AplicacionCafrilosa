// Servicio para crear rutas en el rutero
export interface CrearRutaPayload {
  cliente_id: string;
  sucursal_id: string | null;
  zona_id: number;
  dia_semana: number;
  frecuencia: string;
  prioridad_visita: string;
  orden_sugerido: number;
  hora_estimada_arribo: string | null;
}

export async function crearRuta(payload: CrearRutaPayload): Promise<any> {
  const baseUrl = import.meta.env.VITE_CATALOGO_BASE_URL;
  const url = `${baseUrl}/api/rutero`;
  // Obtener token de localStorage/sessionStorage
  const token = localStorage.getItem('cafrilosa.token') || sessionStorage.getItem('cafrilosa.token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Error al guardar ruta');
  return await res.json();
}

// NUEVA FUNCIÓN PARA EDITAR RUTA FILTRADA
export async function editarRutaFiltrada(
  id: string,
  data: {
    zona_id: number;
    dia_semana: number;
    frecuencia: string;
    prioridad_visita: string;
    orden_sugerido: number;
    hora_estimada_arribo: string;
    activo: boolean;
  }
): Promise<any> {
  const baseUrl = import.meta.env.VITE_CATALOGO_BASE_URL || 'http://localhost:3003';
  const url = `${baseUrl}/api/rutero/${id}`;
  const token = localStorage.getItem('cafrilosa.token') || sessionStorage.getItem('cafrilosa.token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(url, {
    method: 'PUT',
    headers,
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Error al editar ruta');
  return await res.json();
}

import { httpCatalogo } from '../../../services/api/http'
import type { ClienteRutero, RuteroPlanificado, DiaSemana } from './types'

export async function obtenerClientesPorZona(_zonaId: number): Promise<ClienteRutero[]> {
  return httpCatalogo<ClienteRutero[]>(`/clientes`)
}

export async function obtenerRuteroPorZonaYDia(zonaId: number, diaSemana: number): Promise<RuteroPlanificado[]> {
  // Consumir directamente desde el endpoint de la API
  const rutas = await httpCatalogo<any[]>(`/rutero?zona_id=${zonaId}&dia_semana=${diaSemana}`).catch(() => [])

  // Normalizamos a nuestra interfaz local
  return rutas.map((r: any) => ({
    id: r.id,
    cliente_id: r.cliente_id,
    zona_id: r.zona_id,
    dia_semana: r.dia_semana, // Usar el valor real del backend
    frecuencia: r.frecuencia ?? 'SEMANAL',
    prioridad_visita: r.prioridad_visita ?? 'MEDIA',
    orden_sugerido: r.orden_sugerido ?? 999,
    hora_estimada: r.hora_estimada_arribo ?? r.hora_estimada ?? null,
    activo: r.activo ?? true,
    sucursal_nombre: r.sucursal_nombre ?? null,
    ubicacion_gps: r.ubicacion_gps ?? null,
  })) as RuteroPlanificado[]
}

export async function guardarRutero(datos: RuteroPlanificado[], eliminados?: string[]): Promise<void> {
  // La colección muestra POST /rutero para un solo item.
  // Enviamos cada registro individualmente, adaptando nombres.
  const diaToNumber = (d: DiaSemana): number => {
    const map: Record<DiaSemana, number> = {
      LUNES: 1,
      MARTES: 2,
      MIERCOLES: 3,
      JUEVES: 4,
      VIERNES: 5,
    }
    return map[d] ?? 1
  }

  for (const item of datos) {
    const payload: any = {
      zona_id: item.zona_id,
      dia_semana: diaToNumber(item.dia_semana),
      frecuencia: item.frecuencia || 'SEMANAL',
      prioridad_visita: item.prioridad_visita || 'MEDIA',
      orden_sugerido: item.orden_sugerido,
      hora_estimada_arribo: formatearHora(item.hora_estimada),
      activo: item.activo ?? true,
    };

    // Agregar sucursal_id solo si tipo_direccion es SUCURSAL
    if (item.tipo_direccion === 'SUCURSAL' && item.sucursal_id) {
      payload.sucursal_id = item.sucursal_id
    }

    if (item.id) {
      await httpCatalogo<void>(`/rutero/${item.id}`, {
        method: 'PUT',
        body: payload,
      }).catch((error) => {
        console.error('Error actualizando ruta:', error);
        throw error;
      });
    } else {
      await httpCatalogo<void>('/rutero', {
        method: 'POST',
        body: payload,
      });
    }
  }

  if (Array.isArray(eliminados) && eliminados.length > 0) {
    await Promise.all(
      eliminados.map((id) =>
        httpCatalogo<void>(`/rutero/${id}`, {
          method: 'DELETE',
        }).catch(() => undefined),
      ),
    )
  }
}

export async function actualizarOrdenRutero(
  zonaId: number,
  diaSemana: DiaSemana,
  clienteId: string,
  nuevoOrden: number,
  horaEstimada?: string
): Promise<void> {
  // No existe endpoint específico en colección; noop para compatibilidad futura.
  void zonaId
  void diaSemana
  void clienteId
  void nuevoOrden
  void horaEstimada
}

export async function obtenerTodasLasRutas(): Promise<RuteroPlanificado[]> {
  const all = await httpCatalogo<any[]>(`/rutero`).catch(() => [])

  return (all || []).map((r: any) => ({
    id: r.id,
    cliente_id: r.cliente_id,
    zona_id: r.zona_id,
    dia_semana: numberToDia(r.dia_semana),
    frecuencia: r.frecuencia ?? 'SEMANAL',
    prioridad_visita: r.prioridad_visita ?? 'MEDIA',
    orden_sugerido: r.orden_sugerido ?? 999,
    hora_estimada: r.hora_estimada_arribo ?? r.hora_estimada ?? null,
    activo: r.activo ?? true,
  })) as RuteroPlanificado[]
}

export async function obtenerRuteroMio(): Promise<RuteroPlanificado[]> {
  return obtenerTodasLasRutas()
}

function numberToDia(num: number): DiaSemana {
  const map: Record<number, DiaSemana> = {
    1: 'LUNES',
    2: 'MARTES',
    3: 'MIERCOLES',
    4: 'JUEVES',
    5: 'VIERNES',
  }
  return map[num] ?? 'LUNES'
}

export async function eliminarRutaPorZonaYDia(zonaId: number, diaSemana: DiaSemana): Promise<void> {
  // Como no hay endpoint específico, obtenemos las rutas y eliminamos una por una
  const diaToNumber = (d: DiaSemana): number => {
    const map: Record<DiaSemana, number> = {
      LUNES: 1,
      MARTES: 2,
      MIERCOLES: 3,
      JUEVES: 4,
      VIERNES: 5,
    }
    return map[d] ?? 1
  }
  const rutas = await obtenerRuteroPorZonaYDia(zonaId, diaToNumber(diaSemana))

  for (const ruta of rutas) {
    // Asumiendo que existe DELETE /rutero/:id, ajustar según API real
    if (!ruta.id) continue
    await httpCatalogo(`/rutero/${ruta.id}`, {
      method: 'DELETE',
    }).catch(() => { })
  }
}

function formatearHora(valor: string | null | undefined): string | null {
  if (!valor) return null
  const limpio = valor.trim()
  if (limpio.length === 0) return null
  if (!/^[0-2]?\d:[0-5]\d(:[0-5]\d)?$/.test(limpio)) return null
  const [hh, mm, ss] = limpio.split(':')
  const hora = hh.padStart(2, '0')
  const minuto = mm.padStart(2, '0')
  const segundo = (ss ?? '00').padStart(2, '0')
  return `${hora}:${minuto}:${segundo}`
}
