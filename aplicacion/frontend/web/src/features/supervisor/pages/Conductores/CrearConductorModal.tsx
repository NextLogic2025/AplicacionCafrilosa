import { useState } from 'react'
import { Modal } from 'components/ui/Modal'
import { Button } from 'components/ui/Button'
import { TextField } from 'components/ui/TextField'
import { Check, ChevronRight, User, Truck } from 'lucide-react'
import { createConductor } from '../../services/conductoresApi'
import { createUsuario } from '../../services/usuariosApi'
import { Alert } from 'components/ui/Alert'

interface CrearConductorModalProps {
    isOpen: boolean
    onClose: () => void
    onSuccess: () => void
}

type Step = 1 | 2

interface FormData {
    // Step 1: User
    nombre_completo: string
    email: string
    password: string
    // Step 2: Conductor
    cedula: string
    telefono: string
    licencia: string
}

const INITIAL_DATA: FormData = {
    nombre_completo: '',
    email: '',
    password: '',
    cedula: '',
    telefono: '',
    licencia: '',
}

export function CrearConductorModal({ isOpen, onClose, onSuccess }: CrearConductorModalProps) {
    const [step, setStep] = useState<Step>(1)
    const [formData, setFormData] = useState<FormData>(INITIAL_DATA)
    const [errors, setErrors] = useState<Record<string, string>>({})
    const [submitting, setSubmitting] = useState(false)
    const [submitMessage, setSubmitMessage] = useState<{ type: 'success' | 'error', message: string } | null>(null)

    const handleClose = () => {
        setStep(1)
        setFormData(INITIAL_DATA)
        setErrors({})
        setSubmitMessage(null)
        onClose()
    }

    const validateStep1 = () => {
        const newErrors: Record<string, string> = {}
        if (!formData.nombre_completo.trim()) newErrors.nombre_completo = 'El nombre es obligatorio'
        if (!formData.email.trim()) {
            newErrors.email = 'El email es obligatorio'
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'Email inválido'
        }
        if (!formData.password) {
            newErrors.password = 'La contraseña es obligatoria'
        } else if (formData.password.length < 8) {
            newErrors.password = 'Mínimo 8 caracteres'
        }
        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const validateStep2 = () => {
        const newErrors: Record<string, string> = {}
        if (!formData.cedula.trim()) {
            newErrors.cedula = 'La cédula es obligatoria'
        } else if (formData.cedula.length < 10) {
            newErrors.cedula = 'La cédula debe tener 10 dígitos'
        }
        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleNext = () => {
        if (step === 1) {
            if (validateStep1()) setStep(2)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (step === 1) {
            handleNext()
            return
        }

        if (!validateStep2()) return

        setSubmitting(true)
        setSubmitMessage(null)

        try {
            // 1. Crear Usuario (Transportista = Role ID 5)
            const usuario = await createUsuario({
                nombre: formData.nombre_completo,
                email: formData.email,
                password: formData.password,
                rolId: 5 // Transportista
            })

            // 2. Crear Conductor vinculado
            await createConductor({
                nombre_completo: formData.nombre_completo,
                cedula: formData.cedula,
                telefono: formData.telefono,
                licencia: formData.licencia || undefined,
                usuario_id: usuario.id
            })

            setSubmitMessage({ type: 'success', message: 'Conductor creado exitosamente' })
            setTimeout(() => {
                handleClose()
                onSuccess()
            }, 1000)
        } catch (error: any) {
            setSubmitMessage({
                type: 'error',
                message: error.message || 'Error al crear el conductor'
            })
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="Nuevo Conductor" headerGradient="red" maxWidth="md">
            {/* Steps Header */}
            <div className="mb-6 flex items-center justify-between px-4">
                <div className={`flex flex-col items-center ${step >= 1 ? 'text-brand-red' : 'text-gray-400'}`}>
                    <div className={`flex h-10 w-10 items-center justify-center rounded-full border-2 ${step >= 1 ? 'border-brand-red bg-white' : 'border-gray-300'}`}>
                        <User size={20} />
                    </div>
                    <span className="mt-1 text-xs font-medium">Usuario</span>
                </div>
                <div className={`h-0.5 flex-1 mx-4 ${step > 1 ? 'bg-brand-red' : 'bg-gray-200'}`} />
                <div className={`flex flex-col items-center ${step >= 2 ? 'text-brand-red' : 'text-gray-400'}`}>
                    <div className={`flex h-10 w-10 items-center justify-center rounded-full border-2 ${step >= 2 ? 'border-brand-red bg-white' : 'border-gray-300'}`}>
                        <Truck size={20} />
                    </div>
                    <span className="mt-1 text-xs font-medium">Datos</span>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                {submitMessage && (
                    <Alert type={submitMessage.type} message={submitMessage.message} onClose={() => setSubmitMessage(null)} />
                )}

                {step === 1 && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                        <TextField
                            label="Nombre Completo"
                            tone="light"
                            placeholder="Ej. Juan Pérez"
                            value={formData.nombre_completo}
                            onChange={e => setFormData({ ...formData, nombre_completo: e.target.value })}
                            error={errors.nombre_completo}
                            disabled={submitting}
                        />
                        <TextField
                            label="Correo Electrónico"
                            tone="light"
                            type="email"
                            placeholder="juan@empresa.com"
                            value={formData.email}
                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                            error={errors.email}
                            disabled={submitting}
                        />
                        <TextField
                            label="Contraseña"
                            tone="light"
                            type="password"
                            placeholder="Mínimo 8 caracteres"
                            value={formData.password}
                            onChange={e => setFormData({ ...formData, password: e.target.value })}
                            error={errors.password}
                            disabled={submitting}
                        />
                    </div>
                )}

                {step === 2 && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                        <TextField
                            label="Cédula / Identificación"
                            tone="light"
                            placeholder="Ej. 0912345678"
                            value={formData.cedula}
                            onChange={e => setFormData({ ...formData, cedula: e.target.value })}
                            error={errors.cedula}
                            disabled={submitting}
                        />
                        <TextField
                            label="Teléfono"
                            tone="light"
                            placeholder="Ej. 0991234567"
                            value={formData.telefono}
                            onChange={e => setFormData({ ...formData, telefono: e.target.value })}
                            error={errors.telefono}
                            disabled={submitting}
                        />
                        <div className="grid gap-2">
                            <label className="text-xs text-neutral-600">Licencia (Opcional)</label>
                            <select
                                value={formData.licencia}
                                onChange={e => setFormData({ ...formData, licencia: e.target.value })}
                                className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-neutral-900 outline-none transition focus:border-brand-red/60 focus:shadow-[0_0_0_4px_rgba(240,65,45,0.18)] disabled:opacity-50"
                                disabled={submitting}
                            >
                                <option value="">Seleccione tipo</option>
                                <option value="A">Tipo A (Motos)</option>
                                <option value="B">Tipo B (Autos)</option>
                                <option value="C">Tipo C (Taxis)</option>
                                <option value="D">Tipo D (Pasajeros)</option>
                                <option value="E">Tipo E (Pesados)</option>
                            </select>
                        </div>
                    </div>
                )}

                <div className="flex justify-between gap-3 pt-6 border-t border-neutral-100">
                    {step === 2 ? (
                        <Button type="button" variant="outline" onClick={() => setStep(1)} disabled={submitting}>
                            Atrás
                        </Button>
                    ) : (
                        <Button type="button" variant="outline" onClick={handleClose} disabled={submitting}>
                            Cancelar
                        </Button>
                    )}

                    <Button type="submit" disabled={submitting} className="bg-brand-red text-white hover:bg-brand-red/90 shadow-sm min-w-[120px]">
                        {submitting ? 'Guardando...' : step === 1 ? (
                            <span className="flex items-center gap-2">Siguiente <ChevronRight size={16} /></span>
                        ) : 'Crear Conductor'}
                    </Button>
                </div>
            </form>
        </Modal>
    )
}
