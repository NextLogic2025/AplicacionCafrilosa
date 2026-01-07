import { useState, useEffect } from 'react'
import { Modal } from 'components/ui/Modal'
import { TextField } from 'components/ui/TextField'
import { Alert } from 'components/ui/Alert'
import { Button } from 'components/ui/Button'
import { createUsuario, updateUsuario, type Usuario } from '../../services/usuariosApi'

const ROLES = [
  { id: 2, nombre: 'Supervisor' },
  { id: 3, nombre: 'Bodeguero' },
  { id: 4, nombre: 'Vendedor' },
  { id: 5, nombre: 'Transportista' },
]

const INITIAL_FORM_STATE = {
  nombre: '',
  email: '',
  password: '',
  rolId: 4,
}

interface CrearUsuarioModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  initialData?: Usuario | null
  mode?: 'create' | 'edit'
}

export function CrearUsuarioModal({ isOpen, onClose, onSuccess, initialData, mode = 'create' }: CrearUsuarioModalProps) {
  const [formData, setFormData] = useState(INITIAL_FORM_STATE)

  useEffect(() => {
    if (isOpen && initialData && mode === 'edit') {
      setFormData({
        nombre: initialData.nombre || '',
        email: initialData.email || '',
        password: '',
        rolId: initialData.rol?.id || 4,
      })
    } else if (isOpen && mode === 'create') {
      setFormData(INITIAL_FORM_STATE)
    }
  }, [isOpen, initialData, mode])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitMessage, setSubmitMessage] = useState<{
    type: 'success' | 'error'
    message: string
  } | null>(null)

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.nombre.trim()) {
      newErrors.nombre = 'El nombre es requerido'
    }

    if (!formData.email.trim()) {
      newErrors.email = 'El email es requerido'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email inválido'
    }

    if (mode === 'create' && !formData.password) {
      newErrors.password = 'La contraseña es requerida'
    } else if (formData.password && formData.password.length < 6) {
      newErrors.password = 'La contraseña debe tener al menos 6 caracteres'
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
      if (mode === 'edit' && initialData) {
        const updatePayload: any = {
          nombre: formData.nombre,
          rolId: formData.rolId,
        }
        if (formData.password && formData.password.trim()) {
          updatePayload.password = formData.password
        }
        await updateUsuario(initialData.id, updatePayload)
        setSubmitMessage({
          type: 'success',
          message: 'Usuario actualizado exitosamente',
        })
      } else {
        await createUsuario({
          nombre: formData.nombre,
          email: formData.email,
          password: formData.password,
          rolId: formData.rolId,
        })
        setSubmitMessage({
          type: 'success',
          message: 'Usuario creado exitosamente',
        })
      }

      setTimeout(() => {
        handleClose()
        onSuccess()
      }, 1500)
    } catch (error: any) {
      setSubmitMessage({
        type: 'error',
        message: error.message || 'Error al guardar el usuario',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      title={mode === 'edit' ? 'Editar Usuario' : 'Crear Usuario'}
      onClose={handleClose}
      headerGradient="red"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {submitMessage && (
          <Alert
            type={submitMessage.type}
            message={submitMessage.message}
            onClose={() => setSubmitMessage(null)}
          />
        )}

        <TextField
          label="Nombre completo"
          tone="light"
          type="text"
          placeholder="Ej: Juan Pérez"
          value={formData.nombre}
          onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
          error={errors.nombre}
          disabled={isSubmitting}
        />

        <TextField
          label="Correo electrónico"
          tone="light"
          type="email"
          placeholder="ejemplo@correo.com"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          error={errors.email}
          disabled={isSubmitting || mode === 'edit'}
        />

        <TextField
          label={mode === 'edit' ? 'Nueva contraseña (opcional)' : 'Contraseña'}
          tone="light"
          type="password"
          placeholder={mode === 'edit' ? 'Dejar vacío para no cambiar' : 'Mínimo 6 caracteres'}
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          error={errors.password}
          disabled={isSubmitting}
        />

        <div className="grid gap-2">
          <label className="text-xs text-neutral-600">Rol</label>
          <select
            value={formData.rolId}
            onChange={(e) => setFormData({ ...formData, rolId: Number(e.target.value) })}
            className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-neutral-900 outline-none transition focus:border-brand-red/60 focus:shadow-[0_0_0_4px_rgba(240,65,45,0.18)] disabled:opacity-50"
            disabled={isSubmitting}
          >
            {ROLES.map((rol) => (
              <option key={rol.id} value={rol.id}>
                {rol.nombre}
              </option>
            ))}
          </select>
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
            {isSubmitting ? (mode === 'edit' ? 'Guardando...' : 'Creando...') : (mode === 'edit' ? 'Guardar cambios' : 'Crear usuario')}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
