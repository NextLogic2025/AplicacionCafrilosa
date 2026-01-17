import React from 'react'
import { fireEvent, render, waitFor } from '@testing-library/react-native'

const mockNavigate = jest.fn()
const mockGetKPIs = jest.fn()
const mockGetVisits = jest.fn()
const mockGetAlerts = jest.fn()
const mockGetProductsPaginated = jest.fn()
const mockGetUserName = jest.fn()

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

jest.mock('../../../../../../src/components/ui/ExpandableFab', () => ({
  ExpandableFab: ({ actions }: any) => {
    const React = require('react')
    const { View, TouchableOpacity, Text } = require('react-native')
    return (
      <View>
        {actions.map((a: any) => (
          <TouchableOpacity key={a.label} onPress={a.onPress}>
            <Text>{a.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    )
  },
}))

jest.mock('../../../../../../src/context/CartContext', () => ({
  useCart: () => ({
    totalItems: 2,
    cart: { total_final: 50 },
  }),
}))

jest.mock('../../../../../../src/storage/authStorage', () => ({
  getUserName: (...args: any[]) => mockGetUserName(...args),
}))

jest.mock('../../../../../../src/services/api/SellerService', () => ({
  SellerService: {
    getDashboardKPIs: (...args: any[]) => mockGetKPIs(...args),
    getScheduledVisits: (...args: any[]) => mockGetVisits(...args),
    getAlerts: (...args: any[]) => mockGetAlerts(...args),
  },
}))

jest.mock('../../../../../../src/services/api/CatalogService', () => ({
  CatalogService: {
    getProductsPaginated: (...args: any[]) => mockGetProductsPaginated(...args),
  },
}))

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { SellerHomeScreen } = require('../../../../../../src/features/vendedor/screens/ModuloInicio/SellerHomeScreen')

describe('integration/vendedor/SellerHomeScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetUserName.mockResolvedValue('Juan')
    mockGetKPIs.mockResolvedValue({ todayOrders: 3, activeClients: 5, overdueInvoices: 1 })
    mockGetVisits.mockResolvedValue([{ id: 'v1', time: '10:00', clientName: 'Cliente Uno', address: 'Calle 1' }])
    mockGetAlerts.mockResolvedValue([{ id: 'a1', type: 'order_rejected', message: 'Pedido rechazado', clientName: 'Cliente Uno' }])
    mockGetProductsPaginated.mockResolvedValue({
      metadata: { total_items: 1, page: 1, per_page: 10, total_pages: 1 },
      items: [{ id: 'p1', nombre: 'Prod', precio_original: 10, precio_oferta: 8, ahorro: 2 }],
    })
  })

  it('loads dashboard data and navigates via FAB and sections', async () => {
    const screen = render(<SellerHomeScreen />)

    await waitFor(() => expect(screen.getByText('Pedidos Hoy')).toBeTruthy())
    expect(screen.getByText('3')).toBeTruthy()
    expect(screen.getAllByText('Cliente Uno')[0]).toBeTruthy()
    expect(screen.getByText('Prod')).toBeTruthy()

    fireEvent.press(screen.getByText('Mi Rutero Semanal'))
    expect(mockNavigate).toHaveBeenCalledWith('SellerRoute')

    fireEvent.press(screen.getByText('Ver todas las promociones'))
    expect(mockNavigate).toHaveBeenCalledWith('SellerPromotions')

    fireEvent.press(screen.getByText('Promociones'))
    expect(mockNavigate).toHaveBeenCalledWith('SellerPromotions')
  })
})
