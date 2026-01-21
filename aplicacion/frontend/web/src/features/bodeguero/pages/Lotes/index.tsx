import { useState, useEffect } from 'react'
import { Package, Plus, Pencil, Trash2, RefreshCw } from 'lucide-react'
import { PageHero } from 'components/ui/PageHero'
import { GenericDataTable } from 'components/ui/GenericDataTable'
import { Button } from 'components/ui/Button'
import { Alert } from 'components/ui/Alert'
import { ConfirmDialog } from 'components/ui/ConfirmDialog'
import { StatusBadge } from 'components/ui/StatusBadge'
import { lotesApi, Lote, CreateLoteDto, UpdateLoteDto } from '../../services/lotesApi'
import { LoteFormModal } from '../../components/LoteFormModal'
import { getAllProducts, Product } from '../../../supervisor/services/productosApi'
import { getSelectedRole } from '../../../../services/storage/roleStorage'

export default function LotesPage() {
  const [lotes, setLotes] = useState<Lote[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Products map for display
  const [productsMap, setProductsMap] = useState<Record<string, Product>>({})

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedLote, setSelectedLote] = useState<Lote | null>(null)
  const [modalLoading, setModalLoading] = useState(false)

  // Delete Dialog State
  const [loteToDelete, setLoteToDelete] = useState<Lote | null>(null)

  const fetchData = async () => {
    setLoading(true)
    setError(null)
    try {
      const [lotesData, productsData] = await Promise.all([
        lotesApi.getAll(),
        getAllProducts()
      ])

      const pMap: Record<string, Product> = {}
      productsData.forEach(p => { pMap[p.id] = p })
      setProductsMap(pMap)

      setLotes(lotesData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar datos')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleCreate = () => {
    setSelectedLote(null)
    setIsModalOpen(true)
  }

  const handleEdit = (lote: Lote) => {
    setSelectedLote(lote)
    setIsModalOpen(true)
  }

  const handleDeleteClick = (lote: Lote) => {
    setLoteToDelete(lote)
  }

  const handleModalSubmit = async (data: CreateLoteDto | UpdateLoteDto) => {
    setModalLoading(true)
    try {
      if (selectedLote) {
        await lotesApi.update(selectedLote.id, data as UpdateLoteDto)
      } else {
        await lotesApi.create(data as CreateLoteDto)
      }
      setIsModalOpen(false)
      fetchData()
    } catch (err) {
      // Error handled in modal or rethrown? 
      // Ideally modal handles it or we pass setError
      throw err
    } finally {
      setModalLoading(false)
    }
  }

  const confirmDelete = async () => {
    if (!loteToDelete) return
    try {
      await lotesApi.delete(loteToDelete.id)
      setLoteToDelete(null)
      fetchData()
    } catch (err) {
      setError('Error al eliminar lote')
    }
  }

  const role = getSelectedRole()

  return (
    <div className="space-y-6">
      <PageHero
        title="Gestión de Lotes"
        subtitle="Administración de lotes, fechas de vencimiento y estado de calidad"
      />

      <div className="flex justify-end">
        <Button variant="primary" icon={Plus} onClick={handleCreate}>
          Nuevo Lote
        </Button>
      </div>

      {error && <Alert type="error" title="Error" message={error} onClose={() => setError(null)} />}

      <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-sm">
        <div className="flex justify-end mb-4">
          <Button variant="ghost" icon={RefreshCw} onClick={fetchData} title="Actualizar" />
        </div>

        <GenericDataTable
          data={lotes}
          loading={loading}
          emptyStateTitle="No hay lotes registrados"
          emptyStateDescription="Comienza registrando un nuevo lote de productos."
          columns={[
            {
              label: 'Producto',
              key: 'productoId',
              render: (val) => (
                <div className="flex flex-col">
                  <span className="font-medium text-neutral-900">{productsMap[val]?.nombre || 'Unknown'}</span>
                  <span className="text-xs text-neutral-500">{productsMap[val]?.codigo_sku || val}</span>
                </div>
              )
            },
            { label: 'Lote #', key: 'numeroLote', render: (val) => <span className="font-mono">{val}</span> },
            { label: 'Fabricación', key: 'fechaFabricacion', render: (val) => new Date(val).toLocaleDateString() },
            {
              label: 'Vencimiento',
              key: 'fechaVencimiento',
              render: (val) => {
                const date = new Date(val)
                const today = new Date()
                const isExpired = date < today
                return <span className={isExpired ? 'text-red-600 font-bold' : ''}>{date.toLocaleDateString()}</span>
              }
            },
            {
              label: 'Estado',
              key: 'estadoCalidad',
              render: (val) => {
                const map = { LIBERADO: 'success', CUARENTENA: 'warning', RECHAZADO: 'error' } as const
                return <StatusBadge variant={map[val as keyof typeof map] || 'neutral'}>{val}</StatusBadge>
              }
            },
            {
              label: 'Acciones',
              key: 'id',
              render: (_, item) => (
                <div className="flex gap-2">
                  <Button size="sm" variant="ghost" icon={Pencil} onClick={() => handleEdit(item)} />
                  {(role === 'supervisor') && (
                    <Button size="sm" variant="ghost" icon={Trash2} onClick={() => handleDeleteClick(item)} className="text-red-600 hover:bg-red-50" />
                  )}
                </div>
              )
            }
          ]}
        />
      </div>

      <LoteFormModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleModalSubmit}
        initialData={selectedLote}
        loading={modalLoading}
      />

      {loteToDelete && (
        <ConfirmDialog
          open={!!loteToDelete}
          title="Eliminar Lote"
          description={`¿Estás seguro de que deseas eliminar el lote ${loteToDelete.numeroLote}? Esta acción no se puede deshacer.`}
          confirmLabel="Eliminar"
          cancelLabel="Cancelar"
          onConfirm={confirmDelete}
          onCancel={() => setLoteToDelete(null)}
        />
      )}
    </div>
  )
}