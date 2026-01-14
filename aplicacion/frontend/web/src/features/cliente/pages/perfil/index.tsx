import React, { useEffect } from 'react'
import { ShieldCheck, User2 } from 'lucide-react'

import { useCliente } from '../../hooks/useCliente'
import { LoadingSpinner } from 'components/ui/LoadingSpinner'
import { Alert } from 'components/ui/Alert'
import { InfoCard } from 'components/ui/InfoCard'
import { PageHero } from 'components/ui/PageHero'

export default function PerfilCliente() {
  const { perfil, cargando, error, fetchPerfilCliente, limpiarError } = useCliente()

  useEffect(() => {
    fetchPerfilCliente()
  }, [fetchPerfilCliente])

  if (cargando && !perfil) {
    return <LoadingSpinner text="Cargando perfil..." />
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHero
        title="Mi Perfil"
        subtitle="Administra tu informaci\u00f3n personal, contacto y preferencias"
        chips={[
          'Datos personales',
          'Informaci\u00f3n de facturaci\u00f3n',
          'Historial de compras',
        ]}
      />
    <div className="space-y-4">
      {error && <Alert type="error" title="Error" message={error} onClose={limpiarError} />}

      <div className="flex items-center gap-3 rounded-2xl bg-neutral-50 px-4 py-3">
        <div className="grid h-12 w-12 place-items-center rounded-full bg-brand-red text-white">
          <User2 className="h-6 w-6" />
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-neutral-500">Mi Perfil</p>
          <p className="text-lg font-bold text-neutral-900">{perfil?.contactName || 'Cliente Cafrilosa'}</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <InfoCard label="Razón social" value={perfil?.contactName || 'No disponible'} />
        <InfoCard label="Email" value="juan@cafrilosa.com" />
        <InfoCard label="RUC" value="20231234567" />
        <InfoCard label="Zona asignada" value="Zona Centro" />
        <InfoCard label="Vendedor asignado" value="María Gómez" />
        <InfoCard label="Límite de crédito" value={`$${perfil?.creditLimit?.toFixed(2) || '0.00'}`} />
        <InfoCard label="Saldo pendiente" value={`$${perfil?.currentDebt?.toFixed(2) || '0.00'}`} />
      </div>

      <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-2 text-sm text-neutral-800">
          <ShieldCheck className="h-4 w-4 text-brand-red" />
          Datos editables: correo y contacto. Para cambios de zona, vendedor o límite de crédito, contacta a soporte.
        </div>
      </div>
    </div>
    </div>
  )
}
