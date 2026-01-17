import React from 'react'
import { Alert } from 'react-native'
import { fireEvent, render, waitFor } from '@testing-library/react-native'

const mockNavigate = jest.fn()

const baseCart = {
  items: [],
  subtotal: 0,
  descuento_total: 0,
  impuestos_total: 0,
  total_final: 0,
  cliente_id: null,
  cliente_nombre: null,
  sucursal_nombre: null,
}

const mockUseCart = jest.fn()

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: mockNavigate }),
}))

jest.mock('../../../../../../src/navigation/navigationRef', () => ({
  navigationRef: { isReady: () => false, navigate: jest.fn(), dispatch: jest.fn() },
}))

jest.mock('../../../../../../src/context/CartContext', () => ({
  useCart: (...args: any[]) => mockUseCart(...args),
}))

jest.mock('../../../../../../src/services/api/ClientService', () => ({
  ClientService: {
    getMyClients: jest.fn().mockResolvedValue([]),
  },
}))

jest.mock('../../../../../../src/storage/authStorage', () => ({
  getToken: jest.fn().mockResolvedValue(null),
}))

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { SellerCartScreen } = require('../../../../../../src/features/vendedor/screens/ModuloCarrito/SellerCartScreen')

describe('integration/vendedor/SellerCartScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.spyOn(Alert, 'alert').mockImplementation(() => {})
  })

  it('shows empty state and navigates to products', async () => {
    mockUseCart.mockReturnValue({
      cart: baseCart,
      removeFromCart: jest.fn(),
      updateQuantity: jest.fn(),
      clearCart: jest.fn(),
      setClient: jest.fn(),
      validatePriceList: jest.fn(),
      recalculatePrices: jest.fn(),
      totalItems: 0,
    })

    const screen = render(<SellerCartScreen />)
    await waitFor(() => expect(screen.getByText(/Carrito Vac/i)).toBeTruthy())

    fireEvent.press(screen.getByText('Ver Productos'))
    expect(mockNavigate).toHaveBeenCalledWith('SellerProductList')
  })

  it('navigates to checkout when client present', async () => {
    mockUseCart.mockReturnValue({
      cart: {
        ...baseCart,
        items: [
          { id: '1', producto_id: 'p1', nombre_producto: 'Prod', codigo_sku: 'SKU', cantidad: 1, precio_lista: 10, subtotal: 10 },
        ],
        total_final: 10,
        cliente_id: 'c1',
        cliente_nombre: 'Cliente 1',
      },
      removeFromCart: jest.fn(),
      updateQuantity: jest.fn(),
      clearCart: jest.fn(),
      setClient: jest.fn(),
      validatePriceList: jest.fn(),
      recalculatePrices: jest.fn(),
      totalItems: 1,
    })

    const screen = render(<SellerCartScreen />)
    await waitFor(() => expect(screen.getByText('Prod')).toBeTruthy())

    fireEvent.press(screen.getByText(/Enviar Pedido/))
    expect(mockNavigate).toHaveBeenCalledWith('SellerCheckout')
  })
})
