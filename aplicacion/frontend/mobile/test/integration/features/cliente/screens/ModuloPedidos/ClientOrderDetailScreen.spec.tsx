import React from 'react'
import { Alert } from 'react-native'
import { fireEvent, render, waitFor } from '@testing-library/react-native'

const mockGoBack = jest.fn()
let mockRoute: any = { params: { orderId: 'o1' } }

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ goBack: mockGoBack }),
  useRoute: () => mockRoute,
}))

jest.mock('../../../../../../src/navigation/navigationRef', () => ({
  navigationRef: { isReady: () => false, navigate: jest.fn(), dispatch: jest.fn() },
}))

const mockGetOrderById = jest.fn()
const mockCancelOrder = jest.fn()
jest.mock('../../../../../../src/services/api/OrderService', () => ({
  OrderService: {
    getOrderById: (...args: any[]) => mockGetOrderById(...args),
    cancelOrder: (...args: any[]) => mockCancelOrder(...args),
  },
  ORDER_STATUS_COLORS: { PENDIENTE: '#000' },
  ORDER_STATUS_LABELS: { PENDIENTE: 'Pendiente' },
}))

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { ClientOrderDetailScreen } = require('../../../../../../src/features/cliente/screens/ModuloPedidos/ClientOrderDetailScreen')

describe('integration/cliente/ClientOrderDetailScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockRoute = { params: { orderId: 'o1' } }
  })

  it('shows cancel button for PENDIENTE and cancels on confirm', async () => {
    mockGetOrderById.mockResolvedValue({
      id: 'o1',
      codigo_visual: 1,
      estado_actual: 'PENDIENTE',
      subtotal: 1,
      descuento_total: 0,
      impuestos_total: 0,
      total_final: 1,
      created_at: '2026-01-01T00:00:00.000Z',
      updated_at: '2026-01-01T00:00:00.000Z',
      detalles: [],
    })
    mockCancelOrder.mockResolvedValue({})

    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation((title: any, _msg: any, buttons: any) => {
      if (title === 'Cancelar Pedido') {
        const b = Array.isArray(buttons) ? buttons.find((x) => x?.text?.toLowerCase?.().includes('sí')) : null
        b?.onPress?.()
      }
    })

    const screen = render(<ClientOrderDetailScreen />)

    await waitFor(() => {
      expect(screen.getByText(/Pedido #1/i)).toBeTruthy()
      expect(screen.getByText('Cancelar Pedido')).toBeTruthy()
    })

    fireEvent.press(screen.getByText('Cancelar Pedido'))

    await waitFor(() => {
      expect(mockCancelOrder).toHaveBeenCalledWith('o1')
    })

    alertSpy.mockRestore()
  })

  it('does not show cancel button for non-PENDIENTE', async () => {
    mockGetOrderById.mockResolvedValue({
      id: 'o1',
      codigo_visual: 1,
      estado_actual: 'ENTREGADO',
      subtotal: 1,
      descuento_total: 0,
      impuestos_total: 0,
      total_final: 1,
      created_at: '2026-01-01T00:00:00.000Z',
      updated_at: '2026-01-01T00:00:00.000Z',
      detalles: [],
    })

    const screen = render(<ClientOrderDetailScreen />)

    await waitFor(() => {
      expect(screen.getByText(/Pedido #1/i)).toBeTruthy()
    })

    expect(screen.queryByText('Cancelar Pedido')).toBeNull()
  })
})

