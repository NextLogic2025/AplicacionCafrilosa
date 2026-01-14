import { useEffect, useState } from 'react'
import { env } from '../../../../config/env'
import { Mail, Phone, MapPin, User, Clock } from 'lucide-react'

import { PageHero } from '../../../../components/ui/PageHero'
import { InfoCard } from '../../../../components/ui/InfoCard'
import { StatusBadge } from '../../../../components/ui/StatusBadge'
import { LoadingSpinner } from '../../../../components/ui/LoadingSpinner'
import { Alert } from '../../../../components/ui/Alert'
import { useProfile } from '../../../../hooks/useProfile'

export default function VendedorPerfil() {
  const { profile, loading, error, refresh, updateProfile } = useProfile()
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ nombre: '', telefono: '' })
  const [success, setSuccess] = useState<string | null>(null)
  const [tokenUserId, setTokenUserId] = useState<string | null>(null)
  const [canEditSelf, setCanEditSelf] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)

  useEffect(() => {
    refresh()
  }, [refresh])

  useEffect(() => {
    setForm({ nombre: profile?.nombre ?? (profile as any)?.nombreCompleto ?? '', telefono: profile?.telefono ?? '' })
  }, [profile])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const t = localStorage.getItem('cafrilosa.token') || sessionStorage.getItem('cafrilosa.token')
        if (!t) {
          if (!cancelled) {
            setTokenUserId(null)
            setCanEditSelf(false)
          }
          return
        }
        const parts = t.split('.')
        if (parts.length < 2) {
          if (!cancelled) {
            setTokenUserId(null)
            setCanEditSelf(false)
          }
          return
        }
        const payload = JSON.parse(atob(parts[1])) as Record<string, any>
        const id = (payload.sub ?? payload.id ?? payload.userId ?? payload.usuario_id ?? payload.uid) as string | undefined
        if (!cancelled) setTokenUserId(id ?? null)

        const rawRoleId = payload.rolId ?? payload.roleId ?? payload.rol_id ?? payload.role_id
        const rawRoleName = payload.rol ?? payload.role ?? (payload.roleName ?? payload.nombre_rol)
        const roleId = typeof rawRoleId === 'string' ? Number(rawRoleId) : rawRoleId
        const roleName = typeof rawRoleName === 'string' ? String(rawRoleName).toLowerCase() : undefined
        const isSupervisor = roleId === 2 || roleName === 'supervisor'
        const tokenEmail = (payload.email ?? payload.usuario?.email ?? payload.user_email) as string | undefined
        const isSelfById = !!id && profile?.id ? String(id) === String(profile.id) : false
        const isSelfByEmail = tokenEmail && profile?.email ? String(tokenEmail).toLowerCase() === String(profile.email).toLowerCase() : false

        if (!cancelled) setCanEditSelf(isSupervisor || isSelfById || isSelfByEmail)
      } catch (err) {
        if (!cancelled) {
          setTokenUserId(null)
          setCanEditSelf(false)
        }
      }
    })()
    return () => { cancelled = true }
  }, [profile])

  if (loading && !profile) return <LoadingSpinner text="Cargando perfil..." />

  const name = profile?.nombre || (profile as any)?.nombreCompleto || profile?.email || 'Usuario Cafrilosa'
  const email = profile?.email || 'Sin correo'
  const phone = profile?.telefono || 'Sin teléfono'
  const role = profile?.rol?.nombre || 'Sin rol'
  const created = profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString('es-PE') : '---'

  return (
    <div className="space-y-6">
      <PageHero
        title="Mi Perfil"
        subtitle="Información personal y zona comercial"
        chips={[{ label: 'Datos personales', variant: 'blue' }, { label: 'Zona comercial', variant: 'green' }]}
      />

      {error && <Alert type="error" title="Error" message={error} />} 

      {/* DEBUG block removed: profile fields now handled with nombreCompleto fallback */}

      <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center gap-4 justify-between">
          <div className="flex items-center gap-4">
            <div className="grid h-14 w-14 place-items-center rounded-full bg-brand-red text-lg font-bold text-white">
              {name.slice(0, 1).toUpperCase()}
            </div>
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-[0.18em] text-neutral-500">Vendedor</p>
              {!editing ? (
                <p className="text-xl font-bold text-neutral-900">{name}</p>
              ) : (
                <input
                  className="rounded-md border px-3 py-1 text-xl font-semibold"
                  value={form.nombre}
                  onChange={(e) => setForm((s) => ({ ...s, nombre: e.target.value }))}
                />
              )}

              <div className="flex flex-wrap gap-2 text-sm text-neutral-700">
                <span className="inline-flex items-center gap-1 text-neutral-600">
                  <User className="h-4 w-4 text-brand-red" />
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

          <div>
            {!editing ? (
                <>
                  <button
                    className={`inline-flex items-center gap-2 rounded-md px-3 py-1 text-sm font-semibold ${canEditSelf ? 'bg-brand-red text-white' : 'bg-gray-200 text-gray-600 cursor-not-allowed'}`}
                    onClick={() => { if (canEditSelf) { setEditing(true); setSuccess(null) } }}
                    title={canEditSelf ? 'Editar' : 'No tienes permisos para editar este usuario con las credenciales actuales'}
                  >
                    Editar
                  </button>
                  {!canEditSelf && (
                    <div className="mt-2 text-sm text-yellow-700">No puedes editar este perfil con tu sesión actual. Inicia sesión con la cuenta correcta o solicita permisos.</div>
                  )}
                </>
              ) : (
              <div className="flex gap-2">
                <button
                  className="inline-flex items-center gap-2 rounded-md bg-brand-red px-3 py-1 text-white text-sm font-semibold"
                  onClick={async () => {
                    try {
                      setSuccess(null)
                      setLocalError(null)
                      const body = { nombre: form.nombre || null, telefono: form.telefono || null }
                      // Temporary debug logs (only in dev)
                      try {
                        if (import.meta.env.DEV) {
                          // eslint-disable-next-line no-console
                          // debug log removed
                        }
                      } catch (e) {
                        // ignore logging errors
                      }
                      await updateProfile(body as any)
                      try {
                        await refresh()
                      } catch (err) {
                        // ignore refresh errors, profile was updated on server
                      }
                      setSuccess('Perfil actualizado')
                      setEditing(false)
                    } catch (e) {
                      // Try to extract useful info from the error (ApiError from http.ts)
                      try {
                        // eslint-disable-next-line no-console
                        console.error('updateProfile error', e)
                        const anyE = e as any
                        const status = anyE?.status ?? null
                        const payload = anyE?.payload ?? null
                        const message = (anyE?.message && typeof anyE.message === 'string') ? anyE.message : (payload && (payload.message || payload.error)) || 'No se pudo actualizar el perfil'
                        const composed = status ? `${status} - ${message}` : String(message)
                        setLocalError(composed + (payload ? ` - ${JSON.stringify(payload)}` : ''))
                      } catch (err) {
                        const msg = e instanceof Error ? e.message : 'No se pudo actualizar el perfil'
                        setLocalError(msg)
                      }
                    }
                  }}
                  disabled={loading || !profile}
                >
                  Guardar
                </button>
                <button
                  className="inline-flex items-center gap-2 rounded-md border px-3 py-1 text-sm font-semibold"
                  onClick={() => { setEditing(false); setForm({ nombre: profile?.nombre ?? '', telefono: profile?.telefono ?? '' }); setSuccess(null) }}
                  disabled={loading}
                >
                  Cancelar
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

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
        <InfoCard label="Email verificado" value={profile?.emailVerificado ? 'Sí' : 'No'} />
        <InfoCard label="Alta" value={created} />
      </div>

      {localError && <div className="rounded-md bg-red-50 border border-red-100 p-3 text-sm text-red-800">{localError}</div>}
      {success && <div className="rounded-md bg-green-50 border border-green-100 p-3 text-sm text-green-800">{success}</div>}

      <div className="rounded-2xl border border-neutral-100 bg-white p-5 shadow-sm">
        <p className="text-sm text-neutral-700 flex items-center gap-2">
          <MapPin className="h-4 w-4 text-brand-red" />
          Zona comercial asignada: pendiente de asignación
        </p>
        <p className="text-sm text-neutral-700 flex items-center gap-2 mt-2">
          <Clock className="h-4 w-4 text-brand-red" />
          Última actualización de perfil: {created}
        </p>
      </div>
    </div>
  )
}
