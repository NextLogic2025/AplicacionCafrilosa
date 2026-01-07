import { useEffect, useState } from 'react'
import type React from 'react'
import {
  getAllCampanias,
  createCampania,
  updateCampania,
  deleteCampania,
  getProductosByCampania,
  addProductoPromo,
  deleteProductoPromo,
  getClientesByCampania,
  addClienteCampania,
  deleteClienteCampania,
  type Campania,
  type CreateCampaniaDto,
  type ProductoPromocion,
  type ClienteCampania,
} from '../../services/promocionesApi'
import { obtenerListasPrecios, obtenerCliente, type ListaPrecio, type Cliente } from '../../services/clientesApi'
import { getAllProducts, type Product } from '../../services/productosApi'

const EMPTY_FORM: CreateCampaniaDto = {
  nombre: '',
  descripcion: '',
  fecha_inicio: '',
  fecha_fin: '',
  tipo_descuento: 'PORCENTAJE',
  valor_descuento: 0,
  alcance: 'GLOBAL',
  lista_precios_objetivo_id: undefined,
  activo: true,
}

export function usePromocionesController() {
  const [campanias, setCampanias] = useState<Campania[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string>('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCampania, setEditingCampania] = useState<Campania | null>(null)
  const [listasPrecios, setListasPrecios] = useState<ListaPrecio[]>([])
  const [productos, setProductos] = useState<Product[]>([])
  const [productosAsignados, setProductosAsignados] = useState<ProductoPromocion[]>([])
  const [isProductModalOpen, setIsProductModalOpen] = useState(false)
  const [clientesAsignados, setClientesAsignados] = useState<ClienteCampania[]>([])
  const [isClientModalOpen, setIsClientModalOpen] = useState(false)
  const [campaniaIdForClientes, setCampaniaIdForClientes] = useState<number | null>(null)
  const [filtroEstado, setFiltroEstado] = useState<'todas' | 'activas' | 'inactivas'>('todas')
  const [filtroAlcance, setFiltroAlcance] = useState<'todos' | 'GLOBAL' | 'POR_LISTA' | 'POR_CLIENTE'>('todos')
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [selectedCampania, setSelectedCampania] = useState<Campania | null>(null)
  const [formData, setFormData] = useState<CreateCampaniaDto>(EMPTY_FORM)

  useEffect(() => {
    loadCampanias()
    loadListasPrecios()
    loadProductos()
  }, [])

  const loadProductos = async () => {
    try {
      const data = await getAllProducts()
      setProductos(data)
    } catch (err) {
      console.error('Error al cargar productos:', err)
    }
  }

  const loadListasPrecios = async () => {
    try {
      const data = await obtenerListasPrecios()
      setListasPrecios(data)
    } catch (err) {
      console.error('Error al cargar listas de precios:', err)
    }
  }

  const loadCampanias = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const data = await getAllCampanias()
      setCampanias(data)
    } catch (err: any) {
      setError(err.message || 'Error al cargar campañas')
    } finally {
      setIsLoading(false)
    }
  }

  const handleOpenModal = (campania?: Campania) => {
    if (campania) {
      setEditingCampania(campania)
      setFormData({
        nombre: campania.nombre,
        descripcion: campania.descripcion || '',
        fecha_inicio: campania.fecha_inicio.split('T')[0],
        fecha_fin: campania.fecha_fin.split('T')[0],
        tipo_descuento: (campania.tipo_descuento as any) || 'PORCENTAJE',
        valor_descuento: parseFloat(campania.valor_descuento || '0'),
        alcance: (campania.alcance as any) || 'GLOBAL',
        lista_precios_objetivo_id: campania.lista_precios_objetivo_id || undefined,
        activo: campania.activo,
      })
    } else {
      setEditingCampania(null)
      setFormData(EMPTY_FORM)
    }
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingCampania(null)
    setFormData(EMPTY_FORM)
  }

  const loadProductosByCampania = async (campaniaId: number) => {
    try {
      const data = await getProductosByCampania(campaniaId)
      setProductosAsignados(data)
    } catch (err) {
      console.error('Error al cargar productos de campaña:', err)
      setProductosAsignados([])
    }
  }

  const handleOpenProductModal = async (campania: Campania) => {
    setEditingCampania(campania)
    setProductosAsignados([]) // Inicializar como array vacío
    setIsProductModalOpen(true)
    await loadProductosByCampania(campania.id)
  }

  const handleOpenClientModal = async (campaniaId: number) => {
    setCampaniaIdForClientes(campaniaId)
    try {
      const clientes = await getClientesByCampania(campaniaId)
      // Enriquecer con datos completos del cliente
      const clientesEnriquecidos = await Promise.all(
        clientes.map(async (cc) => {
          try {
            const clienteCompleto = await obtenerCliente(cc.cliente_id)
            return { ...cc, cliente: clienteCompleto }
          } catch {
            return cc
          }
        })
      )
      setClientesAsignados(clientesEnriquecidos)
      setIsClientModalOpen(true)
    } catch (err) {
      console.error('Error al cargar clientes de la campaña:', err)
      setClientesAsignados([])
      setIsClientModalOpen(true)
    }
  }

  const handleAddCliente = async (clienteId: string) => {
    if (!campaniaIdForClientes) return

    try {
      await addClienteCampania(campaniaIdForClientes, { cliente_id: clienteId })
      const clientes = await getClientesByCampania(campaniaIdForClientes)
      // Enriquecer con datos completos del cliente
      const clientesEnriquecidos = await Promise.all(
        clientes.map(async (cc) => {
          try {
            const clienteCompleto = await obtenerCliente(cc.cliente_id)
            return { ...cc, cliente: clienteCompleto }
          } catch {
            return cc
          }
        })
      )
      setClientesAsignados(clientesEnriquecidos)
    } catch (err: any) {
      console.error('Error al agregar cliente:', err)
      throw new Error(err.message || 'Error al agregar cliente')
    }
  }

  const handleDeleteCliente = async (clienteId: string) => {
    if (!campaniaIdForClientes) return

    try {
      await deleteClienteCampania(campaniaIdForClientes, clienteId)
      const clientes = await getClientesByCampania(campaniaIdForClientes)
      // Enriquecer con datos completos del cliente
      const clientesEnriquecidos = await Promise.all(
        clientes.map(async (cc) => {
          try {
            const clienteCompleto = await obtenerCliente(cc.cliente_id)
            return { ...cc, cliente: clienteCompleto }
          } catch {
            return cc
          }
        })
      )
      setClientesAsignados(clientesEnriquecidos)
    } catch (err: any) {
      console.error('Error al eliminar cliente:', err)
      throw new Error(err.message || 'Error al eliminar cliente')
    }
  }

  const handleDeleteClienteFromDetail = async (clienteId: string) => {
    if (!selectedCampania) return

    const confirmDelete = window.confirm('¿Eliminar este cliente de la campaña?')
    if (!confirmDelete) return

    try {
      await deleteClienteCampania(selectedCampania.id, clienteId)
      const clientes = await getClientesByCampania(selectedCampania.id)
      // Enriquecer con datos completos del cliente
      const clientesEnriquecidos = await Promise.all(
        clientes.map(async (cc) => {
          try {
            const clienteCompleto = await obtenerCliente(cc.cliente_id)
            return { ...cc, cliente: clienteCompleto }
          } catch {
            return cc
          }
        })
      )
      setClientesAsignados(clientesEnriquecidos)
      setSuccessMessage('✓ Cliente eliminado de la campaña')
      setTimeout(() => setSuccessMessage(''), 3000)
    } catch (err: any) {
      console.error('Error al eliminar cliente:', err)
      alert(err.message || 'Error al eliminar cliente')
    }
  }

  const handleAddProduct = async (productoId: string, precioOferta?: number) => {
    if (!editingCampania) return
    const producto = productos.find((p) => p.id === productoId)
    await addProductoPromo(editingCampania.id, {
      producto_id: productoId,
      precio_oferta_fijo: precioOferta,
    })
    await loadProductosByCampania(editingCampania.id)
    setSuccessMessage(`✓ "${producto?.nombre}" agregado correctamente`)
    setTimeout(() => setSuccessMessage(''), 3000)
  }

  const handleDeleteProduct = async (productoId: string) => {
    if (!editingCampania && !selectedCampania) return

    const campaniaId = editingCampania?.id || selectedCampania?.id
    if (!campaniaId) return

    if (!confirm('¿Eliminar este producto de la campaña?')) return

    try {
      await deleteProductoPromo(campaniaId, productoId)
      await loadProductosByCampania(campaniaId)
      setSuccessMessage('✓ Producto eliminado de la campaña')
      setTimeout(() => setSuccessMessage(''), 3000)
    } catch (err: any) {
      alert(err.message || 'Error al eliminar producto')
    }
  }

  const handleViewDetails = async (campania: Campania) => {
    setSelectedCampania(campania)
    setProductosAsignados([]) // Inicializar como array vacío
    setClientesAsignados([]) // Inicializar como array vacío
    setIsDetailModalOpen(true)
    
    // Cargar productos
    await loadProductosByCampania(campania.id)

    // Cargar clientes si es necesario
    if (campania.alcance === 'POR_CLIENTE') {
      try {
        const clientes = await getClientesByCampania(campania.id)
        // Enriquecer con datos completos del cliente
        const clientesEnriquecidos = await Promise.all(
          clientes.map(async (cc) => {
            try {
              const clienteCompleto = await obtenerCliente(cc.cliente_id)
              return { ...cc, cliente: clienteCompleto }
            } catch {
              return cc
            }
          })
        )
        setClientesAsignados(clientesEnriquecidos)
      } catch (err) {
        console.error('Error al cargar clientes de la campaña:', err)
        setClientesAsignados([])
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.nombre || !formData.fecha_inicio || !formData.fecha_fin) {
      alert('Nombre y fechas son requeridos')
      return
    }

    try {
      const payload: any = {
        nombre: formData.nombre,
        descripcion: formData.descripcion || undefined,
        fecha_inicio: new Date(formData.fecha_inicio + 'T00:00:00Z').toISOString(),
        fecha_fin: new Date(formData.fecha_fin + 'T23:59:59Z').toISOString(),
        tipo_descuento: formData.tipo_descuento,
        valor_descuento: formData.valor_descuento,
        alcance: formData.alcance,
        activo: formData.activo,
      }

      if (formData.alcance === 'POR_LISTA' && formData.lista_precios_objetivo_id) {
        payload.lista_precios_objetivo_id = formData.lista_precios_objetivo_id
      }

      if (editingCampania) {
        await updateCampania(editingCampania.id, payload)
      } else {
        await createCampania(payload)
      }
      await loadCampanias()
      handleCloseModal()
    } catch (err: any) {
      console.error('Error al guardar:', err)
      alert(err.message || 'Error al guardar campaña')
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('¿Eliminar esta campaña?')) return

    try {
      await deleteCampania(id)
      await loadCampanias()
    } catch (err: any) {
      alert(err.message || 'Error al eliminar campaña')
    }
  }

  const closeProductModal = () => setIsProductModalOpen(false)
  const closeClientModal = () => setIsClientModalOpen(false)
  const closeDetailModal = () => setIsDetailModalOpen(false)

  return {
    campanias,
    isLoading,
    error,
    successMessage,
    isModalOpen,
    editingCampania,
    listasPrecios,
    productos,
    productosAsignados,
    isProductModalOpen,
    isClientModalOpen,
    campaniaIdForClientes,
    clientesAsignados,
    filtroEstado,
    filtroAlcance,
    isDetailModalOpen,
    selectedCampania,
    formData,
    setFiltroEstado,
    setFiltroAlcance,
    handleOpenModal,
    handleCloseModal,
    handleOpenProductModal,
    handleOpenClientModal,
    handleAddCliente,
    handleDeleteCliente,
    handleDeleteClienteFromDetail,
    handleAddProduct,
    handleDeleteProduct,
    handleViewDetails,
    handleSubmit,
    handleDelete,
    setFormData,
    closeProductModal,
    closeClientModal,
    closeDetailModal,
  }
}
