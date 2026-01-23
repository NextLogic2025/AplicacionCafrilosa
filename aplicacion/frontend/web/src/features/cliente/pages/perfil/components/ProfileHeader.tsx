
import { StatusBadge } from 'components/ui/StatusBadge'
import { Alert } from 'components/ui/Alert'

interface ProfileHeaderProps {
    name: string
    activeStep: number
    setActiveStep: (step: number) => void
    editing: boolean
    setEditing: (editing: boolean) => void
    loading: boolean
    profile: any
    handleSaveUser: () => void
    handleCancelUser: () => void
    clientEditing: boolean
    setClientEditing: (editing: boolean) => void
    handleSaveClient: () => void
    handleCancelClient: () => void
    clientLoading: boolean
    formNombre: string
    setFormNombre: (nombre: string) => void
    error?: string | null
    success?: string | null
}

export function ProfileHeader({
    name,
    activeStep,
    setActiveStep,
    editing,
    setEditing,
    loading,
    profile,
    handleSaveUser,
    handleCancelUser,
    clientEditing,
    setClientEditing,
    handleSaveClient,
    handleCancelClient,
    clientLoading,
    formNombre,
    setFormNombre,
    error,
    success
}: ProfileHeaderProps) {
    return (
        <>
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
                                    value={formNombre}
                                    onChange={(e) => setFormNombre(e.target.value)}
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
                                        onClick={handleSaveUser}
                                        disabled={loading || !profile}
                                        title={loading || !profile ? 'Espere a que el perfil cargue antes de guardar' : 'Guardar cambios'}
                                    >
                                        Guardar
                                    </button>
                                    <button
                                        className="inline-flex items-center gap-2 rounded-md border px-3 py-1 text-sm font-semibold"
                                        onClick={handleCancelUser}
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
                                        onClick={handleSaveClient}
                                        disabled={clientLoading}
                                    >
                                        Guardar cliente
                                    </button>
                                    <button
                                        className="inline-flex items-center gap-2 rounded-md border px-3 py-1 text-sm font-semibold"
                                        onClick={handleCancelClient}
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
        </>
    )
}
