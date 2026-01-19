import React from 'react'
import { fireEvent, render, waitFor } from '@testing-library/react-native'

const mockNavigate = jest.fn()
const mockGetOrderHistory = jest.fn()
const mockGetMyClients = jest.fn()

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: mockNavigate }),
  useFocusEffect: (cb: any) => {
    const React = require('react')
    React.useEffect(() => cb(), [cb])
  },
}))

jest.mock('../../../../../../src/navigation/navigationRef', () => ({
  navigationRef: { isReady: () => false, navigate: jest.fn(), dispatch: jest.fn() },
}))

jest.mock('../../../../../../src/services/api/OrderService', () => {
  const real = jest.requireActual('../../../../../../src/services/api/OrderService')
  return {
    ...real,
    OrderService: {
      getOrderHistory: (...args: any[]) => mockGetOrderHistory(...args),
      formatOrderDateShort: () => '01/01/2024',
    },
  }
})

jest.mock('../../../../../../src/services/api/ClientService', () => ({
  ClientService: {
    getMyClients: (...args: any[]) => mockGetMyClients(...args),
  },
}))

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { SellerOrderHistoryScreen } = require('../../../../../../src/features/vendedor/screens/ModuloPedidos/SellerOrderHistoryScreen')

describe('integration/vendedor/SellerOrderHistoryScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetOrderHistory.mockResolvedValue([
      { id: 'o1', codigo_visual: 1, estado_actual: 'PENDIENTE', cliente_id: 'c1', total_final: 10, created_at: new Date().toISOString() },
      { id: 'o2', codigo_visual: 2, estado_actual: 'ENTREGADO', cliente_id: 'c2', total_final: 20, created_at: new Date().toISOString() },
    ])
    mockGetMyClients.mockResolvedValue([
      { id: 'c1', razon_social: 'Cliente 1', nombre_comercial: 'Cliente 1', identificacion: '111', lista_precios_id: 1, bloqueado: false, tiene_credito: false, limite_credito: '0', saldo_actual: '0', dias_plazo: 0 },
      { id: 'c2', razon_social: 'Cliente 2', nombre_comercial: 'Cliente 2', identificacion: '222', lista_precios_id: 1, bloqueado: false, tiene_credito: false, limite_credito: '0', saldo_actual: '0', dias_plazo: 0 },
    ])
  })

  it('filters by status and client and navigates to detail', async () => {
    const screen = render(<SellerOrderHistoryScreen />)

    await waitFor(() => expect(screen.getByText(/Pedido #1/)).toBeTruthy())
    expect(mockGetOrderHistory).toHaveBeenCalled()

    fireEvent.press(screen.getByText('Entregados'))
    await waitFor(() => {
      expect(screen.getByText(/Pedido #2/)).toBeTruthy()
      expect(screen.queryByText(/Pedido #1/)).toBeNull()
    })

    // reset status to all before filtering by client
    fireEvent.press(screen.getByText('Todos'))
    fireEvent.press(screen.getByText('Filtrar por cliente'))
    await waitFor(() => expect(screen.getByText('Cliente 1')).toBeTruthy())
    fireEvent.press(screen.getByText('Cliente 1'))
    await waitFor(() => {
      expect(screen.getByText(/Pedido #1/)).toBeTruthy()
      expect(screen.queryByText(/Pedido #2/)).toBeNull()
    })

    fireEvent.press(screen.getByText(/Pedido #1/))
    expect(mockNavigate).toHaveBeenCalledWith('SellerOrderDetail', { orderId: 'o1' })
  })
})
