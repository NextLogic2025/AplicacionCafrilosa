import React from 'react'
import { fireEvent, render, waitFor } from '@testing-library/react-native'

const mockNavigate = jest.fn()
const mockGetCategories = jest.fn()
const mockGetProductsPaginated = jest.fn()
const mockGetProductsByCategory = jest.fn()
const mockGetLists = jest.fn()
const mockAddToCart = jest.fn()
const mockSetCartClient = jest.fn()
const mockShowToast = jest.fn()

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: mockNavigate }),
}))

jest.mock('../../../../../../src/navigation/navigationRef', () => ({
  navigationRef: { isReady: () => false, navigate: jest.fn(), dispatch: jest.fn() },
}))

jest.mock('../../../../../../src/services/api/CatalogService', () => ({
  CatalogService: {
    getCategories: (...args: any[]) => mockGetCategories(...args),
    getProductsPaginated: (...args: any[]) => mockGetProductsPaginated(...args),
    getProductsByCategory: (...args: any[]) => mockGetProductsByCategory(...args),
  },
}))

jest.mock('../../../../../../src/services/api/PriceService', () => ({
  PriceService: {
    getLists: (...args: any[]) => mockGetLists(...args),
  },
}))

jest.mock('../../../../../../src/context/CartContext', () => ({
  useCart: () => ({
    addToCart: mockAddToCart,
    cart: { items: [], total_final: 0 },
    setClient: mockSetCartClient,
  }),
}))

jest.mock('../../../../../../src/context/ToastContext', () => ({
  useToast: () => ({ showToast: mockShowToast }),
}))

jest.mock('../../../../../../src/components/ui/ClientProductCard', () => ({
  ClientProductCard: ({ product, onAddToCart }: any) => {
    const React = require('react')
    const { View, Text, TouchableOpacity } = require('react-native')
    return (
      <View>
        <Text>{product.nombre}</Text>
        <TouchableOpacity onPress={onAddToCart}>
          <Text>Agregar</Text>
        </TouchableOpacity>
      </View>
    )
  },
}))

jest.mock('../../../../../../src/features/vendedor/screens/ModuloProductos/components/ClientSelectorModal', () => ({
  ClientSelectorModal: ({ visible, onClose, onSelect }: any) => {
    const React = require('react')
    const { View, Text, TouchableOpacity } = require('react-native')
    if (!visible) return null
    return (
      <View>
        <Text>Selector</Text>
        <TouchableOpacity onPress={() => onSelect({ cliente: { id: 'c1', nombre_comercial: 'Cliente 1', razon_social: 'Cliente 1', identificacion: '1', lista_precios_id: 1 } })}>
          <Text>Elegir</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onClose}>
          <Text>Cerrar</Text>
        </TouchableOpacity>
      </View>
    )
  },
}))

jest.mock('../../../../../../src/features/vendedor/screens/ModuloProductos/components/SelectedClientBanner', () => ({
  SelectedClientBanner: () => null,
}))

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { SellerProductListScreen } = require('../../../../../../src/features/vendedor/screens/ModuloProductos/SellerProductListScreen')

describe('integration/vendedor/SellerProductListScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetLists.mockResolvedValue([{ id: 1, nombre: 'General' }])
    mockGetCategories.mockResolvedValue([{ id: 10, nombre: 'Cat 1', activo: true }])
    mockGetProductsPaginated.mockResolvedValue({
      metadata: { total_items: 1, page: 1, per_page: 20, total_pages: 1 },
      items: [
        {
          id: 'p1',
          nombre: 'Producto 1',
          codigo_sku: 'SKU1',
          precio_original: 10,
          precio_oferta: 8,
          ahorro: 2,
          precios: [{ lista_id: 1, precio: 10 }],
        },
      ],
    })
    mockGetProductsByCategory.mockResolvedValue({
      metadata: { total_items: 1, page: 1, per_page: 20, total_pages: 1 },
      items: [
        {
          id: 'p2',
          nombre: 'Producto 2',
          codigo_sku: 'SKU2',
          precio_original: 20,
          precios: [{ lista_id: 1, precio: 20 }],
        },
      ],
    })
  })

  it('selects client, loads catalog and adds to cart', async () => {
    const screen = render(<SellerProductListScreen />)

    fireEvent.press(screen.getByText('Seleccionar Cliente'))
    await waitFor(() => expect(screen.getByText('Selector')).toBeTruthy())
    fireEvent.press(screen.getByText('Elegir'))
    await waitFor(() => expect(mockSetCartClient).toHaveBeenCalled())
    await waitFor(() => expect(screen.getByText('Producto 1')).toBeTruthy())

    fireEvent.press(screen.getByText('Cat 1'))
    await waitFor(() => expect(mockGetProductsByCategory).toHaveBeenCalled())

    fireEvent.changeText(screen.getByPlaceholderText('Buscar producto...'), 'SKU2')
    await waitFor(() => expect(mockGetProductsPaginated).toHaveBeenCalled())

    fireEvent.press(screen.getByText('Agregar'))
    expect(mockAddToCart).toHaveBeenCalled()
    expect(mockShowToast).toHaveBeenCalled()
  })
})
