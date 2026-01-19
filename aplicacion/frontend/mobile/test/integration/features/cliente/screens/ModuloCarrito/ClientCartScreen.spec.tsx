import React from 'react'
import { act, fireEvent, render, waitFor } from '@testing-library/react-native'
import { ClientCartScreen } from '../../../../../../src/features/cliente/screens/ModuloCarrito/ClientCartScreen'

const mockNavigate = jest.fn()

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: mockNavigate }),
}))

jest.mock('../../../../../../src/navigation/navigationRef', () => ({
  navigationRef: { isReady: () => false, navigate: jest.fn(), dispatch: jest.fn() },
}))

const mockUpdateQuantity = jest.fn()
const mockRemoveItem = jest.fn()
const mockClearCart = jest.fn(async () => {})

jest.mock('../../../../../../src/context/CartContext', () => ({
  useCart: () => ({
    cart: { subtotal: 14, descuento_total: 6, impuestos_total: 1.68, total_final: 15.68 },
    items: [
      {
        id: 'i1',
        producto_id: 'p1',
        nombre_producto: 'Producto 1',
        codigo_sku: 'SKU1',
        cantidad: 2,
        tiene_promocion: true,
        descuento_porcentaje: 30,
        subtotal: 14,
      },
    ],
    totalItems: 2,
    updateQuantity: mockUpdateQuantity,
    removeItem: mockRemoveItem,
    clearCart: mockClearCart,
  }),
}))

describe('integration/cliente/ClientCartScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('navigates to checkout when pressing Enviar Pedido', () => {
    const screen = render(<ClientCartScreen />)
    const buttonText = screen.getByText(/Enviar Pedido/i)
    fireEvent.press(buttonText.parent as any)
    expect(mockNavigate).toHaveBeenCalledWith('ClientCheckout')
  })

  it('calls updateQuantity when pressing +', () => {
    const screen = render(<ClientCartScreen />)
    const addIcon = screen.getByText('add')
    fireEvent.press(addIcon.parent as any)
    expect(mockUpdateQuantity).toHaveBeenCalledWith('p1', 3)
  })

  it('clears cart after confirming Vaciar', async () => {
    jest.useFakeTimers()
    const screen = render(<ClientCartScreen />)

    const vaciarButtonText = screen.getAllByText('Vaciar')[0]
    fireEvent.press(vaciarButtonText.parent as any)

    await waitFor(() => {
      expect(screen.getByText('Vaciar Carrito')).toBeTruthy()
    })

    const vaciarConfirmText = screen.getAllByText('Vaciar').slice(-1)[0]
    await act(async () => {
      fireEvent.press(vaciarConfirmText.parent as any)
    })

    await waitFor(() => {
      expect(mockClearCart).toHaveBeenCalled()
    })

    act(() => {
      jest.advanceTimersByTime(300)
    })

    await waitFor(() => {
      expect(screen.getByText(/Carrito Vaciado/i)).toBeTruthy()
    })

    jest.useRealTimers()
  })
})
