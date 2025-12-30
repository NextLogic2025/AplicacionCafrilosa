import { Mail, Phone, User, Shield, CheckCircle2, Clock } from 'lucide-react'
import { useEffect } from 'react'

import { PageHero } from 'components/ui/PageHero'
import { InfoCard } from 'components/ui/InfoCard'
import { StatusBadge } from 'components/ui/StatusBadge'
import { LoadingSpinner } from 'components/ui/LoadingSpinner'
import { Alert } from 'components/ui/Alert'
import { useProfile } from '../../../../hooks/useProfile'

export default function PerfilPage() {
  const { profile, loading, error, refresh } = useProfile()

  useEffect(() => {
    refresh()
  }, [refresh])

  if (loading && !profile) return <LoadingSpinner text="Cargando perfil..." />

  const name = profile?.nombre || 'Usuario Cafrilosa'
  const email = profile?.email || 'Sin correo'
  const phone = profile?.telefono || 'Sin teléfono'
  const role = profile?.rol?.nombre || 'Sin rol'
  const created = profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString('es-PE') : '---'

  return (
    <div className="space-y-6">
      <PageHero
        title="Mi Perfil"
        subtitle="Datos personales y zona de supervisión"
        chips={['Datos personales', 'Zona de supervisión', 'Permisos asignados']}
      />

      {error && <Alert type="error" title="Error" message={error} />}

      <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center gap-4">
          <div className="grid h-14 w-14 place-items-center rounded-full bg-brand-red text-lg font-bold text-white">
            {name.slice(0, 1).toUpperCase()}
          </div>
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-[0.18em] text-neutral-500">Supervisor</p>
            <p className="text-xl font-bold text-neutral-900">{name}</p>
            <div className="flex flex-wrap gap-2 text-sm text-neutral-700">
              <span className="inline-flex items-center gap-1 text-neutral-600">
                <Shield className="h-4 w-4 text-brand-red" />
                {role}
              </span>
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

      <div className="grid gap-4 md:grid-cols-2">
        <InfoCard label="Correo" value={email} />
        <InfoCard label="Teléfono" value={phone} />
        <InfoCard label="Rol" value={role} />
        <InfoCard label="Estado" value={profile?.activo ? 'Activo' : 'Inactivo'} />
        <InfoCard label="Email verificado" value={profile?.emailVerificado ? 'Sí' : 'No'} />
        <InfoCard label="Alta" value={created} />
      </div>

      <div className="rounded-2xl border border-neutral-100 bg-white p-5 shadow-sm">
        <p className="text-sm text-neutral-700 flex items-center gap-2">
          <Clock className="h-4 w-4 text-brand-red" />
          Última actualización de perfil: {created}
        </p>
      </div>
    </div>
  )
}
