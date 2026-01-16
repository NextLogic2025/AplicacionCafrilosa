import React from 'react'
import { act, fireEvent, render, waitFor } from '@testing-library/react-native'
import { ClientCheckoutScreen } from '../../../../../../src/features/cliente/screens/ModuloCarrito/ClientCheckoutScreen'

const mockNavigate = jest.fn()
const mockReset = jest.fn()

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: mockNavigate, reset: mockReset }),
}))

jest.mock('../../../../../../src/navigation/navigationRef', () => ({
  navigationRef: { isReady: () => false, navigate: jest.fn(), dispatch: jest.fn() },
}))

const mockClearCart = jest.fn(async () => {})

jest.mock('../../../../../../src/context/CartContext', () => ({
  useCart: () => ({
    userId: 'u1',
    currentClient: null,
    cart: {
      items: [
        {
          id: 'i1',
          producto_id: 'p1',
          nombre_producto: 'Producto 1',
          cantidad: 1,
          unidad_medida: 'UN',
          precio_lista: 10,
          precio_final: 7,
          subtotal: 7,
        },
      ],
      subtotal: 7,
      descuento_total: 3,
      impuestos_total: 0.84,
      total_final: 7.84,
    },
    clearCart: mockClearCart,
  }),
}))

jest.mock('../../../../../../src/services/api/ClientService', () => ({
  ClientService: {
    getMyClientData: jest.fn(),
    getClientBranches: jest.fn(),
  },
}))

jest.mock('../../../../../../src/services/api/OrderService', () => ({
  OrderService: {
    createOrderFromCart: jest.fn(),
  },
}))

describe('integration/cliente/ClientCheckoutScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('creates order from cart and shows success modal', async () => {
    jest.useFakeTimers()

    const { ClientService } = jest.requireMock('../../../../../../src/services/api/ClientService') as {
      ClientService: { getMyClientData: jest.Mock; getClientBranches: jest.Mock }
    }
    ClientService.getMyClientData.mockResolvedValue({
      id: 'c1',
      tiene_credito: false,
      dias_plazo: 0,
      direccion_texto: 'Dir',
    })
    ClientService.getClientBranches.mockResolvedValue([])

    const { OrderService } = jest.requireMock('../../../../../../src/services/api/OrderService') as {
      OrderService: { createOrderFromCart: jest.Mock }
    }
    OrderService.createOrderFromCart.mockResolvedValue({ codigo_visual: 777 })

    const screen = render(<ClientCheckoutScreen />)

    await waitFor(() => {
      expect(screen.getAllByText('Confirmar Pedido').length).toBeGreaterThan(0)
    })

    const confirmText = screen.getAllByText('Confirmar Pedido').slice(-1)[0]
    fireEvent.press(confirmText.parent as any)

    await waitFor(() => {
      expect(OrderService.createOrderFromCart).toHaveBeenCalledWith(
        { type: 'me' },
        { condicion_pago: 'CONTADO', sucursal_id: undefined }
      )
    })

    act(() => {
      jest.advanceTimersByTime(100)
    })
    await waitFor(() => {
      expect(mockClearCart).toHaveBeenCalled()
    })

    await waitFor(() => {
      expect(screen.getByText(/pedido recibido/i)).toBeTruthy()
      expect(screen.getByText(/#777/)).toBeTruthy()
    })

    const primary = screen.getByText('Ir a Mis Pedidos')
    await act(async () => {
      fireEvent.press(primary.parent as any)
    })

    expect(mockReset).toHaveBeenCalled()

    act(() => {
      jest.advanceTimersByTime(100)
    })
    expect(mockNavigate).toHaveBeenCalledWith('Pedidos')

    jest.useRealTimers()
  })
})
