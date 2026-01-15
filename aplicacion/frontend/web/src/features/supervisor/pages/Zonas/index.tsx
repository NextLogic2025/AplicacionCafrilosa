import { useState } from 'react'
import { PlusCircle, MapPin, RefreshCcw, Map } from 'lucide-react'
import { PageHero } from 'components/ui/PageHero'
import { SectionHeader } from 'components/ui/SectionHeader'
import { Alert } from 'components/ui/Alert'
import { Modal } from 'components/ui/Modal'
import { LoadingSpinner } from 'components/ui/LoadingSpinner'
import { type ZonaComercial, type CreateZonaDto } from '../../services/zonasApi'
import { useZonas } from '../../services/useZonas'
import { ZonasTable } from './ZonasTable'
import { CrearZonaForm } from './CrearZonaForm'
import { ZonaDetailModal } from './ZonaDetailModal'
import { MapaGeneralModal } from './MapaGeneralModal'

type ModalMode = 'crear' | 'editar'

export default function ZonasPage() {
  const { zonas, vendedores, isLoading, error, loadZonas, crearZonaConVendedor, actualizarZonaConVendedor, toggleEstadoZona } = useZonas()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<ModalMode>('crear')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitMessage, setSubmitMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [vendedorSeleccionado, setVendedorSeleccionado] = useState<string>('')
  const [zonaEditando, setZonaEditando] = useState<ZonaComercial | null>(null)
  const [zonaDetalle, setZonaDetalle] = useState<ZonaComercial | null>(null)
  const [isMapaGeneralOpen, setIsMapaGeneralOpen] = useState(false)

  // Estado para notificaciones toast globales
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const emptyForm: CreateZonaDto = {
    codigo: '',
    nombre: '',
    ciudad: '',
    macrorregion: '',
    poligono_geografico: null,
  }

  const handleOpenDetalle = (zona: ZonaComercial) => {
    setZonaDetalle(zona)
  }

  const handleCloseDetalle = () => setZonaDetalle(null)

  const [formData, setFormData] = useState<CreateZonaDto>(emptyForm)

  const handleOpenModalCrear = () => {
    setModalMode('crear')
    setZonaEditando(null)
    setIsModalOpen(true)
    setFormErrors({})
    setSubmitMessage(null)
    setVendedorSeleccionado('')
    setFormData(emptyForm)
  }

  const handleOpenModalEditar = (zona: ZonaComercial) => {
    setModalMode('editar')
    setZonaEditando(zona)
    setIsModalOpen(true)
    setFormErrors({})
    setSubmitMessage(null)
    setVendedorSeleccionado(zona.vendedor_asignado?.vendedor_usuario_id || '')
    setFormData({
      codigo: zona.codigo,
      nombre: zona.nombre,
      ciudad: zona.ciudad || '',
      macrorregion: zona.macrorregion || '',
      poligono_geografico: zona.poligono_geografico ?? null,
    })
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setZonaEditando(null)
    setFormErrors({})
    setSubmitMessage(null)
    setVendedorSeleccionado('')
    setFormData(emptyForm)
  }

  const handleToggleEstado = async (zona: ZonaComercial) => {
    setIsSubmitting(true)
    try {
      await toggleEstadoZona(zona)
      await loadZonas()
    } catch (err: any) {
      alert(err?.message ?? 'No se pudo cambiar el estado de la zona')
    } finally {
      setIsSubmitting(false)
    }
  }

  const validateForm = () => {
    const errors: Record<string, string> = {}
    if (!formData.codigo.trim()) errors.codigo = 'El código es requerido'
    if (!formData.nombre.trim()) errors.nombre = 'El nombre es requerido'
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitMessage(null)

    if (!validateForm()) return

    setIsSubmitting(true)

    try {
      if (modalMode === 'crear') {
        await crearZonaConVendedor(formData, vendedorSeleccionado || undefined)
        setSubmitMessage({ type: 'success', message: 'Zona creada correctamente' })
        // Mostrar toast global
        setToast({ type: 'success', message: '¡Zona creada con éxito!' })
        setTimeout(() => setToast(null), 3000)
      } else if (zonaEditando) {
        await actualizarZonaConVendedor(
          zonaEditando.id,
          formData,
          vendedorSeleccionado || undefined,
          zonaEditando.vendedor_asignado?.id
        )
        // Espera un breve tiempo para asegurar que el backend actualice la asignación
        setTimeout(() => {
          loadZonas();
        }, 400);
        setSubmitMessage({ type: 'success', message: 'Zona actualizada correctamente' })
        // Mostrar toast global
        setToast({ type: 'success', message: '¡Zona actualizada con éxito!' })
        setTimeout(() => setToast(null), 3000)
      }
      await loadZonas()
      setTimeout(() => handleCloseModal(), 1000)
    } catch (err: any) {
      setSubmitMessage({ type: 'error', message: err?.message ?? 'No se pudo guardar la zona' })
      // Mostrar toast de error
      setToast({ type: 'error', message: 'Error al guardar la zona' })
      setTimeout(() => setToast(null), 3000)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHero
        title="Zonas"
        subtitle="Gestiona las zonas comerciales y asignaciones"
        chips={["Logística", "Zonas", "Cobertura"]}
      />

      <SectionHeader
        title="Zonas comerciales"
        subtitle="Define las zonas de cobertura y asigna vendedores"
      />

      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm text-gray-600">Agrupa pedidos y clientes por zonas para planificar mejor la distribución.</p>
          <p className="text-xs text-gray-500">Total zonas: {zonas.length}</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setIsMapaGeneralOpen(true)}
            className="inline-flex items-center justify-center rounded-xl px-4 py-3 font-extrabold transition bg-indigo-600 text-white hover:bg-indigo-700"
          >
            <Map className="mr-2 h-4 w-4" />
            Ver mapa general
          </button>
          <button
            type="button"
            onClick={loadZonas}
            className="inline-flex items-center justify-center rounded-xl px-4 py-3 font-extrabold transition bg-white text-brand-red border border-brand-red hover:bg-brand-red/5"
          >
            <RefreshCcw className="mr-2 h-4 w-4" />
            Actualizar
          </button>
          <button
            type="button"
            onClick={handleOpenModalCrear}
            className="inline-flex items-center justify-center rounded-xl px-4 py-3 font-extrabold transition bg-brand-red text-white hover:bg-brand-red/90"
          >
            <PlusCircle className="h-4 w-4 mr-2" />
            Nueva zona
          </button>
        </div>
      </div>

      {error ? (
        <Alert type="error" message={error} />
      ) : null}

      {isLoading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner />
        </div>
      ) : zonas.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
            <MapPin className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="mt-4 text-lg font-semibold text-gray-900">No hay zonas configuradas</h3>
          <p className="mt-2 text-sm text-gray-600">Crea la primera zona para empezar a asignar vendedores.</p>
        </div>
      ) : (
        <ZonasTable zonas={zonas} onView={handleOpenDetalle} onEdit={handleOpenModalEditar} onToggleEstado={handleToggleEstado} />
      )}

      <Modal
        isOpen={isModalOpen}
        title={modalMode === 'crear' ? 'Crear zona' : 'Editar zona'}
        onClose={handleCloseModal}
        headerGradient="red"
        maxWidth="md"
      >
        <CrearZonaForm
          formData={formData}
          setFormData={setFormData}
          formErrors={formErrors}
          vendedores={vendedores}
          vendedorSeleccionado={vendedorSeleccionado}
          setVendedorSeleccionado={setVendedorSeleccionado}
          submitMessage={submitMessage}
          isSubmitting={isSubmitting}
          onSubmit={handleSubmit}
          onCancel={handleCloseModal}
          isEditing={modalMode === 'editar'}
        />
      </Modal>

      <ZonaDetailModal zona={zonaDetalle} isOpen={!!zonaDetalle} onClose={handleCloseDetalle} />
      <MapaGeneralModal zonas={zonas} isOpen={isMapaGeneralOpen} onClose={() => setIsMapaGeneralOpen(false)} />

      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 px-6 py-4 rounded-lg shadow-2xl flex items-center gap-3 z-50 ${toast.type === 'success'
              ? 'bg-green-500 text-white'
              : 'bg-red-500 text-white'
            }`}
          style={{
            animation: 'slideInRight 0.3s ease-out',
          }}
        >
          <div className="flex items-center gap-3">
            {toast.type === 'success' ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
            <span className="font-semibold">{toast.message}</span>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  )
}
