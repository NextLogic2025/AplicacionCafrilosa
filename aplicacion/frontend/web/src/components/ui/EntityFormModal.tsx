import { useState } from 'react'
import { Modal } from './Modal'
import { TextField } from './TextField'
import { Alert } from './Alert'

export interface Field {
  name: string
  label: string
  type?: 'text' | 'number' | 'textarea' | 'select' | 'checkbox' | 'url'
  placeholder?: string
  options?: Array<{ value: string | number; label: string }>
  step?: string
  min?: string | number
  required?: boolean
}

interface EntityFormModalProps<T> {
  isOpen: boolean
  title: string
  onClose: () => void
  onSubmit: (data: T) => Promise<void>
  fields: Field[]
  initialData?: Partial<T>
  headerGradient?: 'red' | 'blue' | 'green'
  submitLabel?: string
  isEditing?: boolean
}

export function EntityFormModal<T extends Record<string, any>>({
  isOpen,
  title,
  onClose,
  onSubmit,
  fields,
  initialData = {},
  headerGradient = 'red',
  submitLabel,
  isEditing = false,
}: EntityFormModalProps<T>) {
  const [formData, setFormData] = useState<Partial<T>>(initialData)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitMessage, setSubmitMessage] = useState<{
    type: 'success' | 'error'
    message: string
  } | null>(null)

  const handleChange = (name: string, value: any) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  const validate = () => {
    const newErrors: Record<string, string> = {}
    fields.forEach((field) => {
      if (field.required && !formData[field.name]) {
        newErrors[field.name] = `${field.label} es requerido`
      }
    })
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitMessage(null)

    if (!validate()) return

    setIsSubmitting(true)
    try {
      await onSubmit(formData as T)
      setSubmitMessage({
        type: 'success',
        message: isEditing ? 'Actualizado correctamente' : 'Creado correctamente',
      })
      setTimeout(() => {
        onClose()
        setFormData({})
        setSubmitMessage(null)
      }, 1500)
    } catch (error: any) {
      setSubmitMessage({
        type: 'error',
        message: error.message || 'Error al guardar',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    onClose()
    setFormData({})
    setErrors({})
    setSubmitMessage(null)
  }

  // Actualizar formData cuando initialData cambie
  if (JSON.stringify(formData) !== JSON.stringify(initialData) && isOpen) {
    setFormData(initialData)
  }

  return (
    <Modal isOpen={isOpen} title={title} onClose={handleClose} headerGradient={headerGradient} maxWidth="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        {submitMessage && (
          <Alert
            type={submitMessage.type}
            message={submitMessage.message}
            onClose={() => setSubmitMessage(null)}
          />
        )}

        {fields.map((field) => {
          const value = formData[field.name] ?? ''

          if (field.type === 'textarea') {
            return (
              <div key={field.name} className="grid gap-2">
                <label className="text-xs text-neutral-600">{field.label}</label>
                <textarea
                  value={value}
                  onChange={(e) => handleChange(field.name, e.target.value)}
                  placeholder={field.placeholder}
                  className="min-h-[80px] w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-neutral-900 outline-none transition focus:border-brand-red/60 focus:shadow-[0_0_0_4px_rgba(240,65,45,0.18)] disabled:opacity-50"
                  disabled={isSubmitting}
                />
                {errors[field.name] && <span className="text-xs text-red-700">{errors[field.name]}</span>}
              </div>
            )
          }

          if (field.type === 'select') {
            return (
              <div key={field.name} className="grid gap-2">
                <label className="text-xs text-neutral-600">{field.label}</label>
                <select
                  value={value}
                  onChange={(e) => handleChange(field.name, e.target.value)}
                  className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-neutral-900 outline-none transition focus:border-brand-red/60 focus:shadow-[0_0_0_4px_rgba(240,65,45,0.18)] disabled:opacity-50"
                  disabled={isSubmitting}
                >
                  <option value="">Selecciona una opción</option>
                  {field.options?.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                {errors[field.name] && <span className="text-xs text-red-700">{errors[field.name]}</span>}
              </div>
            )
          }

          if (field.type === 'checkbox') {
            return (
              <div key={field.name} className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id={field.name}
                  checked={!!value}
                  onChange={(e) => handleChange(field.name, e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-brand-red focus:ring-brand-red"
                  disabled={isSubmitting}
                />
                <label htmlFor={field.name} className="text-sm text-neutral-700">
                  {field.label}
                </label>
              </div>
            )
          }

          return (
            <TextField
              key={field.name}
              label={field.label}
              tone="light"
              type={field.type || 'text'}
              placeholder={field.placeholder}
              value={value}
              onChange={(e) => {
                const val = field.type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value
                handleChange(field.name, val)
              }}
              error={errors[field.name]}
              disabled={isSubmitting}
              step={field.step}
              min={field.min}
            />
          )
        })}

        <div className="flex justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 rounded-lg text-neutral-700 bg-neutral-200 hover:bg-neutral-300 transition disabled:opacity-50"
            disabled={isSubmitting}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="px-4 py-2 rounded-lg bg-brand-red text-white hover:bg-brand-red/90 transition disabled:opacity-50 font-semibold"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Guardando...' : submitLabel || (isEditing ? 'Actualizar' : 'Crear')}
          </button>
        </div>
      </form>
    </Modal>
  )
}
