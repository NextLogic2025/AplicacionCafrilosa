import { useEffect, useState } from 'react'
import { PageHero } from '../../../../components/ui/PageHero'
import { ActionButton } from '../../../../components/ui/ActionButton'
import { EmptyContent } from '../../../../components/ui/EmptyContent'
import { ShoppingCart, Users, Package, Percent, Send, Trash2 } from 'lucide-react'
import { getClientesAsignados, getProductosPorCliente } from '../../services/vendedorApi'
import type { Cliente } from '../../../supervisor/services/clientesApi'
import type { Producto } from '../../services/vendedorApi'
import { CardGrid } from '../../../../components/ui/CardGrid'
import { StatusBadge } from '../../../../components/ui/StatusBadge'
import { ProductCard } from '../../../../components/ui/ProductCard'
import type { Producto as ProductoCliente } from '../../../cliente/types'

export default function VendedorCrearPedido() {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [clienteSeleccionado, setClienteSeleccionado] = useState<string>('')
  const [productos, setProductos] = useState<Producto[]>([])
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [isLoadingClientes, setIsLoadingClientes] = useState(false)
  const [isLoadingProductos, setIsLoadingProductos] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cart, setCart] = useState<Array<{ id: string; name: string; unitPrice: number; quantity: number }>>([])


  return (
    <div className="space-y-6">
      <PageHero
        title="Crear Pedido"
        subtitle="Módulo central para la gestión de ventas"
        chips={[
          { label: 'Módulo principal', variant: 'red' },
          { label: 'Gestión comercial', variant: 'blue' },
        ]}
      />

    </div>
  )
}