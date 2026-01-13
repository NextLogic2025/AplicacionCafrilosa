import React, { useEffect, useState } from 'react'
import { fetchClienteByUsuarioId, getPerfilCliente } from '../services/clientApi'
import { Edit3, Trash2 } from 'lucide-react'
import { obtenerSucursales as obtenerSucursalesCliente, crearSucursal as crearSucursalSupervisor, actualizarSucursal as actualizarSucursalSupervisor, eliminarSucursal as eliminarSucursalSupervisor, type Sucursal as SucursalSupervisor } from '../../supervisor/services/sucursalesApi'
import { actualizarCliente } from '../../supervisor/services/clientesApi'
import AddressFormModal from './AddressFormModal'
import { getAllZonas, type ZonaComercial } from '../../supervisor/services/zonasApi'
import { SucursalFormModal } from '../../supervisor/pages/Clientes/SucursalFormModal'
import { PageHero } from 'components/ui/PageHero'

export default function SucursalesPage() {
  const [clienteId, setClienteId] = useState<string | null>(null)
  const [sucursales, setSucursales] = useState<SucursalSupervisor[]>([])
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [zonas, setZonas] = useState<ZonaComercial[]>([])
  const [clienteFull, setClienteFull] = useState<any | null>(null)
  const [editingSucursal, setEditingSucursal] = useState<SucursalSupervisor | null>(null)
  const [editingAddress, setEditingAddress] = useState(false)

  useEffect(() => {
    ;(async () => {
      const perfil = await getPerfilCliente().catch(() => null)
      setClienteId(perfil ? String(perfil.id) : null)
    })()
  }, [])

  useEffect(() => {
    if (!clienteId) return
    setLoading(true)
    Promise.all([
      obtenerSucursalesCliente(clienteId).catch(() => []),
      getAllZonas().catch(() => []),
      fetchClienteByUsuarioId(clienteId).catch(() => null),
    ])
      .then(([sucs, zonasResp, clienteResp]) => {
        setSucursales(sucs || [])
        setZonas(zonasResp || [])
        setClienteFull(clienteResp || null)
      })
      .finally(() => setLoading(false))
  }, [clienteId])

  const handleCreateSucursal = async (values: any) => {
    if (!clienteId) return
    setLoading(true)
    try {
      const payload: any = { nombre_sucursal: values.nombre_sucursal, cliente_id: clienteId }
      if (values.direccion_entrega) payload.direccion_entrega = values.direccion_entrega
      if (values.contacto_nombre) payload.contacto_nombre = values.contacto_nombre
      if (values.contacto_telefono) payload.contacto_telefono = values.contacto_telefono
      if (values.zona_id !== undefined && values.zona_id !== null) payload.zona_id = Number(values.zona_id)
      if (values.posicion) payload.ubicacion_gps = { type: 'Point', coordinates: [values.posicion.lng, values.posicion.lat] }

      const created = await crearSucursalSupervisor(clienteId, payload as any).catch(() => null)
      if (created) {
        setSucursales((s) => [created, ...s])
        setShowForm(false)
      } else {
        alert('Error creando sucursal')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleEditSucursal = async (values: any, sucursalId: string) => {
    if (!clienteId) return
    setLoading(true)
    try {
      const payload: any = {}
      if (values.nombre_sucursal !== undefined) payload.nombre_sucursal = values.nombre_sucursal
      if (values.direccion_entrega) payload.direccion_entrega = values.direccion_entrega
      if (values.contacto_nombre) payload.contacto_nombre = values.contacto_nombre
      if (values.contacto_telefono) payload.contacto_telefono = values.contacto_telefono
      if (values.zona_id !== undefined && values.zona_id !== null) payload.zona_id = Number(values.zona_id)
      if (values.posicion) payload.ubicacion_gps = { type: 'Point', coordinates: [values.posicion.lng, values.posicion.lat] }

      const updated = await actualizarSucursalSupervisor(clienteId, sucursalId, payload as any).catch(() => null)
      if (updated) {
        setSucursales((s) => s.map((it) => (it.id === updated.id ? updated : it)))
        setEditingSucursal(null)
      } else {
        alert('Error actualizando sucursal')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleEditAddress = async (values: any) => {
    if (!clienteId) return
    setLoading(true)
    try {
      const payload: any = {
        direccion_texto: values.direccion_texto || null,
        zona_comercial_id: values.zona_comercial_id ?? null,
      }
      if (values.posicion) payload.ubicacion_gps = { type: 'Point', coordinates: [values.posicion.lng, values.posicion.lat] }

      const updated = await actualizarCliente(clienteId, payload as any).catch(() => null)
      if (updated) {
        setClienteFull(updated)
        setEditingAddress(false)
      } else {
        alert('Error actualizando dirección')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteSucursal = async (sucursalId: string) => {
    if (!clienteId) return
    const ok = window.confirm('¿Eliminar esta sucursal? Esta acción no se puede deshacer.')
    if (!ok) return
    setLoading(true)
    try {
      const res = await eliminarSucursalSupervisor(clienteId, sucursalId).catch(() => null)
      if (res && (res as any).deleted) {
        setSucursales((s) => s.filter((it) => it.id !== sucursalId))
      } else {
        alert('Error eliminando sucursal')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHero title="Sucursales" subtitle="Gestiona las direcciones y sucursales asociadas a tu cuenta" chips={["Direcciones", "Sucursales"]} />

      <div className="px-6">
        <div className="mt-6 mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-semibold">Mis sucursales</h2>
          <div className="flex items-center gap-3">
            <button className="rounded-md px-4 py-2 bg-white border border-gray-200 text-sm hover:bg-gray-50" onClick={() => setShowForm((s) => !s)}>
              {showForm ? 'Cancelar' : 'Crear sucursal'}
            </button>
            <button className="rounded-md px-4 py-2 bg-brand-red text-white text-sm hover:bg-brand-red/90" onClick={() => setEditingAddress(true)}>
              Editar dirección matriz
            </button>
          </div>
        </div>
      </div>

      {showForm && (
        <div className="mb-6">
          <SucursalFormModal
            isOpen={showForm}
            onClose={() => setShowForm(false)}
            onSubmit={handleCreateSucursal}
            zonas={zonas.map(z => ({ id: z.id, nombre: z.nombre, poligono_geografico: (z as any).poligono_geografico }))}
            zonaId={clienteFull?.zona_comercial_id ?? clienteFull?.zona_comercial?.id ?? null}
            ubicacionMatriz={clienteFull?.ubicacion_gps?.coordinates ? { lat: clienteFull.ubicacion_gps.coordinates[1], lng: clienteFull.ubicacion_gps.coordinates[0] } : null}
          />
        </div>
      )}

      {editingSucursal && (
        <SucursalFormModal
          isOpen={Boolean(editingSucursal)}
          onClose={() => setEditingSucursal(null)}
          onSubmit={async (vals) => await handleEditSucursal(vals, String(editingSucursal.id))}
          initialData={editingSucursal}
          zonas={zonas.map(z => ({ id: z.id, nombre: z.nombre, poligono_geografico: (z as any).poligono_geografico }))}
          zonaId={clienteFull?.zona_comercial_id ?? clienteFull?.zona_comercial?.id ?? null}
          ubicacionMatriz={clienteFull?.ubicacion_gps?.coordinates ? { lat: clienteFull.ubicacion_gps.coordinates[1], lng: clienteFull.ubicacion_gps.coordinates[0] } : null}
        />
      )}

      {editingAddress && (
        <AddressFormModal
          isOpen={editingAddress}
          onClose={() => setEditingAddress(false)}
          onSubmit={handleEditAddress}
          initialData={clienteFull}
          zonas={zonas}
        />
      )}

      {loading ? (
        <div className="py-12 text-center text-gray-600">Cargando sucursales...</div>
      ) : sucursales.length === 0 ? (
        <div className="py-12 text-center text-gray-500">No hay sucursales registradas.</div>
      ) : (
        <div className="grid gap-4 px-6">
          {sucursales.map((s) => (
            <article key={s.id} className="flex items-center justify-between gap-4 p-4 border border-neutral-200 rounded-2xl shadow-sm hover:shadow-md transition-shadow bg-white">
              <div className="flex-1">
                <div className="flex items-start gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0 h-12 w-12 rounded-xl grid place-items-center bg-brand-red/10 text-brand-red font-semibold">{String((((s as any).nombre_sucursal ?? (s as any).nombre) || '').charAt(0)).toUpperCase()}</div>
                    <div className="flex-1">
                      <div className="text-lg font-semibold text-neutral-900">{(s as any).nombre_sucursal ?? (s as any).nombre}</div>
                    <div className="text-sm text-neutral-600 mt-1">{(s as any).direccion_entrega ?? (s as any).direccion ?? ''}</div>
                      <div className="mt-2 flex items-center gap-4 text-sm text-neutral-500">
                        {((s as any).contacto_nombre || (s as any).contacto_telefono) ? (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-neutral-400">Contacto</span>
                            <span className="text-sm text-neutral-700">{(s as any).contacto_nombre ?? ''}</span>
                            { (s as any).contacto_telefono ? (<a className="ml-2 text-brand-red text-sm font-medium" href={`tel:${(s as any).contacto_telefono}`}>{(s as any).contacto_telefono}</a>) : null }
                          </div>
                        ) : null}
                        { (s as any).zona_nombre && (
                          <span className="inline-block rounded-full px-3 py-1 text-xs bg-neutral-100 text-neutral-700">{(s as any).zona_nombre}</span>
                        ) }
                      </div>
                  </div>
                  </div>
                </div>
              </div>

              <div className="flex-shrink-0 flex flex-col items-end gap-2">
                <div className="flex gap-2">
                  <button aria-label="Eliminar sucursal" title="Eliminar sucursal" className="flex items-center justify-center h-10 w-10 rounded-lg border border-neutral-200 bg-white hover:bg-red-50" onClick={() => handleDeleteSucursal(String(s.id))}>
                    <Trash2 className="h-4 w-4 text-brand-red" />
                  </button>
                  <button aria-label="Editar sucursal" title="Editar sucursal" className="flex items-center justify-center h-10 w-10 rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50" onClick={() => setEditingSucursal(s as any)}>
                    <Edit3 className="h-4 w-4 text-neutral-700" />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
