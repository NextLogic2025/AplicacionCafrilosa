import { SectionHeader } from 'components/ui/SectionHeader'
import { FilterGroup } from 'components/ui/FilterButton'
import { EmptyContent } from 'components/ui/EmptyContent'
import { ClipboardList, AlertCircle } from 'lucide-react'
import React, { useState } from 'react'
import { PageHero } from 'components/ui/PageHero'

export default function PedidosPendientesPage() {
  const [filtro, setFiltro] = useState<'all' | 'cliente' | 'vendedor'>('all')

  return (
    <div className="space-y-5">
      <PageHero
        title="Pedidos Pendientes"
        subtitle="Visualiza los pedidos en espera de validación y aprobación"
        chips={[
          'Pendientes de validación',
          'Sin stock disponible',
          'Alertas críticas',
        ]}
      />

      <SectionHeader title="Pedidos Pendientes" subtitle="Pedidos en espera de validación de stock" />

      <FilterGroup
        filters={[
          { value: 'all', label: 'Todos' },
          { value: 'cliente', label: 'Origen: Cliente' },
          { value: 'vendedor', label: 'Origen: Vendedor' },
        ]}
        activeFilter={filtro}
        onChange={(v) => setFiltro(v as any)}
      />

      <EmptyContent
        icon={ClipboardList}
        title="No hay pedidos pendientes"
        subtitle="Cuando existan pedidos en espera, se listarán aquí para validación."
      />
    </div>
  )
}
