import React from 'react'
import { Alert } from 'react-native'
import { fireEvent, render, waitFor } from '@testing-library/react-native'

const mockNavigate = jest.fn()
const mockGoBack = jest.fn()
let mockRoute: any = { params: { productId: 'p1', product: undefined } }

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: mockNavigate, goBack: mockGoBack }),
  useRoute: () => mockRoute,
}))

jest.mock('../../../../../../src/navigation/navigationRef', () => ({
  navigationRef: { isReady: () => false, navigate: jest.fn(), dispatch: jest.fn() },
}))

const mockAddToCart = jest.fn()
jest.mock('../../../../../../src/context/CartContext', () => ({
  useCart: () => ({ addToCart: mockAddToCart }),
}))

const mockGetClientProductDetail = jest.fn()
jest.mock('../../../../../../src/services/api/CatalogService', () => ({
  CatalogService: {
    getClientProductDetail: (...args: any[]) => mockGetClientProductDetail(...args),
  },
}))

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { ClientProductDetailScreen } = require('../../../../../../src/features/cliente/screens/ModuloProductos/ClientProductDetailScreen')

describe('integration/cliente/ClientProductDetailScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockRoute = {
      params: {
        productId: 'p1',
        product: {
          id: 'p1',
          codigo_sku: 'SKU1',
          nombre: 'Producto 1',
          activo: true,
          unidad_medida: 'UN',
          precio_original: 10,
          precio_oferta: 7,
          ahorro: 3,
          promociones: [{ campana_id: 1, precio_oferta: 7, tipo_descuento: 'PORCENTAJE', valor_descuento: 30 }],
        },
      },
    }
  })

  it('adds to cart and can navigate to cart from alert', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation((title: any, _msg: any, buttons: any) => {
      const b = Array.isArray(buttons) ? buttons.find((x) => x?.text === 'Ver Carrito') : null
      b?.onPress?.()
    })

    const screen = render(<ClientProductDetailScreen />)
    await waitFor(() => {
      expect(screen.getByText('Agregar al Carrito')).toBeTruthy()
    })

    fireEvent.press(screen.getByText('Agregar al Carrito'))

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
    expect(mockNavigate).toHaveBeenCalledWith('Carrito')
    expect(alertSpy).toHaveBeenCalledWith(expect.stringMatching(/Agregado al Carrito/i), expect.any(String), expect.any(Array))
    alertSpy.mockRestore()
  })

  it('loads product detail when product not provided', async () => {
    mockRoute = { params: { productId: 'p2', product: undefined } }
    mockGetClientProductDetail.mockResolvedValueOnce({
      id: 'p2',
      codigo_sku: 'SKU2',
      nombre: 'Producto 2',
      activo: true,
      unidad_medida: 'UN',
      precio_original: 5,
    })

    const screen = render(<ClientProductDetailScreen />)

    await waitFor(() => {
      expect(mockGetClientProductDetail).toHaveBeenCalledWith('p2')
    })

    await waitFor(() => {
      expect(screen.getByText(/Producto 2/i)).toBeTruthy()
    })
  })
})

