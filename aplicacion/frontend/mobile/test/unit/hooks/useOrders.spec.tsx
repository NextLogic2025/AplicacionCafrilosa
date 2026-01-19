import React from 'react'
import { Text, View } from 'react-native'
import { render, waitFor } from '@testing-library/react-native'

jest.mock('../../../src/services/api/OrderService', () => ({
  OrderService: {
    getOrders: jest.fn(),
    getOrderById: jest.fn(),
    cancelOrder: jest.fn(),
    changeOrderStatus: jest.fn(),
    getOrderHistory: jest.fn(),
    getOrderStats: jest.fn(() => ({ total: 0, porEstado: {}, totalVentas: 0 })),
  },
}))

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { OrderService } = require('../../../src/services/api/OrderService') as { OrderService: { getOrders: jest.Mock } }
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { useOrders } = require('../../../src/hooks/useOrders') as { useOrders: (opts?: any) => any }

function OrdersHarness() {
  const { orders, loading, error } = useOrders()
  return (
    <View>
      <Text testID="loading">{String(loading)}</Text>
      <Text testID="error">{error ?? ''}</Text>
      <Text testID="count">{orders.length}</Text>
    </View>
  )
}

describe('hooks/useOrders', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('autoFetch loads orders', async () => {
    OrderService.getOrders.mockResolvedValue([{ id: 'o1' }, { id: 'o2' }])
    const screen = render(<OrdersHarness />)

    await waitFor(() => {
      expect(screen.getByTestId('count').props.children).toBe(2)
    })
  })
})

