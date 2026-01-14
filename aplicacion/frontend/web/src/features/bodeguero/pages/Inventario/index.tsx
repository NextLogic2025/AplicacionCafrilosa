import { useState } from 'react'
import { Search, Package } from 'lucide-react'
import { SectionHeader } from 'components/ui/SectionHeader'
import { EmptyContent } from 'components/ui/EmptyContent'
import { PageHero } from 'components/ui/PageHero'

export default function InventarioPage() {
  const [busqueda, setBusqueda] = useState('')

  return (
    <div className="space-y-6">
      <PageHero
        title="Control de Inventario"
        subtitle="Gestiona el stock consolidado de todos los productos"
        chips={[
          'Stock en tiempo real',
          'Alertas de bajo stock',
          'Historial de movimientos',
        ]}
      />

      <SectionHeader title="Inventario" subtitle="Control consolidado de stock" />

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-neutral-400" />
        <input
          type="text"
          placeholder="Buscar por nombre o código..."
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          className="w-full rounded-lg border border-neutral-300 py-2 pl-10 pr-4 focus:border-brand-red focus:outline-none focus:ring-2 focus:ring-brand-red/20"
        />
      </div>

      <EmptyContent icon={Package} title="No hay productos" subtitle="Los productos aparecerán aquí cuando se conecte el backend" />
    </div>
  )
}
