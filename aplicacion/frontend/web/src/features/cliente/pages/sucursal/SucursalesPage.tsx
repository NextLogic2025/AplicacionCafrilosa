import React, { useEffect, useState } from 'react'
import { fetchClienteByUsuarioId, getPerfilCliente } from '../../services/clientApi'
import { Edit3, Trash2 } from 'lucide-react'
import { fetchSucursalesByCliente, createSucursal } from './sucursalesApi'
import { actualizarCliente } from '../../../supervisor/services/clientesApi'
import AddressFormModal from './AddressFormModal'
import { getAllZonas, type ZonaComercial } from '../../../supervisor/services/zonasApi'
import { SucursalFormModal } from '../../../supervisor/pages/Clientes/SucursalFormModal'
import { PageHero } from 'components/ui/PageHero'

export default function SucursalesPage() {
  const [clienteId, setClienteId] = useState<string | null>(null)
  const [sucursales, setSucursales] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [zonas, setZonas] = useState<ZonaComercial[]>([])
  const [clienteFull, setClienteFull] = useState<any | null>(null)
  const [editingSucursal, setEditingSucursal] = useState<any | null>(null)
  const [editingAddress, setEditingAddress] = useState(false)

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const perfil = await getPerfilCliente().catch(() => null);
        const id = perfil ? String(perfil.id) : null;
        setClienteId(id);
        if (!id) {
          setError('No se encontró el ID del cliente. ¿Estás autenticado?');
          setLoading(false);
          return;
        }
        const [sucs, zonasResp, clienteResp] = await Promise.all([
          fetchSucursalesByCliente(id),
          getAllZonas().catch(() => []),
          fetchClienteByUsuarioId(id).catch(() => null),
        ]);
        setSucursales(Array.isArray(sucs) ? sucs : []);
        setZonas(zonasResp || []);
        setClienteFull(clienteResp || null);
        if (!Array.isArray(sucs)) {
          setError('Error: la respuesta de sucursales no es un array.');
        } else if (Array.isArray(sucs) && sucs.length === 0) {
          setError('No hay sucursales registradas para este cliente.');
        }
      } catch (e: any) {
        setError('Error cargando sucursales: ' + (e?.message || e?.toString() || 'desconocido'));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleCreateSucursal = async (values: any) => {
    if (!clienteId) return;
    setLoading(true);
    try {
      const payload: any = {
        nombre_sucursal: values.nombre_sucursal,
        direccion_entrega: values.direccion_entrega,
        contacto_nombre: values.contacto_nombre,
        contacto_telefono: values.contacto_telefono,
        zona_id: values.zona_id !== undefined && values.zona_id !== null ? Number(values.zona_id) : undefined,
        ubicacion_gps: values.posicion ? { type: 'Point', coordinates: [values.posicion.lng, values.posicion.lat] } : undefined,
      };
      const created = await createSucursal(clienteId, payload).catch(() => null);
      if (created) {
        setSucursales((s) => [created, ...s]);
        setShowForm(false);
      } else {
        alert('Error creando sucursal');
      }
    } finally {
      setLoading(false);
    }
  };

  // Edición de sucursal pendiente de implementación según API cliente
  const handleEditSucursal = async (values: any, sucursalId: string) => {
    alert('Funcionalidad de edición de sucursal aún no implementada para clientes.');
  };

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

  // Eliminación de sucursal pendiente de implementación según API cliente
  const handleDeleteSucursal = async (sucursalId: string) => {
    alert('Funcionalidad de eliminación de sucursal aún no implementada para clientes.');
  };

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
      ) : error ? (
        <div className="py-12 text-center text-red-500">{error}</div>
      ) : sucursales.length === 0 ? (
        <div className="py-12 text-center text-gray-500">No hay sucursales registradas.</div>
      ) : Array.isArray(sucursales) ? (
        <div className="grid gap-4 px-6">
          {sucursales.map((s) => (
            <article key={s.id || s._id} className="flex items-center justify-between gap-4 p-4 border border-neutral-200 rounded-2xl shadow-sm hover:shadow-md transition-shadow bg-white">
              <div className="flex-1">
                <div className="flex items-start gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0 h-12 w-12 rounded-xl grid place-items-center bg-brand-red/10 text-brand-red font-semibold">{String((s.nombre_sucursal ?? s.nombre ?? '').charAt(0)).toUpperCase()}</div>
                    <div className="flex-1">
                      <div className="text-lg font-semibold text-neutral-900">{s.nombre_sucursal ?? s.nombre}</div>
                      <div className="text-sm text-neutral-600 mt-1">{s.direccion_entrega ?? s.direccion ?? ''}</div>
                      <div className="mt-2 flex items-center gap-4 text-sm text-neutral-500">
                        {(s.contacto_nombre || s.contacto_telefono) ? (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-neutral-400">Contacto</span>
                            <span className="text-sm text-neutral-700">{s.contacto_nombre ?? ''}</span>
                            {s.contacto_telefono ? (<a className="ml-2 text-brand-red text-sm font-medium" href={`tel:${s.contacto_telefono}`}>{s.contacto_telefono}</a>) : null}
                          </div>
                        ) : null}
                        {s.zona_nombre && (
                          <span className="inline-block rounded-full px-3 py-1 text-xs bg-neutral-100 text-neutral-700">{s.zona_nombre}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex-shrink-0 flex flex-col items-end gap-2">
                <div className="flex gap-2">
                  {/* Botones de editar/eliminar pueden ser implementados si el endpoint lo permite */}
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="py-12 text-center text-red-500">Error cargando sucursales.</div>
      )}
    </div>
  )
}
