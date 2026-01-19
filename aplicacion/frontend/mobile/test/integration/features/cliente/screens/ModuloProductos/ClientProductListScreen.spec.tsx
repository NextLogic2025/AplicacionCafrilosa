import React from 'react'
import { fireEvent, render, waitFor } from '@testing-library/react-native'

const mockNavigate = jest.fn()
const mockGoBack = jest.fn()

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: mockNavigate, goBack: mockGoBack }),
  useFocusEffect: (cb: any) => {
    const React = require('react')
    React.useEffect(() => cb(), [cb])
  },
}))

jest.mock('../../../../../../src/navigation/navigationRef', () => ({
  navigationRef: { isReady: () => false, navigate: jest.fn(), dispatch: jest.fn() },
}))

const mockAddToCart = jest.fn()
jest.mock('../../../../../../src/context/CartContext', () => ({
  useCart: () => ({ addToCart: mockAddToCart }),
}))

const mockShowToast = jest.fn()
jest.mock('../../../../../../src/context/ToastContext', () => ({
  useToast: () => ({ showToast: mockShowToast }),
}))

const mockGetCategories = jest.fn()
const mockGetClientProducts = jest.fn()
jest.mock('../../../../../../src/services/api/CatalogService', () => ({
  CatalogService: {
    getCategories: (...args: any[]) => mockGetCategories(...args),
    getClientProducts: (...args: any[]) => mockGetClientProducts(...args),
  },
}))

jest.mock('../../../../../../src/components/ui/ClientProductCard', () => ({
  ClientProductCard: ({ product, onPress, onAddToCart }: any) => {
    const React = require('react')
    const { Text, TouchableOpacity, View } = require('react-native')
    return (
      <View>
        <Text>{product.nombre}</Text>
        <TouchableOpacity onPress={() => onPress(product)}>
          <Text>Abrir</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => onAddToCart?.(product)}>
          <Text>Agregar</Text>
        </TouchableOpacity>
      </View>
    )
  },
}))

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { ClientProductListScreen } = require('../../../../../../src/features/cliente/screens/ModuloProductos/ClientProductListScreen')

describe('integration/cliente/ClientProductListScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetCategories.mockResolvedValue([{ id: 1, nombre: 'C1', activo: true }])
    mockGetClientProducts.mockResolvedValue({
      metadata: { total_items: 1, page: 1, per_page: 20, total_pages: 1 },
      items: [
        {
          id: 'p1',
          codigo_sku: 'SKU1',
          nombre: 'Producto 1',
          activo: true,
          unidad_medida: 'UN',
          precio_original: 10,
          precio_oferta: 7,
          ahorro: 3,
        },
      ],
    })
  })

  it('loads products on focus and navigates to detail', async () => {
    const screen = render(<ClientProductListScreen />)

    await waitFor(() => {
      expect(screen.getByText('Producto 1')).toBeTruthy()
    })

    fireEvent.press(screen.getByText('Abrir'))
    expect(mockNavigate).toHaveBeenCalledWith('ClientProductDetail', expect.objectContaining({ productId: 'p1' }))
  })

  it('adds to cart and shows toast', async () => {
    const screen = render(<ClientProductListScreen />)

    await waitFor(() => {
      expect(screen.getByText('Producto 1')).toBeTruthy()
    })

    fireEvent.press(screen.getByText('Agregar'))

    expect(mockAddToCart).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'p1',
        codigo_sku: 'SKU1',
        precio_lista: 10,
        precio_final: 7,
        tiene_promocion: true,
        descuento_porcentaje: 30,
      }),
      1
    )
    expect(mockShowToast).toHaveBeenCalled()
  })
})
