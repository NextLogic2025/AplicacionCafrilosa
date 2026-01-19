import React from 'react'
import { Alert } from 'react-native'
import { fireEvent, render, waitFor } from '@testing-library/react-native'

const mockNavigate = jest.fn()

const mockGetOrders = jest.fn()
const mockChangeOrderStatus = jest.fn()
const mockGetClients = jest.fn()

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

jest.mock('../../../../../../src/services/api/OrderService', () => ({
  OrderService: {
    getOrders: (...args: any[]) => mockGetOrders(...args),
    changeOrderStatus: (...args: any[]) => mockChangeOrderStatus(...args),
  },
  ORDER_STATUS_LABELS: {
    PENDIENTE: 'Pendiente',
    APROBADO: 'Aprobado',
    EN_PREPARACION: 'En preparación',
    FACTURADO: 'Facturado',
    EN_RUTA: 'En ruta',
    ENTREGADO: 'Entregado',
    ANULADO: 'Anulado',
    RECHAZADO: 'Rechazado',
  },
  ORDER_STATUS_COLORS: {
    PENDIENTE: '#000',
    APROBADO: '#000',
    EN_PREPARACION: '#000',
    FACTURADO: '#000',
    EN_RUTA: '#000',
    ENTREGADO: '#000',
    ANULADO: '#000',
    RECHAZADO: '#000',
  },
}))

jest.mock('../../../../../../src/services/api/ClientService', () => ({
  ClientService: {
    getClients: (...args: any[]) => mockGetClients(...args),
  },
}))

jest.mock('../../../../../../src/components/ui/OrderCard', () => ({
  OrderCard: ({ order, onPress }: any) => {
    const React = require('react')
    const { Pressable, Text } = require('react-native')
    return (
      <Pressable onPress={onPress}>
        <Text>{order.codigo_visual}</Text>
      </Pressable>
    )
  },
}))

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { SupervisorOrdersScreen } = require('../../../../../../src/features/supervisor/screens/ModuloOrders/SupervisorOrdersScreen')

describe('integration/supervisor/SupervisorOrdersScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetOrders.mockResolvedValue([
      { id: 'o1', codigo_visual: 101, estado_actual: 'PENDIENTE', cliente_id: 'c1', total_final: 10, detalles: [{}, {}], created_at: new Date().toISOString() },
      { id: 'o2', codigo_visual: 202, estado_actual: 'APROBADO', cliente_id: 'c2', total_final: 20, detalles: [{}], created_at: new Date().toISOString() },
    ])
    mockGetClients.mockResolvedValue([
      { id: 'c1', razon_social: 'Cliente 1', nombre_comercial: 'Cliente 1', identificacion: '111', lista_precios_id: 1, bloqueado: false, tiene_credito: false, limite_credito: '0', saldo_actual: '0', dias_plazo: 0 },
      { id: 'c2', razon_social: 'Cliente 2', nombre_comercial: 'Cliente 2', identificacion: '222', lista_precios_id: 1, bloqueado: false, tiene_credito: false, limite_credito: '0', saldo_actual: '0', dias_plazo: 0 },
    ])
    mockChangeOrderStatus.mockResolvedValue({})
    jest.spyOn(Alert, 'alert').mockImplementation(() => {})
  })

  it('filters by status and client and navigates', async () => {
    const screen = render(<SupervisorOrdersScreen />)

    await waitFor(() => expect(screen.getByText('101')).toBeTruthy())
    expect(mockGetOrders).toHaveBeenCalled()

    fireEvent.press(screen.getByText('Aprobado'))
    await waitFor(() => {
      expect(screen.getByText('202')).toBeTruthy()
      expect(screen.queryByText('101')).toBeNull()
    })

    fireEvent.press(screen.getByText('Todos'))
    fireEvent.press(screen.getByText('Filtrar por cliente'))
    await waitFor(() => expect(screen.getByText('Cliente 1')).toBeTruthy())
    fireEvent.press(screen.getByText('Cliente 1'))
    await waitFor(() => {
      expect(screen.getByText('101')).toBeTruthy()
      expect(screen.queryByText('202')).toBeNull()
    })

    fireEvent.press(screen.getByText('101'))
    expect(mockNavigate).toHaveBeenCalledWith('SupervisorOrderDetail', { orderId: 'o1' })
  })

  it('changes status from modal', async () => {
    const screen = render(<SupervisorOrdersScreen />)
    await waitFor(() => expect(screen.getByText('101')).toBeTruthy())

    fireEvent.press(screen.getAllByText('Cambiar Estado')[0])
    await waitFor(() => expect(screen.getAllByText('Aprobado').length).toBeGreaterThan(1))

    const aprobarButtons = screen.getAllByText('Aprobado')
    const modalButton = aprobarButtons[aprobarButtons.length - 1]
    fireEvent.press(modalButton)

    await waitFor(() => expect(mockChangeOrderStatus).toHaveBeenCalledWith('o1', 'APROBADO'))
  })
})
