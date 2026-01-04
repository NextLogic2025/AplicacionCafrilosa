import { useEffect, useState } from 'react'
import { Modal } from 'components/ui/Modal'
import { Alert } from 'components/ui/Alert'
import { Button } from 'components/ui/Button'
import {
  crearCliente,
  actualizarCliente,
  obtenerZonas,
  obtenerListasPrecios,
  type ZonaComercial,
  type ListaPrecio,
} from '../../services/clientesApi'
import {
  createUsuario,
} from '../../services/usuariosApi'
import {
  ClienteForm,
  CLIENTE_FORM_DEFAULT,
  validateClienteForm,
  type ClienteFormValues,
  type ZonaOption,
  type ListaPrecioOption,
} from 'components/ui/ClienteForm'

interface CrearClienteModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  initialData?: Partial<ClienteFormValues> & { id?: string; usuario_principal_id?: string | null }
  mode?: 'create' | 'edit'
}
export function CrearClienteModal({ isOpen, onClose, onSuccess, initialData, mode = 'create' }: CrearClienteModalProps) {
  const [formData, setFormData] = useState<ClienteFormValues>({ ...CLIENTE_FORM_DEFAULT, ...initialData })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isCatalogLoading, setIsCatalogLoading] = useState(false)
  const [zonas, setZonas] = useState<ZonaOption[]>([])
  const [listasPrecios, setListasPrecios] = useState<ListaPrecioOption[]>([])
  const [submitMessage, setSubmitMessage] = useState<{
    type: 'success' | 'error'
    message: string
  } | null>(null)

  useEffect(() => {
    if (isOpen) {
      setFormData({
        ...CLIENTE_FORM_DEFAULT,
        ...initialData,
        limite_credito:
          typeof initialData?.limite_credito === 'string'
            ? parseFloat(initialData.limite_credito) || 0
            : initialData?.limite_credito ?? 0,
        dias_plazo: initialData?.dias_plazo ?? 0,
        tiene_credito: initialData?.tiene_credito ?? false,
        identificacion: initialData?.identificacion ?? '',
        tipo_identificacion: initialData?.tipo_identificacion ?? 'RUC',
        razon_social: initialData?.razon_social ?? '',
        nombre_comercial: initialData?.nombre_comercial ?? '',
        direccion_texto: initialData?.direccion_texto ?? '',
        contacto_nombre: initialData?.contacto_nombre ?? '',
        contacto_email: initialData?.contacto_email ?? '',
        contacto_password: '',
        lista_precios_id:
          typeof initialData?.lista_precios_id === 'string'
            ? parseInt(initialData.lista_precios_id, 10)
            : initialData?.lista_precios_id ?? null,
        zona_comercial_id:
          typeof initialData?.zona_comercial_id === 'string'
            ? parseInt(initialData.zona_comercial_id, 10)
            : initialData?.zona_comercial_id ?? null,
      })
      setErrors({})
      setSubmitMessage(null)

      const loadCatalog = async () => {
        try {
          setIsCatalogLoading(true)
          const [zRes, lRes] = await Promise.all([
            obtenerZonas().catch(() => []),
            obtenerListasPrecios().catch(() => []),
          ])
          setZonas(zRes)
          setListasPrecios(lRes)
        } finally {
          setIsCatalogLoading(false)
        }
      }

      loadCatalog()

    }
  }, [isOpen, initialData])

  const validateForm = (): boolean => {
    const newErrors = validateClienteForm(formData, mode)
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleClose = () => {
    setFormData({ ...CLIENTE_FORM_DEFAULT, ...initialData })
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
      let usuarioId = initialData?.usuario_principal_id ?? null

      if (mode === 'create') {
        // Solo crear usuario si estamos en modo crear o no hay usuario asignado
        if (!usuarioId) {
          const usuario = await createUsuario({
            nombre: formData.contacto_nombre,
            email: formData.contacto_email,
            password: formData.contacto_password,
            rolId: 6,
          })
          usuarioId = usuario.id.toString()
        }

        await crearCliente({
          identificacion: formData.identificacion,
          tipo_identificacion: formData.tipo_identificacion,
          razon_social: formData.razon_social,
          nombre_comercial: formData.nombre_comercial || undefined,
          usuario_principal_id: usuarioId,
          lista_precios_id: formData.lista_precios_id,
          zona_comercial_id: formData.zona_comercial_id,
          tiene_credito: formData.tiene_credito,
          limite_credito: formData.tiene_credito ? formData.limite_credito : 0,
          dias_plazo: formData.tiene_credito ? formData.dias_plazo : 0,
          direccion_texto: formData.direccion_texto || undefined,
        })
      } else if (initialData?.id) {
        // En modo edición, solo actualizar el cliente (no el usuario)
        await actualizarCliente(initialData.id, {
          identificacion: formData.identificacion,
          tipo_identificacion: formData.tipo_identificacion,
          razon_social: formData.razon_social,
          nombre_comercial: formData.nombre_comercial || undefined,
          usuario_principal_id: usuarioId,
          lista_precios_id: formData.lista_precios_id,
          zona_comercial_id: formData.zona_comercial_id,
          tiene_credito: formData.tiene_credito,
          limite_credito: formData.tiene_credito ? formData.limite_credito : 0,
          dias_plazo: formData.tiene_credito ? formData.dias_plazo : 0,
          direccion_texto: formData.direccion_texto || undefined,
        })
      } else {
        throw new Error('No se pudo identificar el cliente a actualizar')
      }

      setSubmitMessage({
        type: 'success',
        message: mode === 'create' ? 'Cliente creado exitosamente' : 'Cliente guardado',
      })

      setTimeout(() => {
        handleClose()
        onSuccess()
      }, 1200)
    } catch (error: any) {
      setSubmitMessage({
        type: 'error',
        message: error.message || 'Error al guardar el cliente',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      title={mode === 'create' ? 'Crear Cliente' : 'Editar Cliente'}
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
        <ClienteForm
          value={formData}
          errors={errors}
          mode={mode}
          isSubmitting={isSubmitting}
          isCatalogLoading={isCatalogLoading}
          zonas={zonas}
          listasPrecios={listasPrecios}
          onChange={setFormData}
        />

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
            {isSubmitting ? 'Guardando...' : mode === 'create' ? 'Crear cliente' : 'Guardar cambios'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
