import { EntityFormModal, type Field } from '../../../../../components/ui/EntityFormModal'
import type { Category, CreateCategoryDto } from '../../../services/catalogApi'

interface CategoriaFormModalProps {
  isOpen: boolean
  onClose: () => void
  initialData?: Category
  onSubmit: (data: CreateCategoryDto) => Promise<void>
  isEditing: boolean
}

const fields: Field[] = [
  { name: 'nombre', label: 'Nombre de la categoría', required: true, placeholder: 'Ej: Embutidos' },
  { name: 'descripcion', label: 'Descripción', type: 'textarea', placeholder: 'Describe la categoría...' },
  { name: 'imagen_url', label: 'URL de imagen', type: 'url', placeholder: 'https://ejemplo.com/imagen.jpg' },
  { name: 'activo', label: 'Categoría activa', type: 'checkbox' },
]

export function CategoriaFormModal({ isOpen, onClose, initialData, onSubmit, isEditing }: CategoriaFormModalProps) {
  // Adaptar el objeto recibido (Category) a CreateCategoryDto para evitar problemas de null/undefined
  const handleSubmit = async (data: Category) => {
    const dto: CreateCategoryDto = {
      nombre: data.nombre,
      descripcion: data.descripcion || undefined,
      imagen_url: data.imagen_url || undefined,
      activo: data.activo,
    }
    await onSubmit(dto)
  }
  return (
    <EntityFormModal<Category>
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Editar Categoría' : 'Crear Categoría'}
      fields={fields}
      initialData={initialData}
      onSubmit={handleSubmit}
      headerGradient="red"
    />
  )
}
