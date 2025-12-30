import React, { useEffect } from 'react'
import { Mail, Phone, ShoppingBag, Clock } from 'lucide-react'

import { LoadingSpinner } from 'components/ui/LoadingSpinner'
import { Alert } from 'components/ui/Alert'
import { InfoCard } from 'components/ui/InfoCard'
import { PageHero } from 'components/ui/PageHero'
import { StatusBadge } from 'components/ui/StatusBadge'
import { useProfile } from '../../../../hooks/useProfile'

export default function PerfilCliente() {
  const { profile, loading, error, refresh } = useProfile()

  useEffect(() => {
    refresh()
  }, [refresh])

  if (loading && !profile) return <LoadingSpinner text="Cargando perfil..." />

  const name = profile?.nombre || 'Cliente Cafrilosa'
  const email = profile?.email || 'Sin correo'
  const phone = profile?.telefono || 'Sin teléfono'
  const role = profile?.rol?.nombre || 'Sin rol'
  const created = profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString('es-PE') : '---'

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHero
        title="Mi Perfil"
        subtitle="Administra tu información personal y de contacto"
        chips={['Datos personales', 'Preferencias', 'Historial']}
      />

      {error && <Alert type="error" title="Error" message={error} />}

      <div className="flex items-center gap-3 rounded-2xl bg-neutral-50 px-4 py-3">
        <div className="grid h-12 w-12 place-items-center rounded-full bg-brand-red text-white text-lg font-bold">
          {name.slice(0, 1).toUpperCase()}
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-neutral-500">Cliente</p>
          <p className="text-lg font-bold text-neutral-900">{name}</p>
          <div className="flex flex-wrap gap-2 text-xs font-semibold text-neutral-700 mt-1">
            <StatusBadge variant={profile?.activo ? 'success' : 'warning'}>
              {profile?.activo ? 'Activo' : 'Inactivo'}
            </StatusBadge>
            <StatusBadge variant={profile?.emailVerificado ? 'success' : 'warning'}>
              {profile?.emailVerificado ? 'Email verificado' : 'Email no verificado'}
            </StatusBadge>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <InfoCard label="Correo" value={email} />
        <InfoCard label="Teléfono" value={phone} />
        <InfoCard label="Rol" value={role} />
        <InfoCard label="Estado" value={profile?.activo ? 'Activo' : 'Inactivo'} />
        <InfoCard label="Email verificado" value={profile?.emailVerificado ? 'Sí' : 'No'} />
        <InfoCard label="Alta" value={created} />
      </div>

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
