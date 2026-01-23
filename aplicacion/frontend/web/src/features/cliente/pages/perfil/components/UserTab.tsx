
import { InfoCard } from 'components/ui/InfoCard'

interface UserTabProps {
    email: string
    phone: string
    role: string
    activeStatus: string
    name: string
    emailVerified: string
    editing: boolean
    form: { nombre: string; telefono: string; avatarUrl: string }
    setForm: React.Dispatch<React.SetStateAction<{ nombre: string; telefono: string; avatarUrl: string }>>
}

export function UserTab({
    email,
    phone,
    role,
    activeStatus,
    name,
    emailVerified,
    editing,
    form,
    setForm
}: UserTabProps) {
    return (
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
            <InfoCard label="Estado" value={activeStatus} />

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

            <InfoCard label="Email verificado" value={emailVerified} />
        </div>
    )
}
