import { 
  ClipboardCheck, 
  Percent, 
  ListOrdered, 
  PlusCircle, 
  LayoutGrid,
  ArrowLeft
} from 'lucide-react'
import { PageHero } from 'components/ui/PageHero'
import { SectionHeader } from 'components/ui/SectionHeader'
import { Button } from 'components/ui/Button'
import { useState } from 'react'
import { CategoriasView } from './CategoriasView'
import { ProductosView } from './ProductosView'
import { PreciosView } from './PreciosView'

type CatalogoOption = {
  id: string
  title: string
  description: string
  icon: React.ElementType
  color: string
}

const CATALOGO_OPTIONS: CatalogoOption[] = [
  {
    id: 'auditoria',
    title: 'Auditoría',
    description: 'Revisión y validación de productos',
    icon: ClipboardCheck,
    color: 'from-blue-500 to-blue-600',
  },
  {
    id: 'promociones',
    title: 'Promociones',
    description: 'Ofertas y descuentos especiales',
    icon: Percent,
    color: 'from-orange-500 to-orange-600',
  },
  {
    id: 'listas-precios',
    title: 'Listas de Precios',
    description: 'Administración de precios por zona',
    icon: ListOrdered,
    color: 'from-purple-500 to-purple-600',
  },
  {
    id: 'nuevo-producto',
    title: 'Nuevo Producto',
    description: 'Agregar productos al catálogo',
    icon: PlusCircle,
    color: 'from-red-500 to-red-600',
  },
  {
    id: 'categorias',
    title: 'Categorías',
    description: 'Organización de productos',
    icon: LayoutGrid,
    color: 'from-indigo-500 to-indigo-600',
  },
]

export default function CatalogoPage() {
  const [selectedOption, setSelectedOption] = useState<string | null>(null)

  const handleOptionClick = (optionId: string) => {
    setSelectedOption(optionId)
  }

  const handleBack = () => {
    setSelectedOption(null)
  }

  // Si hay una opción seleccionada, mostrar su vista
  if (selectedOption === 'categorias') {
    return (
      <div className="space-y-6">
        <PageHero
          title="Categorías"
          subtitle="Gestión de categorías de productos"
          chips={['Catálogo', 'Categorías', 'Productos']}
        />
        
        <div className="flex justify-start">
          <Button
            onClick={handleBack}
            className="flex items-center gap-2 bg-brand-red text-white hover:bg-brand-red/90 shadow-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver al catálogo
          </Button>
        </div>

        <CategoriasView />
      </div>
    )
  }

  if (selectedOption === 'nuevo-producto') {
    return (
      <div className="space-y-6">
        <PageHero
          title="Productos"
          subtitle="Gestión del catálogo de productos"
          chips={['Catálogo', 'Productos', 'SKU']}
        />
        
        <div className="flex justify-start">
          <Button
            onClick={handleBack}
            className="flex items-center gap-2 bg-brand-red text-white hover:bg-brand-red/90 shadow-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver al catálogo
          </Button>
        </div>

        <ProductosView />
      </div>
    )
  }

  if (selectedOption === 'listas-precios') {
    return (
      <div className="space-y-6">
        <PageHero
          title="Listas de Precios"
          subtitle="Administración de precios por lista (General, Mayorista, Horeca)"
          chips={['Catálogo', 'Precios', 'Listas']}
        />
        
        <div className="flex justify-start">
          <Button
            onClick={handleBack}
            className="flex items-center gap-2 bg-brand-red text-white hover:bg-brand-red/90 shadow-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver al catálogo
          </Button>
        </div>

        <PreciosView />
      </div>
    )
  }

  // Vista por defecto con todas las opciones
  return (
    <div className="space-y-6">
      <PageHero
        title="Gestión de Catálogo"
        subtitle="Administra productos, precios, promociones y configuraciones del catálogo"
        chips={[
          'Productos',
          'Precios',
          'Promociones',
          'Categorías',
        ]}
      />

      <SectionHeader
        title="Opciones de Catálogo"
        subtitle="Selecciona una opción para administrar"
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {CATALOGO_OPTIONS.map((option) => {
          const Icon = option.icon
          return (
            <button
              key={option.id}
              onClick={() => handleOptionClick(option.id)}
              className="group relative overflow-hidden rounded-xl bg-white p-6 text-left shadow-md transition-all hover:shadow-xl hover:-translate-y-1"
            >
              {/* Gradient background on hover */}
              <div className={`absolute inset-0 bg-gradient-to-br ${option.color} opacity-0 transition-opacity group-hover:opacity-5`} />
              
              <div className="relative flex items-start gap-4">
                {/* Icon container */}
                <div className={`flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${option.color} shadow-lg transition-transform group-hover:scale-110`}>
                  <Icon className="h-7 w-7 text-white" />
                </div>

                {/* Content */}
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900 group-hover:text-gray-700">
                    {option.title}
                  </h3>
                  <p className="mt-1 text-sm text-gray-600">
                    {option.description}
                  </p>
                </div>
              </div>

              {/* Arrow indicator */}
              <div className="mt-4 flex justify-end">
                <div className="text-gray-400 transition-transform group-hover:translate-x-1 group-hover:text-gray-600">
                  →
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {/* Info card */}
      <div className="rounded-xl border border-blue-200 bg-blue-50 p-6">
        <div className="flex gap-3">
          <div className="flex-shrink-0">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
              <span className="text-xl">💡</span>
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-blue-900">
              Gestión centralizada del catálogo
            </h4>
            <p className="mt-1 text-sm text-blue-700">
              Desde aquí puedes administrar todos los aspectos del catálogo de productos: 
              auditorías, zonas de distribución, promociones activas, listas de precios 
              personalizadas, agregar nuevos productos y organizar categorías.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
