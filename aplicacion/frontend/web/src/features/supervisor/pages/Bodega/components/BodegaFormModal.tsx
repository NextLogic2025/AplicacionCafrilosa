import { useForm } from 'react-hook-form'
import { useEffect } from 'react'
import { Modal } from 'components/ui/Modal'
import { TextField } from 'components/ui/TextField'
import { Toggle } from 'components/ui/Toggle'
import { Button } from 'components/ui/Button'
import type { Bodega, CreateBodegaDto } from '../../../services/bodegaApi'

interface BodegaFormModalProps {
    isOpen: boolean
    onClose: () => void
    initialData?: Bodega
    onSubmit: (data: CreateBodegaDto) => Promise<void>
    isEditing: boolean
}

interface FormData {
    nombre: string
    codigo_numero: string
    direccionFisica: string
    requiereFrio: boolean
    activo: boolean
}

export function BodegaFormModal({
    isOpen,
    onClose,
    initialData,
    onSubmit,
    isEditing,
}: BodegaFormModalProps) {
    const {
        register,
        handleSubmit,
        reset,
        setValue,
        watch,
        formState: { errors, isSubmitting },
    } = useForm<FormData>({
        defaultValues: {
            nombre: '',
            codigo_numero: '',
            direccionFisica: '',
            requiereFrio: false,
            activo: true,
        },
    })

    useEffect(() => {
        if (!isOpen) {
            reset()
        }
    }, [isOpen, reset])

    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                const refCode = initialData.codigoRef || ''
                const codeMatch = refCode.match(/BOD-(.+)/)
                const codeNumber = codeMatch ? codeMatch[1] : refCode.replace('BOD-', '')

                reset({
                    nombre: initialData.nombre,
                    codigo_numero: codeNumber,
                    direccionFisica: initialData.direccionFisica || '',
                    requiereFrio: initialData.requiereFrio,
                    activo: initialData.activo,
                })
            } else {
                reset({
                    nombre: '',
                    codigo_numero: '',
                    direccionFisica: '',
                    requiereFrio: false,
                    activo: true,
                })
            }
        }
    }, [isOpen, initialData, reset])

    const onFormSubmit = async (data: FormData) => {
        const fullCode = `BOD-${data.codigo_numero}`

        const submitData: CreateBodegaDto = {
            nombre: data.nombre.trim(),
            codigoRef: fullCode,
            direccionFisica: data.direccionFisica?.trim() || undefined,
            requiereFrio: data.requiereFrio,
            ...(isEditing ? { activo: data.activo } : {}),
        }

        await onSubmit(submitData)
    }

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={isEditing ? 'Editar Bodega' : 'Nueva Bodega'}
            size="md"
        >
            <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
                <TextField
                    label="Nombre del almacén"
                    placeholder="Ej. Bodega Central"
                    error={errors.nombre?.message}
                    tone="light"
                    {...register('nombre', { required: 'El nombre es obligatorio' })}
                />

                <div className="space-y-1">
                    <label className="block text-xs font-medium text-neutral-600">
                        Código de Referencia
                    </label>
                    <div className={`flex rounded-xl border overflow-hidden focus-within:ring-2 focus-within:ring-brand-red/20 focus-within:border-brand-red ${errors.codigo_numero ? 'border-red-400' : 'border-neutral-200'}`}>
                        <div className="flex select-none items-center bg-neutral-100 px-3 text-neutral-500 text-sm font-medium border-r border-neutral-200">
                            BOD-
                        </div>
                        <input
                            type="text"
                            className="block w-full border-0 p-2.5 focus:ring-0 text-sm bg-neutral-50 text-neutral-900 placeholder:text-neutral-400"
                            placeholder="01"
                            {...register('codigo_numero', {
                                required: 'El código es obligatorio',
                                pattern: {
                                    value: /^[A-Za-z0-9]+$/,
                                    message: 'Solo se permiten letras y números'
                                }
                            })}
                        />
                    </div>
                    {errors.codigo_numero && (
                        <p className="text-xs text-red-600 mt-1">{errors.codigo_numero.message}</p>
                    )}
                </div>

                <div className="space-y-1">
                    <label className="block text-xs font-medium text-neutral-600">
                        Dirección física
                    </label>
                    <textarea
                        className={`block w-full rounded-xl border p-2.5 text-sm outline-none transition
              ${errors.direccionFisica
                                ? 'border-red-400/60'
                                : 'border-neutral-200 focus:border-brand-red/60 focus:shadow-[0_0_0_4px_rgba(240,65,45,0.18)]'
                            } bg-neutral-50 text-neutral-900 placeholder:text-neutral-400`}
                        rows={3}
                        placeholder="Calle, número, referencia"
                        {...register('direccionFisica')}
                    />
                    {errors.direccionFisica && (
                        <p className="text-xs text-red-600 mt-1">{errors.direccionFisica.message}</p>
                    )}
                </div>

                <div className="rounded-xl border border-neutral-200 p-4 bg-neutral-50/50 flex items-center justify-between">
                    <div>
                        <span className="block text-sm font-semibold text-neutral-900">Requiere cadena de frío</span>
                        <span className="block text-xs text-neutral-500 mt-0.5">Úsalo para productos sensibles que necesiten refrigeración.</span>
                    </div>
                    <Toggle
                        enabled={watch('requiereFrio')}
                        onChange={(checked) => setValue('requiereFrio', checked)}
                    />
                </div>

                {isEditing && (
                    <div className="rounded-xl border border-neutral-200 p-4 bg-neutral-50/50 flex items-center justify-between">
                        <div>
                            <span className="block text-sm font-semibold text-neutral-900">Bodega Activa</span>
                            <span className="block text-xs text-neutral-500 mt-0.5">Desactiva esta bodega para ocultarla de las selecciónes activas.</span>
                        </div>
                        <Toggle
                            enabled={watch('activo')}
                            onChange={(checked) => setValue('activo', checked)}
                        />
                    </div>
                )}

                <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-neutral-100">
                    <Button type="button" variant="ghost" onClick={onClose} className="text-neutral-600 hover:text-neutral-900">
                        Cancelar
                    </Button>
                    <Button
                        type="submit"
                        loading={isSubmitting}
                        className="bg-brand-red text-white hover:bg-brand-red/90"
                    >
                        {isEditing ? 'Guardar Cambios' : 'Crear Almacén'}
                    </Button>
                </div>
            </form>
        </Modal>
    )
}
