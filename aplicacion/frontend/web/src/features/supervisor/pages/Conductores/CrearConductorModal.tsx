import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Modal } from 'components/ui/Modal'
import { Button } from 'components/ui/Button'
import { createConductor } from '../../services/conductoresApi'
import { useState } from 'react'
import { TextField } from 'components/ui/TextField'

const schema = z.object({
    nombre_completo: z.string().min(3, 'El nombre es obligatorio (mínimo 3 caracteres)'),
    cedula: z.string().min(10, 'La cédula debe tener al menos 10 dígitos'),
    telefono: z.string().optional(),
    licencia: z.string().optional(),
})

type FormData = z.infer<typeof schema>

interface CrearConductorModalProps {
    isOpen: boolean
    onClose: () => void
    onSuccess: () => void
}

export function CrearConductorModal({ isOpen, onClose, onSuccess }: CrearConductorModalProps) {
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<FormData>({
        resolver: zodResolver(schema),
    })

    const onSubmit = async (data: FormData) => {
        setSubmitting(true)
        setError(null)
        try {
            await createConductor(data)
            reset()
            onSuccess()
            onClose()
        } catch (err) {
            setError('Error al crear el conductor. Verifique los datos.')
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Registrar Nuevo Conductor" headerGradient="red" maxWidth="md">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 border border-red-100">{error}</div>}

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="md:col-span-2">
                        <TextField
                            label="Nombre Completo"
                            tone="light"
                            type="text"
                            placeholder="Ej. Juan Pérez"
                            {...register('nombre_completo')}
                            error={errors.nombre_completo?.message}
                            disabled={submitting}
                        />
                    </div>

                    <div>
                        <TextField
                            label="Cédula / Identificación"
                            tone="light"
                            type="text"
                            placeholder="Ej. 0912345678"
                            {...register('cedula')}
                            error={errors.cedula?.message}
                            disabled={submitting}
                        />
                    </div>

                    <div>
                        <TextField
                            label="Teléfono (Opcional)"
                            tone="light"
                            type="text"
                            placeholder="Ej. 0991234567"
                            {...register('telefono')}
                            error={errors.telefono?.message}
                            disabled={submitting}
                        />
                    </div>

                    <div className="md:col-span-2">
                        <label className="mb-1 block text-sm font-medium text-neutral-700">Licencia (Opcional)</label>
                        <select
                            {...register('licencia')}
                            className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-neutral-900 outline-none transition focus:border-brand-red/60 focus:shadow-[0_0_0_4px_rgba(240,65,45,0.18)] disabled:opacity-50"
                            disabled={submitting}
                        >
                            <option value="">Seleccione un tipo</option>
                            <option value="A">Tipo A (Ciclomotores, motocicletas)</option>
                            <option value="B">Tipo B (Automóviles, camionetas)</option>
                            <option value="C">Tipo C (Taxis, convencionales)</option>
                            <option value="D">Tipo D (Servicio público, pasajeros)</option>
                            <option value="E">Tipo E (Camiones pesados, trailers)</option>
                            <option value="F">Tipo F (Automotores especiales)</option>
                            <option value="G">Tipo G (Maquinaria agrícola/pesada)</option>
                        </select>
                    </div>
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t border-neutral-100">
                    <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
                        Cancelar
                    </Button>
                    <Button type="submit" disabled={submitting} className="bg-brand-red text-white hover:bg-brand-red/90 shadow-sm">
                        {submitting ? 'Guardando...' : 'Crear Conductor'}
                    </Button>
                </div>
            </form>
        </Modal>
    )
}
