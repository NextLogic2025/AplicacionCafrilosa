import { CampaniaFormModal } from '../../../components/CampaniaFormModal'
import type { Campania, CreateCampaniaDto } from '../../../services/promocionesApi'
import type { ListaPrecio } from '../../../services/clientesApi'

interface PromocionesFormProps {
  isOpen: boolean
  editingCampania: Campania | null
  formData: CreateCampaniaDto
  listasPrecios: ListaPrecio[]
  isSubmitting?: boolean
  onChange: (data: CreateCampaniaDto) => void
  onSubmit: (e: React.FormEvent) => void
  onClose: () => void
  onManageProducts?: () => void
}

export function PromocionesForm({
  isOpen,
  editingCampania,
  formData,
  listasPrecios,
  isSubmitting = false,
  onChange,
  onSubmit,
  onClose,
  onManageProducts,
}: PromocionesFormProps) {
  return (
    <CampaniaFormModal
      isOpen={isOpen}
      editingCampania={editingCampania}
      formData={formData}
      listasPrecios={listasPrecios}
      onChange={onChange}
      onSubmit={onSubmit}
      onClose={onClose}
      onManageProducts={onManageProducts}
    />
  )
}
