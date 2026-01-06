import { useEffect, useState } from 'react'
import { Modal } from 'components/ui/Modal'
import { Alert } from 'components/ui/Alert'
import { Button } from 'components/ui/Button'
import { Check } from 'lucide-react'
import {
  crearCliente,
  actualizarCliente,
  obtenerZonas,
  obtenerListasPrecios,
  type ZonaComercial,
  type ListaPrecio,
} from '../../services/clientesApi'
import {
  crearSucursal,
} from '../../services/sucursalesApi'
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

type Step = 1 | 2 | 3

export function CrearClienteModal({ isOpen, onClose, onSuccess, initialData, mode = 'create' }: CrearClienteModalProps) {
  console.log('CrearClienteModal renderizado - isOpen:', isOpen, 'mode:', mode)
  
  const [currentStep, setCurrentStep] = useState<Step>(1)
  const [formData, setFormData] = useState<ClienteFormValues>({ ...CLIENTE_FORM_DEFAULT, ...initialData })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isCatalogLoading, setIsCatalogLoading] = useState(false)
  const [zonas, setZonas] = useState<ZonaOption[]>([])
  const [listasPrecios, setListasPrecios] = useState<ListaPrecioOption[]>([])
  const [sucursalesTemp, setSucursalesTemp] = useState<Array<{
    id?: string
    nombre_sucursal: string
    direccion_entrega?: string
    contacto_nombre?: string
    contacto_telefono?: string
  }>>([])
  const [submitMessage, setSubmitMessage] = useState<{
    type: 'success' | 'error'
    message: string
  } | null>(null)
  const [canSubmit, setCanSubmit] = useState(false)

  useEffect(() => {
    console.log('useEffect ejecutado - isOpen:', isOpen, 'initialData:', initialData)
    if (isOpen) {
      setCurrentStep(1)
      setSucursalesTemp([])
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
        latitud: initialData?.latitud ?? null,
        longitud: initialData?.longitud ?? null,
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
    setCurrentStep(1)
    setFormData({ ...CLIENTE_FORM_DEFAULT, ...initialData })
    setErrors({})
    setSubmitMessage(null)
    setSucursalesTemp([])
    onClose()
  }

  const handleNext = () => {
    console.log('➡️ handleNext ejecutado - Paso actual:', currentStep)
    // Limpiar mensaje de submit al cambiar de paso
    setSubmitMessage(null)
    
    if (currentStep === 1) {
      const step1Fields = ['contacto_nombre', 'contacto_email', 'contacto_password', 'identificacion', 'razon_social', 'tipo_identificacion']
      const step1Errors: Record<string, string> = {}
      const allErrors = validateClienteForm(formData, mode)
      
      step1Fields.forEach((field) => {
        if (allErrors[field]) step1Errors[field] = allErrors[field]
      })

      if (Object.keys(step1Errors).length > 0) {
        setErrors(step1Errors)
        return
      }
      setErrors({})
      setCurrentStep(2)
    } else if (currentStep === 2) {
      // No validar nada en paso 2, solo avanzar
      setErrors({})
      setCurrentStep(3)
    }
  }

  const handleBack = () => {
    // Limpiar mensajes y errores al retroceder
    setSubmitMessage(null)
    setErrors({})
    
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as Step)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log('🔴 handleSubmit ejecutado - Paso actual:', currentStep, 'canSubmit:', canSubmit)
    
    // Bloquear submit si no es intencional
    if (!canSubmit || currentStep !== 3) {
      console.log('⚠️ Submit bloqueado - canSubmit:', canSubmit, 'currentStep:', currentStep)
      setCanSubmit(false) // Resetear flag
      return
    }
    
    setCanSubmit(false) // Resetear flag después de verificar
    
    setSubmitMessage(null)

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)

    try {
      let usuarioId = initialData?.usuario_principal_id ?? null
      let clienteId = initialData?.id ?? null

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

        const nuevoCliente = await crearCliente({
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
          latitud: formData.latitud ?? undefined,
          longitud: formData.longitud ?? undefined,
        })
        clienteId = nuevoCliente.id
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
          latitud: formData.latitud ?? undefined,
          longitud: formData.longitud ?? undefined,
        })
      } else {
        throw new Error('No se pudo identificar el cliente a actualizar')
      }

      // Crear sucursales si las hay
      if (clienteId && sucursalesTemp.length > 0) {
        await Promise.all(
          sucursalesTemp.map((sucursal) =>
            crearSucursal(clienteId, {
              cliente_id: clienteId,
              nombre_sucursal: sucursal.nombre_sucursal,
              direccion_entrega: sucursal.direccion_entrega,
              contacto_nombre: sucursal.contacto_nombre,
              contacto_telefono: sucursal.contacto_telefono,
              activo: true,
            })
          )
        )
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

  // No renderizar nada si el modal no está abierto (ahorra recursos)
  if (!isOpen) {
    return null
  }

  return (
    <Modal
      isOpen={isOpen}
      title={mode === 'create' ? 'Crear Cliente' : 'Editar Cliente'}
      onClose={handleClose}
      headerGradient="red"
      maxWidth="lg"
    >
      {/* Progress Steps */}
      <div className="mb-6 flex items-center justify-between">
        {[1, 2, 3].map((step) => {
          const isCompleted = step < currentStep
          const isCurrent = step === currentStep
          return (
            <div key={step} className="flex flex-1 items-center">
              <div className="flex flex-col items-center">
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-full border-2 font-bold transition ${
                    isCompleted
                      ? 'border-brand-red bg-brand-red text-white'
                      : isCurrent
                      ? 'border-brand-red bg-white text-brand-red'
                      : 'border-gray-300 bg-white text-gray-400'
                  }`}
                >
                  {isCompleted ? <Check className="h-6 w-6" /> : step}
                </div>
                <span
                  className={`mt-2 text-xs font-semibold ${
                    isCurrent ? 'text-gray-900' : 'text-gray-400'
                  }`}
                >
                  {step === 1 ? 'Datos' : step === 2 ? 'Dirección' : 'Sucursales'}
                </span>
              </div>
              {step < 3 && (
                <div
                  className={`mx-2 h-0.5 flex-1 ${
                    step < currentStep ? 'bg-brand-red' : 'bg-gray-300'
                  }`}
                />
              )}
            </div>
          )
        })}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {submitMessage && (
          <Alert
            type={submitMessage.type}
            message={submitMessage.message}
            onClose={() => setSubmitMessage(null)}
          />
        )}

        {/* Step 1: Datos */}
        {currentStep === 1 && (
          <ClienteForm
            value={formData}
            errors={errors}
            mode={mode}
            isSubmitting={isSubmitting}
            isCatalogLoading={isCatalogLoading}
            zonas={zonas}
            listasPrecios={listasPrecios}
            onChange={setFormData}
            step={1}
          />
        )}

        {/* Step 2: Ubicación */}
        {currentStep === 2 && (
          <ClienteForm
            value={formData}
            errors={errors}
            mode={mode}
            isSubmitting={isSubmitting}
            isCatalogLoading={isCatalogLoading}
            zonas={zonas}
            listasPrecios={listasPrecios}
            onChange={setFormData}
            step={2}
          />
        )}

        {/* Step 3: Sucursales */}
        {currentStep === 3 && (
          <SucursalesStep
            sucursales={sucursalesTemp}
            onAddSucursal={(sucursal) => setSucursalesTemp([...sucursalesTemp, sucursal])}
            onRemoveSucursal={(index) => setSucursalesTemp(sucursalesTemp.filter((_, i) => i !== index))}
            onUpdateSucursal={(index, sucursal) => {
              const updated = [...sucursalesTemp]
              updated[index] = sucursal
              setSucursalesTemp(updated)
            }}
          />
        )}

        <div className="flex justify-between gap-3 pt-4 border-t">
          {currentStep > 1 && (
            <Button
              type="button"
              onClick={handleBack}
              className="bg-neutral-200 text-neutral-700 hover:bg-neutral-300"
              disabled={isSubmitting}
            >
              Atrás
            </Button>
          )}
          <div className="flex-1" />
          {currentStep < 3 ? (
            <Button
              type="button"
              onClick={handleNext}
              className="bg-brand-red text-white hover:bg-brand-red/90"
            >
              Siguiente: {currentStep === 1 ? 'Dirección' : 'Sucursales'}
            </Button>
          ) : (
            <Button
              type="submit"
              onClick={() => setCanSubmit(true)}
              className="bg-brand-red text-white hover:bg-brand-red/90 disabled:opacity-50"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Guardando...' : 'Finalizar y Guardar'}
            </Button>
          )}
        </div>
      </form>
    </Modal>
  )
}

// Componente para el paso 3: Gestión de sucursales
interface SucursalesStepProps {
  sucursales: Array<{
    id?: string
    nombre_sucursal: string
    direccion_entrega?: string
    contacto_nombre?: string
    contacto_telefono?: string
  }>
  onAddSucursal: (sucursal: { nombre_sucursal: string; direccion_entrega?: string; contacto_nombre?: string; contacto_telefono?: string }) => void
  onRemoveSucursal: (index: number) => void
  onUpdateSucursal: (index: number, sucursal: any) => void
}

function SucursalesStep({ sucursales, onAddSucursal, onRemoveSucursal, onUpdateSucursal }: SucursalesStepProps) {
  const [newSucursal, setNewSucursal] = useState({
    nombre_sucursal: '',
    direccion_entrega: '',
    contacto_nombre: '',
    contacto_telefono: '',
  })
  const [editingIndex, setEditingIndex] = useState<number | null>(null)

  const handleAddSucursal = () => {
    if (!newSucursal.nombre_sucursal.trim()) return
    onAddSucursal(newSucursal)
    setNewSucursal({
      nombre_sucursal: '',
      direccion_entrega: '',
      contacto_nombre: '',
      contacto_telefono: '',
    })
  }

  return (
    <div className="space-y-4">
      {/* Agregar nueva sucursal */}
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <h3 className="text-sm font-semibold text-gray-800 mb-4">Agregar Sucursal Adicional (Opcional)</h3>
        
        <div className="space-y-3">
          <input
            type="text"
            placeholder="Nombre de la sucursal"
            value={newSucursal.nombre_sucursal}
            onChange={(e) => setNewSucursal({ ...newSucursal, nombre_sucursal: e.target.value })}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-red focus:ring-2 focus:ring-brand-red/20"
          />
          
          <input
            type="text"
            placeholder="Dirección (opcional)"
            value={newSucursal.direccion_entrega}
            onChange={(e) => setNewSucursal({ ...newSucursal, direccion_entrega: e.target.value })}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-red focus:ring-2 focus:ring-brand-red/20"
          />
          
          <div className="grid grid-cols-2 gap-3">
            <input
              type="text"
              placeholder="Contacto (opcional)"
              value={newSucursal.contacto_nombre}
              onChange={(e) => setNewSucursal({ ...newSucursal, contacto_nombre: e.target.value })}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-red focus:ring-2 focus:ring-brand-red/20"
            />
            
            <input
              type="tel"
              placeholder="Teléfono (opcional)"
              value={newSucursal.contacto_telefono}
              onChange={(e) => setNewSucursal({ ...newSucursal, contacto_telefono: e.target.value })}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-red focus:ring-2 focus:ring-brand-red/20"
            />
          </div>
          
          <button
            type="button"
            onClick={handleAddSucursal}
            disabled={!newSucursal.nombre_sucursal.trim()}
            className="w-full rounded-lg bg-brand-red text-white px-4 py-2 font-medium hover:bg-brand-red/90 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            + Agregar Sucursal
          </button>
        </div>
      </div>

      {/* Lista de sucursales */}
      {sucursales.length > 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <h3 className="text-sm font-semibold text-gray-800 mb-3">Sucursales Agregadas ({sucursales.length})</h3>
          
          <div className="space-y-2">
            {sucursales.map((sucursal, index) => (
              <div key={index} className="flex items-start justify-between rounded-lg border border-gray-200 bg-gray-50 p-3">
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{sucursal.nombre_sucursal}</p>
                  {sucursal.direccion_entrega && (
                    <p className="text-xs text-gray-600">📍 {sucursal.direccion_entrega}</p>
                  )}
                  {sucursal.contacto_nombre && (
                    <p className="text-xs text-gray-600">👤 {sucursal.contacto_nombre}</p>
                  )}
                  {sucursal.contacto_telefono && (
                    <p className="text-xs text-gray-600">📞 {sucursal.contacto_telefono}</p>
                  )}
                </div>
                
                <button
                  type="button"
                  onClick={() => onRemoveSucursal(index)}
                  className="ml-2 text-red-500 hover:text-red-700 text-sm font-medium"
                >
                  Eliminar
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-6 text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          <h4 className="mt-3 text-sm font-medium text-gray-900">Sin Sucursales</h4>
          <p className="mt-1 text-xs text-gray-600">Este paso es opcional. Puedes agregar sucursales ahora o finalizarsin ellas.</p>
        </div>
      )}
    </div>
  )
}
