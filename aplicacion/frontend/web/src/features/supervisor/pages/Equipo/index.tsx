import { TrendingUp, UserPlus } from 'lucide-react'
import { SectionHeader } from 'components/ui/SectionHeader'
import { EmptyContent } from 'components/ui/EmptyContent'
import { PageHero } from 'components/ui/PageHero'
import { Button } from 'components/ui/Button'
import { Modal } from 'components/ui/Modal'
import { TextField } from 'components/ui/TextField'
import { Alert } from 'components/ui/Alert'
import { useState } from 'react'
import { createUsuario } from '../../services/usuariosApi'

const ROLES = [
  { id: 2, nombre: 'Supervisor' },
  { id: 3, nombre: 'Bodeguero' },
  { id: 4, nombre: 'Vendedor' },
  { id: 5, nombre: 'Transportista' },
]

export default function EquipoPage() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    password: '',
    rolId: 4, // Vendedor por defecto
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitMessage, setSubmitMessage] = useState<{
    type: 'success' | 'error'
    message: string
  } | null>(null)

  const handleOpenModal = () => {
    setIsModalOpen(true)
    setFormData({ nombre: '', email: '', password: '', rolId: 4 })
    setErrors({})
    setSubmitMessage(null)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setFormData({ nombre: '', email: '', password: '', rolId: 4 })
    setErrors({})
    setSubmitMessage(null)
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.nombre.trim()) {
      newErrors.nombre = 'El nombre es requerido'
    }

    if (!formData.email.trim()) {
      newErrors.email = 'El email es requerido'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email inválido'
    }

    if (!formData.password) {
      newErrors.password = 'La contraseña es requerida'
    } else if (formData.password.length < 6) {
      newErrors.password = 'La contraseña debe tener al menos 6 caracteres'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitMessage(null)

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)

    try {
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

      // Limpiar formulario después de 2 segundos y cerrar modal
      setTimeout(() => {
        handleCloseModal()
      }, 2000)
    } catch (error: any) {
      setSubmitMessage({
        type: 'error',
        message: error.response?.data?.message || 'Error al crear el usuario',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHero
        title="Gestión de Equipo"
        subtitle="Administra todos los miembros del equipo: supervisores, vendedores, bodegueros y transportistas"
        chips={[
          'Todos los roles',
          'Gestión centralizada',
          'Creación de usuarios',
        ]}
      />

      <SectionHeader
        title="Equipo"
        subtitle="Supervisores, vendedores, bodegueros y transportistas"
      />

      <div className="flex justify-end">
        <Button
          onClick={handleOpenModal}
          className="flex items-center gap-2 bg-brand-red text-white hover:bg-brand-red/90"
        >
          <UserPlus className="h-4 w-4" />
          Crear usuario
        </Button>
      </div>

      <EmptyContent
        icon={TrendingUp}
        title="Sin datos aún"
        subtitle="Vista preparada para mostrar todos los usuarios del equipo: supervisores, vendedores, bodegueros y transportistas."
      />

      <Modal
        isOpen={isModalOpen}
        title="Crear Usuario"
        onClose={handleCloseModal}
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
            onChange={(e) =>
              setFormData({ ...formData, nombre: e.target.value })
            }
            error={errors.nombre}
            disabled={isSubmitting}
          />

          <TextField
            label="Correo electrónico"
            tone="light"
            type="email"
            placeholder="ejemplo@correo.com"
            value={formData.email}
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
            error={errors.email}
            disabled={isSubmitting}
          />

          <TextField
            label="Contraseña"
            tone="light"
            type="password"
            placeholder="Mínimo 6 caracteres"
            value={formData.password}
            onChange={(e) =>
              setFormData({ ...formData, password: e.target.value })
            }
            error={errors.password}
            disabled={isSubmitting}
          />

          <div className="grid gap-2">
            <label className="text-xs text-neutral-600">Rol</label>
            <select
              value={formData.rolId}
              onChange={(e) =>
                setFormData({ ...formData, rolId: Number(e.target.value) })
              }
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
              onClick={handleCloseModal}
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
              {isSubmitting ? 'Creando...' : 'Crear usuario'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
