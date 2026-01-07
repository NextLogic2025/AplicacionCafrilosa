import { httpCatalogo } from '../../../services/api/http'
import type { ClienteRutero, RuteroPlanificado, DiaSemana } from './types'

export async function obtenerClientesPorZona(_zonaId: number): Promise<ClienteRutero[]> {
  // No existe endpoint por zona en la colección; traemos todos los clientes
  // y el caller decide cómo filtrar/mostrar.
  return httpCatalogo<ClienteRutero[]>(`/clientes`)
}

export async function obtenerRuteroPorZonaYDia(zonaId: number, diaSemana: DiaSemana): Promise<RuteroPlanificado[]> {
  // La colección expone GET /rutero (lista completa) y no por zona/día.
  // Obtenemos todo y filtramos localmente.
  const all = await httpCatalogo<any[]>(`/rutero`).catch(() => [])

  const diaToNumber = (d: DiaSemana): number => {
    const map: Record<DiaSemana, number> = {
      LUNES: 2,
      MARTES: 3,
      MIERCOLES: 4,
      JUEVES: 5,
      VIERNES: 6,
    }
    return map[d] ?? 2
  }

  const diaNum = diaToNumber(diaSemana)
  const filtered = (all || []).filter((r) => r?.zona_id === zonaId && r?.dia_semana === diaNum)

  // Normalizamos a nuestra interfaz local
  return filtered.map((r: any) => ({
    cliente_id: r.cliente_id,
    zona_id: r.zona_id,
    dia_semana: diaSemana,
    frecuencia: r.frecuencia ?? 'SEMANAL',
    prioridad_visita: r.prioridad_visita ?? 'MEDIA',
    orden_sugerido: r.orden_sugerido ?? 999,
    hora_estimada: r.hora_estimada_arribo ?? r.hora_estimada ?? null,
    activo: r.activo ?? true,
  })) as RuteroPlanificado[]
}

export async function guardarRutero(datos: RuteroPlanificado[]): Promise<void> {
  // La colección muestra POST /rutero para un solo item.
  // Enviamos cada registro individualmente, adaptando nombres.
  const diaToNumber = (d: DiaSemana): number => {
    const map: Record<DiaSemana, number> = {
      LUNES: 2,
      MARTES: 3,
      MIERCOLES: 4,
      JUEVES: 5,
      VIERNES: 6,
    }
    return map[d] ?? 2
  }

  for (const item of datos) {
    const payload = {
      cliente_id: item.cliente_id,
      zona_id: item.zona_id,
      dia_semana: diaToNumber(item.dia_semana),
      frecuencia: item.frecuencia || 'SEMANAL',
      prioridad_visita: item.prioridad_visita || 'MEDIA',
      orden_sugerido: item.orden_sugerido,
      hora_estimada_arribo: item.hora_estimada || '09:00:00',
      activo: item.activo ?? true,
    }
    await httpCatalogo<void>('/rutero', {
      method: 'POST',
      body: payload,
    })
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
