import { useState } from 'react'
import { Modal } from 'components/ui/Modal'
import { TextField } from 'components/ui/TextField'
import { Alert } from 'components/ui/Alert'
import { Button } from 'components/ui/Button'
import { crearCliente } from '../../services/clientesApi'

const TIPOS_IDENTIFICACION = ['RUC', 'Cédula', 'Pasaporte']

const INITIAL_FORM_STATE = {
  identificacion: '',
  tipo_identificacion: 'RUC',
  razon_social: '',
  nombre_comercial: '',
  tiene_credito: false,
  limite_credito: 0,
  dias_plazo: 0,
  direccion_texto: '',
}

interface CrearClienteModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function CrearClienteModal({ isOpen, onClose, onSuccess }: CrearClienteModalProps) {
  const [formData, setFormData] = useState(INITIAL_FORM_STATE)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitMessage, setSubmitMessage] = useState<{
    type: 'success' | 'error'
    message: string
  } | null>(null)

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.identificacion.trim()) {
      newErrors.identificacion = 'La identificación es requerida'
    }

    if (!formData.razon_social.trim()) {
      newErrors.razon_social = 'La razón social es requerida'
    }

    if (formData.tiene_credito && formData.limite_credito <= 0) {
      newErrors.limite_credito = 'El límite de crédito debe ser mayor a 0'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleClose = () => {
    setFormData(INITIAL_FORM_STATE)
    setErrors({})
    setSubmitMessage(null)
    onClose()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitMessage(null)

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)

    try {
      await crearCliente({
        identificacion: formData.identificacion,
        tipo_identificacion: formData.tipo_identificacion,
        razon_social: formData.razon_social,
        nombre_comercial: formData.nombre_comercial || undefined,
        tiene_credito: formData.tiene_credito,
        limite_credito: formData.tiene_credito ? formData.limite_credito : 0,
        dias_plazo: formData.tiene_credito ? formData.dias_plazo : 0,
        direccion_texto: formData.direccion_texto || undefined,
      })

      setSubmitMessage({
        type: 'success',
        message: 'Cliente creado exitosamente',
      })

      setTimeout(() => {
        handleClose()
        onSuccess()
      }, 1500)
    } catch (error: any) {
      setSubmitMessage({
        type: 'error',
        message: error.message || 'Error al crear el cliente',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      title="Crear Cliente"
      onClose={handleClose}
      headerGradient="red"
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {submitMessage && (
          <Alert
            type={submitMessage.type}
            message={submitMessage.message}
            onClose={() => setSubmitMessage(null)}
          />
        )}

        {/* Información básica */}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="grid gap-2">
            <label className="text-xs text-neutral-600">Tipo de Identificación</label>
            <select
              value={formData.tipo_identificacion}
              onChange={(e) =>
                setFormData({ ...formData, tipo_identificacion: e.target.value })
              }
              className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-neutral-900 outline-none transition focus:border-brand-red/60 focus:shadow-[0_0_0_4px_rgba(240,65,45,0.18)] disabled:opacity-50"
              disabled={isSubmitting}
            >
              {TIPOS_IDENTIFICACION.map((tipo) => (
                <option key={tipo} value={tipo}>
                  {tipo}
                </option>
              ))}
            </select>
          </div>

          <TextField
            label="Número de Identificación"
            tone="light"
            type="text"
            placeholder="Ej: 0123456789"
            value={formData.identificacion}
            onChange={(e) =>
              setFormData({ ...formData, identificacion: e.target.value })
            }
            error={errors.identificacion}
            disabled={isSubmitting}
          />
        </div>

        <TextField
          label="Razón Social"
          tone="light"
          type="text"
          placeholder="Nombre de la empresa"
          value={formData.razon_social}
          onChange={(e) =>
            setFormData({ ...formData, razon_social: e.target.value })
          }
          error={errors.razon_social}
          disabled={isSubmitting}
        />

        <TextField
          label="Nombre Comercial (Opcional)"
          tone="light"
          type="text"
          placeholder="Nombre corto de la empresa"
          value={formData.nombre_comercial}
          onChange={(e) =>
            setFormData({ ...formData, nombre_comercial: e.target.value })
          }
          disabled={isSubmitting}
        />

        {/* Dirección */}
        <div className="grid gap-2">
          <label className="text-xs text-neutral-600">Dirección (Opcional)</label>
          <textarea
            value={formData.direccion_texto}
            onChange={(e) =>
              setFormData({ ...formData, direccion_texto: e.target.value })
            }
            placeholder="Dirección física del cliente"
            className="min-h-[80px] w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-neutral-900 outline-none transition focus:border-brand-red/60 focus:shadow-[0_0_0_4px_rgba(240,65,45,0.18)] disabled:opacity-50"
            disabled={isSubmitting}
          />
        </div>

        {/* Información de crédito */}
        <div className="space-y-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="tiene_credito"
              checked={formData.tiene_credito}
              onChange={(e) =>
                setFormData({ ...formData, tiene_credito: e.target.checked })
              }
              className="h-4 w-4 rounded border-gray-300 text-brand-red focus:ring-brand-red"
              disabled={isSubmitting}
            />
            <label htmlFor="tiene_credito" className="text-sm font-medium text-neutral-700">
              Este cliente tiene línea de crédito
            </label>
          </div>

          {formData.tiene_credito && (
            <div className="grid gap-4 md:grid-cols-2">
              <TextField
                label="Límite de Crédito"
                tone="light"
                type="number"
                placeholder="0.00"
                value={formData.limite_credito}
                onChange={(e) =>
                  setFormData({ ...formData, limite_credito: parseFloat(e.target.value) || 0 })
                }
                error={errors.limite_credito}
                disabled={isSubmitting}
              />

              <TextField
                label="Días de Plazo"
                tone="light"
                type="number"
                placeholder="30"
                value={formData.dias_plazo}
                onChange={(e) =>
                  setFormData({ ...formData, dias_plazo: parseInt(e.target.value) || 0 })
                }
                disabled={isSubmitting}
              />
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button
            type="button"
            onClick={handleClose}
            className="bg-neutral-200 text-neutral-700 hover:bg-neutral-300"
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            className="bg-brand-red text-white hover:bg-brand-red/90 disabled:opacity-50"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Creando...' : 'Crear cliente'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
