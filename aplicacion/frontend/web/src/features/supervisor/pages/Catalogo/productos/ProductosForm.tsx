import { EntityFormModal, type Field } from '../../../../../components/ui/EntityFormModal'
import { type Product, type CreateProductDto } from '../../../services/productosApi'
import { type Category } from '../../../services/catalogApi'

interface ProductosFormProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: any) => Promise<void>
  editingItem?: Product | null
  isEditing: boolean
  categories: Category[]
  isSubmitting: boolean
}

export function ProductosForm({
  isOpen,
  onClose,
  onSubmit,
  editingItem,
  isEditing,
  categories,
  isSubmitting,
}: ProductosFormProps) {
  const fields: Field[] = [
    { name: 'codigo_sku', label: 'Código SKU', required: true, placeholder: 'Ej: SKU-001' },
    { name: 'nombre', label: 'Nombre del producto', required: true, placeholder: 'Ej: Embutidos de salchichael' },
    { name: 'descripcion', label: 'Descripción', type: 'textarea', placeholder: 'Describe el producto...' },
    {
      name: 'categoria_id',
      label: 'Categoría',
      type: 'select',
      options: categories.map((c: Category) => ({ value: String(c.id), label: c.nombre })),
    },
    { name: 'peso_unitario_kg', label: 'Peso unitario (kg)', type: 'number', required: true, placeholder: 'Ej: 0.5' },
    { name: 'volumen_m3', label: 'Volumen (m³)', type: 'number', placeholder: 'Ej: 0.001' },
    {
      name: 'unidad_medida',
      label: 'Unidad de medida',
      type: 'select',
      required: true,
      options: [
        { value: 'UNIDAD', label: 'Unidad' },
        { value: 'GRAMO', label: 'Gramo' },
        { value: 'KILOGRAMO', label: 'Kilogramo' },

      ],
    },
    { name: 'imagen_url', label: 'URL de imagen', type: 'url', placeholder: 'https://ejemplo.com/imagen.jpg' },
    { name: 'requiere_frio', label: 'Requiere frío', type: 'checkbox' },
    { name: 'activo', label: 'Producto activo', type: 'checkbox' },
  ]

  const handleSubmit = async (data: any) => {
    const productData: Partial<CreateProductDto> & { imagenUrl?: string | null } = {
      codigo_sku: data.codigo_sku,
      nombre: data.nombre,
      descripcion: data.descripcion || undefined,
      categoria_id: data.categoria_id && data.categoria_id !== '' ? parseInt(data.categoria_id as string) : null,
      peso_unitario_kg: typeof data.peso_unitario_kg === 'string' ? parseFloat(data.peso_unitario_kg) : data.peso_unitario_kg,
      volumen_m3: data.volumen_m3 ? (typeof data.volumen_m3 === 'string' ? parseFloat(data.volumen_m3) : data.volumen_m3) : undefined,
      unidad_medida: data.unidad_medida,
      imagen_url: data.imagen_url || undefined,
      imagenUrl: data.imagen_url || undefined, // Enviar alias camelCase por compatibilidad con backend
      requiere_frio: data.requiere_frio ?? false,
      activo: data.activo ?? true,
    }
    await onSubmit(productData)
  }

  return (
    <EntityFormModal<Product>
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Editar Producto' : 'Nuevo Producto'}
      fields={fields}
      initialData={
        editingItem
          ? ({
              ...editingItem,
              categoria_id:
                editingItem.categoria?.id !== null && editingItem.categoria?.id !== undefined
                  ? String(editingItem.categoria.id)
                  : editingItem.categoria_id !== null && editingItem.categoria_id !== undefined
                  ? String(editingItem.categoria_id)
                  : '',
            } as unknown as Partial<Product>)
          : undefined
      }
      onSubmit={handleSubmit}
      headerGradient="red"
    />
  )
}
