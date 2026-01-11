import React, { useEffect, useState } from 'react'
import { Mail, Phone, ShoppingBag, Clock } from 'lucide-react'

import { LoadingSpinner } from 'components/ui/LoadingSpinner'
import { Alert } from 'components/ui/Alert'
import { InfoCard } from 'components/ui/InfoCard'
import { PageHero } from 'components/ui/PageHero'
import Steps from 'components/ui/Steps'
import { StatusBadge } from 'components/ui/StatusBadge'
import { useProfile } from '../../../../hooks/useProfile'

export default function PerfilCliente() {
  const { profile, loading, error, refresh, updateProfile, client, clientLoading, clientError, vendedorMap, updateClient } = useProfile()
  const [activeStep, setActiveStep] = useState<number>(0)

  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ nombre: '', telefono: '', avatarUrl: '' })
  const [success, setSuccess] = useState<string | null>(null)
  const [clientEditing, setClientEditing] = useState(false)
  const [clientForm, setClientForm] = useState({ identificacion: '', tipo_identificacion: '', razon_social: '', nombre_comercial: '' })

  useEffect(() => {
    refresh()
  }, [refresh])

  // Reset edit modes when switching between steps
  // Reset edit modes only for the step that is not active.
  // This prevents activating a step for editing and having the effect immediately clear the edit flag.
  useEffect(() => {
    if (activeStep !== 0) setEditing(false)
    if (activeStep !== 1) setClientEditing(false)
  }, [activeStep])

  useEffect(() => {
    setForm({ nombre: profile?.nombre ?? '', telefono: profile?.telefono ?? '', avatarUrl: profile?.avatarUrl ?? '' })
    if (client) {
      setClientForm({
        identificacion: client.identificacion ?? '',
        tipo_identificacion: client.tipo_identificacion ?? '',
        razon_social: client.razon_social ?? '',
        nombre_comercial: client.nombre_comercial ?? '',
      })
    }
  }, [profile, client])

  function formatGps(gps: any) {
    try {
      if (!gps) return '—'
      if (gps.type && Array.isArray(gps.coordinates)) {
        const [lng, lat] = gps.coordinates
        return `${lat?.toFixed?.(6) ?? lat}, ${lng?.toFixed?.(6) ?? lng}`
      }
      if (Array.isArray(gps.coordinates)) {
        const [a, b] = gps.coordinates
        return `${a}, ${b}`
      }
      if (typeof gps === 'object') return JSON.stringify(gps)
      return String(gps)
    } catch {
      return '—'
    }
  }

  if (loading && !profile) return <LoadingSpinner text="Cargando perfil..." />

  const name = profile?.nombre || 'Cliente Cafrilosa'
  const email = profile?.email || 'Sin correo'
  const phone = profile?.telefono || 'Sin teléfono'
  const role = profile?.rol?.nombre || 'Sin rol'
  const created = profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString('es-PE') : '---'

  async function handleSave() {
    try {
      setSuccess(null)
      await updateProfile({ nombre: form.nombre, telefono: form.telefono || null, avatarUrl: form.avatarUrl || null })
      setSuccess('Perfil actualizado')
      setEditing(false)
    } catch (e) {
      // error handled by hook's error state; no-op here
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHero
        title="Mi Perfil"
        subtitle="Administra tu información personal y de contacto"
        chips={['Datos personales', 'Preferencias', 'Historial']}
      />

      <Steps
        steps={[
          { id: 'usuario', title: 'Usuario', caption: 'Datos de usuario' },
          { id: 'cliente', title: 'Cliente', caption: 'Datos del cliente' },
        ]}
        active={activeStep}
        onSelect={(i) => setActiveStep(i)}
      />

      {error && <Alert type="error" title="Error" message={error} />}
      {success && <Alert type="success" title="Listo" message={success} />}

      <div className="flex items-center justify-between gap-3 rounded-2xl bg-neutral-50 px-4 py-3">
        <div className="flex items-center gap-4">
          <div className="grid h-12 w-12 place-items-center rounded-full bg-brand-red text-white text-lg font-bold">
            {name.slice(0, 1).toUpperCase()}
          </div>
          <div className="flex flex-col">
            <p className="text-xs uppercase tracking-[0.18em] text-neutral-500">Cliente</p>
            <div className="flex items-center gap-3">
              {!editing ? (
                <p className="text-lg font-bold text-neutral-900">{name}</p>
              ) : (
                <input
                  className="rounded-md border px-3 py-1 text-lg font-semibold"
                  value={form.nombre}
                  onChange={(e) => setForm((s) => ({ ...s, nombre: e.target.value }))}
                />
              )}

              <div className="flex flex-wrap gap-2 text-xs font-semibold text-neutral-700">
                <StatusBadge variant={profile?.activo ? 'success' : 'warning'}>
                  {profile?.activo ? 'Activo' : 'Inactivo'}
                </StatusBadge>
                <StatusBadge variant={profile?.emailVerificado ? 'success' : 'warning'}>
                  {profile?.emailVerificado ? 'Email verificado' : 'Email no verificado'}
                </StatusBadge>
              </div>
            </div>
          </div>
        </div>
        <div>
          {activeStep === 0 && (
            <>
              {!editing ? (
                <button
                  className="inline-flex items-center gap-2 rounded-md bg-brand-red px-3 py-1 text-white text-sm font-semibold"
                  onClick={() => { setActiveStep(0); setEditing(true) }}
                >
                  Editar
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    className="inline-flex items-center gap-2 rounded-md bg-brand-red px-3 py-1 text-white text-sm font-semibold"
                    onClick={handleSave}
                    disabled={loading || !profile}
                    title={loading || !profile ? 'Espere a que el perfil cargue antes de guardar' : 'Guardar cambios'}
                  >
                    Guardar
                  </button>
                  <button
                    className="inline-flex items-center gap-2 rounded-md border px-3 py-1 text-sm font-semibold"
                    onClick={() => { setEditing(false); setForm({ nombre: profile?.nombre ?? '', telefono: profile?.telefono ?? '', avatarUrl: profile?.avatarUrl ?? '' }); setSuccess(null) }}
                    disabled={loading}
                  >
                    Cancelar
                  </button>
                </div>
              )}
            </>
          )}

          {activeStep === 1 && (
            <>
              {!clientEditing ? (
                <button
                  className="inline-flex items-center gap-2 rounded-md bg-brand-red px-3 py-1 text-white text-sm font-semibold"
                  onClick={() => { setActiveStep(1); setClientEditing(true) }}
                >
                  Editar cliente
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    className="inline-flex items-center gap-2 rounded-md bg-brand-red px-3 py-1 text-white text-sm font-semibold"
                    onClick={async () => {
                      try {
                        setSuccess(null)
                        await updateClient({
                          identificacion: clientForm.identificacion || null,
                          tipo_identificacion: clientForm.tipo_identificacion || null,
                          razon_social: clientForm.razon_social || null,
                          nombre_comercial: clientForm.nombre_comercial || null,
                        } as any)
                        setSuccess('Datos del cliente actualizados')
                        setClientEditing(false)
                      } catch (e) {
                        // error shown by hook's clientError
                      }
                    }}
                    disabled={clientLoading}
                  >
                    Guardar cliente
                  </button>
                  <button
                    className="inline-flex items-center gap-2 rounded-md border px-3 py-1 text-sm font-semibold"
                    onClick={() => { setClientEditing(false); if (client) setClientForm({ identificacion: client.identificacion ?? '', tipo_identificacion: client.tipo_identificacion ?? '', razon_social: client.razon_social ?? '', nombre_comercial: client.nombre_comercial ?? '' }) ; setSuccess(null) }}
                    disabled={clientLoading}
                  >
                    Cancelar
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {activeStep === 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          <InfoCard label="Correo" value={email} />
          {!editing ? (
            <InfoCard label="Teléfono" value={phone} />
          ) : (
            <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
              <label className="text-xs uppercase tracking-[0.14em] text-neutral-500">Teléfono</label>
              <input
                className="mt-2 w-full rounded-md border px-3 py-2"
                value={form.telefono ?? ''}
                onChange={(e) => setForm((s) => ({ ...s, telefono: e.target.value }))}
              />
            </div>
          )}

          <InfoCard label="Rol" value={role} />
          <InfoCard label="Estado" value={profile?.activo ? 'Activo' : 'Inactivo'} />

          {!editing ? (
            <InfoCard label="Nombre" value={name} />
          ) : (
            <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
              <label className="text-xs uppercase tracking-[0.14em] text-neutral-500">Nombre</label>
              <input
                className="mt-2 w-full rounded-md border px-3 py-2"
                value={form.nombre}
                onChange={(e) => setForm((s) => ({ ...s, nombre: e.target.value }))}
              />
            </div>
          )}

          <InfoCard label="Email verificado" value={profile?.emailVerificado ? 'Sí' : 'No'} />
        </div>
      )}

      {/* Datos del cliente (si existen) */}
      {activeStep === 1 && (
        <div className="mt-6">
        <h3 className="mb-3 text-sm font-semibold uppercase text-neutral-500">Datos del cliente</h3>
        {clientLoading && <LoadingSpinner text="Cargando datos del cliente..." />}
        {clientError && <Alert type="info" title="Cliente" message={clientError} />}
        {client && (
          <div className="grid gap-4 md:grid-cols-2">
            {/* ID and Usuario principal are hidden by request */}
            {!clientEditing ? (
              <>
                <InfoCard label="Identificación" value={client.identificacion ?? '—'} />
                <InfoCard label="Tipo identificación" value={client.tipo_identificacion ?? '—'} />
                <InfoCard label="Razón social" value={client.razon_social ?? '—'} />
                <InfoCard label="Nombre comercial" value={client.nombre_comercial ?? '—'} />
              </>
            ) : (
              <>
                <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
                  <label className="text-xs uppercase tracking-[0.14em] text-neutral-500">Identificación</label>
                  <input
                    className="mt-2 w-full rounded-md border px-3 py-2 text-sm"
                    value={clientForm.identificacion}
                    onChange={(e) => setClientForm((s) => ({ ...s, identificacion: e.target.value }))}
                  />
                </div>

                <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
                  <label className="text-xs uppercase tracking-[0.14em] text-neutral-500">Tipo identificación</label>
                  <input
                    className="mt-2 w-full rounded-md border px-3 py-2 text-sm"
                    value={clientForm.tipo_identificacion}
                    onChange={(e) => setClientForm((s) => ({ ...s, tipo_identificacion: e.target.value }))}
                  />
                </div>

                <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
                  <label className="text-xs uppercase tracking-[0.14em] text-neutral-500">Razón social</label>
                  <input
                    className="mt-2 w-full rounded-md border px-3 py-2 text-sm"
                    value={clientForm.razon_social}
                    onChange={(e) => setClientForm((s) => ({ ...s, razon_social: e.target.value }))}
                  />
                </div>

                <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
                  <label className="text-xs uppercase tracking-[0.14em] text-neutral-500">Nombre comercial</label>
                  <input
                    className="mt-2 w-full rounded-md border px-3 py-2 text-sm"
                    value={clientForm.nombre_comercial ?? ''}
                    onChange={(e) => setClientForm((s) => ({ ...s, nombre_comercial: e.target.value }))}
                  />
                </div>
              </>
            )}
            <InfoCard label="Lista de precios" value={client.lista_precios_id ? String(client.lista_precios_id) : '—'} />
            <InfoCard
              label="Vendedor asignado"
              value={client.vendedor_asignado_id
                ? (client.nombre_vendedor_cache
                    ?? vendedorMap[client.vendedor_asignado_id]?.nombre
                    ?? 'Vendedor no disponible')
                : '—'}
            />
            <InfoCard label="Zona comercial" value={client.zona_comercial_id ?? '—'} />
            <InfoCard label="Tiene crédito" value={client.tiene_credito ? 'Sí' : 'No'} />
            <InfoCard label="Límite crédito" value={client.limite_credito ?? '0.00'} />
            <InfoCard label="Saldo actual" value={client.saldo_actual ?? '0.00'} />
            <InfoCard label="Días plazo" value={client.dias_plazo != null ? String(client.dias_plazo) : '0'} />
            <InfoCard label="Bloqueado" value={client.bloqueado ? 'Sí' : 'No'} />
            <InfoCard label="Dirección" value={client.direccion_texto ?? '—'} />
            <InfoCard label="Ubicación GPS" value={client.ubicacion_gps ? formatGps(client.ubicacion_gps) : '—'} />
            {/* <InfoCard label="Alta" value={client.created_at ? new Date(client.created_at).toLocaleDateString('es-PE') : '—'} /> */}
            {/* <InfoCard label="Última actualización" value={client.updated_at ? new Date(client.updated_at).toLocaleDateString('es-PE') : '—'} /> */}
            <InfoCard label="Eliminado" value={client.deleted_at ? new Date(client.deleted_at).toLocaleDateString('es-PE') : 'No'} />
          </div>
        )}
        </div>
      )}

      <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-2 text-sm text-neutral-800">
          <ShoppingBag className="h-4 w-4 text-brand-red" />
          Mantén tu información de contacto actualizada para seguir tu historial de compras.
        </div>
        <p className="mt-2 flex items-center gap-2 text-sm text-neutral-700">
          <Clock className="h-4 w-4 text-brand-red" />
          Alta: {created}
        </p>
      </div>
    </div>
  )
}


