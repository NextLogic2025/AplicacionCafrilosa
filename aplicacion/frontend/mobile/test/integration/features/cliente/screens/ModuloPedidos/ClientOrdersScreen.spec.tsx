import React from 'react'
import { fireEvent, render, waitFor } from '@testing-library/react-native'

const mockNavigate = jest.fn()

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

jest.mock('../../../../../../src/context/CartContext', () => ({
  useCart: () => ({ currentClient: null }),
}))

const mockGetOrderHistory = jest.fn()
const mockCancelOrder = jest.fn()
jest.mock('../../../../../../src/services/api/OrderService', () => ({
  OrderService: {
    getOrderHistory: (...args: any[]) => mockGetOrderHistory(...args),
    cancelOrder: (...args: any[]) => mockCancelOrder(...args),
  },
}))
;(global as any).alert = jest.fn()

jest.mock('../../../../../../src/components/ui/OrderCard', () => ({
  OrderCard: ({ order, onPress, onCancel }: any) => {
    const React = require('react')
    const { Text, TouchableOpacity, View } = require('react-native')
    return (
      <View>
        <Text>{`Pedido ${order.codigo_visual}`}</Text>
        <Text>{order.estado_actual}</Text>
        <TouchableOpacity onPress={onPress}>
          <Text>Abrir</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onCancel}>
          <Text>Cancelar</Text>
        </TouchableOpacity>
      </View>
    )
  },
}))

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { ClientOrdersScreen } = require('../../../../../../src/features/cliente/screens/ModuloPedidos/ClientOrdersScreen')

describe('integration/cliente/ClientOrdersScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetOrderHistory.mockResolvedValue([
      { id: 'o1', codigo_visual: 1, estado_actual: 'PENDIENTE' },
      { id: 'o2', codigo_visual: 2, estado_actual: 'ENTREGADO' },
    ])
    mockCancelOrder.mockResolvedValue({})
  })

  it('loads orders and navigates to detail', async () => {
    const screen = render(<ClientOrdersScreen />)

    await waitFor(() => {
      expect(screen.getByText('Pedido 1')).toBeTruthy()
      expect(screen.getByText('Pedido 2')).toBeTruthy()
    })

    fireEvent.press(screen.getAllByText('Abrir')[0])
    expect(mockNavigate).toHaveBeenCalledWith('OrderDetail', { orderId: 'o1' })
  })

  it('filters by status when selecting Entregado', async () => {
    const screen = render(<ClientOrdersScreen />)

    await waitFor(() => {
      expect(screen.getByText('Pedido 1')).toBeTruthy()
      expect(screen.getByText('Pedido 2')).toBeTruthy()
    })

    fireEvent.press(screen.getByText('Entregado'))

    await waitFor(() => {
      expect(screen.queryByText('Pedido 1')).toBeNull()
      expect(screen.getByText('Pedido 2')).toBeTruthy()
    })
  })

  it('cancels an order', async () => {
    const screen = render(<ClientOrdersScreen />)

    await waitFor(() => {
      expect(screen.getByText('Pedido 1')).toBeTruthy()
    })

    fireEvent.press(screen.getAllByText('Cancelar')[0])

    await waitFor(() => {
      expect(mockCancelOrder).toHaveBeenCalledWith('o1')
    })
  })
})
