import React from 'react'
import { fireEvent, render, waitFor } from '@testing-library/react-native'

const mockNavigate = jest.fn()
const mockGoBack = jest.fn()
const mockAddListener = jest.fn()

const mockGetClients = jest.fn()
const mockGetBlockedClients = jest.fn()
const mockDeleteClient = jest.fn()
const mockUnblockClient = jest.fn()
const mockGetLists = jest.fn()
const mockGetZones = jest.fn()
const mockGetAllAssignments = jest.fn()
const mockGetVendors = jest.fn()
const mockGetUsers = jest.fn()

jest.mock('../../../../../../src/navigation/navigationRef', () => ({
  navigationRef: { isReady: () => false, navigate: jest.fn(), dispatch: jest.fn() },
}))

jest.mock('../../../../../../src/services/api/ClientService', () => ({
  ClientService: {
    getClients: (...args: any[]) => mockGetClients(...args),
    getBlockedClients: (...args: any[]) => mockGetBlockedClients(...args),
    deleteClient: (...args: any[]) => mockDeleteClient(...args),
    unblockClient: (...args: any[]) => mockUnblockClient(...args),
  },
}))

jest.mock('../../../../../../src/services/api/PriceService', () => ({
  PriceService: {
    getLists: (...args: any[]) => mockGetLists(...args),
  },
}))

jest.mock('../../../../../../src/services/api/ZoneService', () => ({
  ZoneService: {
    getZones: (...args: any[]) => mockGetZones(...args),
  },
}))

jest.mock('../../../../../../src/services/api/AssignmentService', () => ({
  AssignmentService: {
    getAllAssignments: (...args: any[]) => mockGetAllAssignments(...args),
  },
}))

jest.mock('../../../../../../src/services/api/UserService', () => ({
  UserService: {
    getVendors: (...args: any[]) => mockGetVendors(...args),
    getUsers: (...args: any[]) => mockGetUsers(...args),
  },
}))

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { SupervisorClientsScreen } = require('../../../../../../src/features/supervisor/screens/ModuloCliente/SupervisorClientsScreen')

describe('integration/supervisor/SupervisorClientsScreen', () => {
  const navigationMock = {
    navigate: mockNavigate,
    goBack: mockGoBack,
    addListener: mockAddListener,
  } as any

  beforeEach(() => {
    jest.clearAllMocks()

    mockAddListener.mockImplementation((event: string, cb: () => void) => {
      if (event === 'focus') cb?.()
      return jest.fn()
    })

    mockGetClients.mockResolvedValue([
      {
        id: 'c1',
        razon_social: 'Cliente Activo',
        nombre_comercial: 'Activo SA',
        identificacion: '123',
        tipo_identificacion: 'RUC',
        lista_precios_id: 1,
        bloqueado: false,
        zona_comercial_id: 10,
        usuario_principal_id: 'u1',
        usuario_principal_nombre: 'Owner Display',
        tiene_credito: false,
        limite_credito: '0',
        dias_plazo: 0,
        saldo_actual: '0',
      },
      {
        id: 'c3',
        razon_social: 'Cliente VIP',
        nombre_comercial: 'VIP SAC',
        identificacion: '555',
        tipo_identificacion: 'RUC',
        lista_precios_id: 2,
        bloqueado: false,
        zona_comercial_id: 10,
        usuario_principal_id: 'u2',
        usuario_principal_nombre: 'VIP Owner',
        tiene_credito: false,
        limite_credito: '0',
        dias_plazo: 0,
        saldo_actual: '0',
      },
    ])

    mockGetBlockedClients.mockResolvedValue([
      {
        id: 'c2',
        razon_social: 'Cliente Bloqueado',
        nombre_comercial: 'Bloq LLC',
        identificacion: '999',
        tipo_identificacion: 'RUC',
        lista_precios_id: 2,
        bloqueado: true,
        zona_comercial_id: null,
        usuario_principal_id: 'u3',
        usuario_principal_nombre: 'Blocked Owner',
        tiene_credito: false,
        limite_credito: '0',
        dias_plazo: 0,
        saldo_actual: '0',
      },
    ])

    mockGetLists.mockResolvedValue([
      { id: 1, nombre: 'General', activa: true, moneda: 'USD' },
      { id: 2, nombre: 'VIP', activa: true, moneda: 'USD' },
    ])

    mockGetZones.mockResolvedValue([{ id: 10, nombre: 'Zona Norte', codigo: 'ZN', activo: true }])
    mockGetAllAssignments.mockResolvedValue([
      { id: 1, zona_id: 10, vendedor_usuario_id: 'v1', es_principal: true, nombre_vendedor_cache: 'Vendedor Uno' },
    ])
    mockGetVendors.mockResolvedValue([{ id: 'v1', name: 'Vendedor Uno', role: 'Vendedor', email: 'v@c.com', phone: '1', active: true }])
    mockGetUsers.mockResolvedValue([
      { id: 'u1', name: 'Owner Display', role: 'Cliente', email: 'o@c.com', phone: '0', active: true },
      { id: 'u2', name: 'VIP Owner', role: 'Cliente', email: 'vip@c.com', phone: '0', active: true },
      { id: 'u3', name: 'Blocked Owner', role: 'Cliente', email: 'b@c.com', phone: '0', active: false },
    ])
  })

  it('loads clients, filters by status/list, and navigates to detail', async () => {
    const screen = render(<SupervisorClientsScreen navigation={navigationMock} />)

    await waitFor(() => {
      expect(screen.getByText('Owner Display')).toBeTruthy()
      expect(screen.getByText('VIP Owner')).toBeTruthy()
    })

    expect(screen.queryByText('Blocked Owner')).toBeNull()

    fireEvent.press(screen.getByText('Suspendidos'))
    await waitFor(() => {
      expect(screen.getByText('Blocked Owner')).toBeTruthy()
    })

    fireEvent.press(screen.getAllByText('VIP')[0])
    await waitFor(() => {
      expect(screen.getByText('VIP Owner')).toBeTruthy()
      expect(screen.queryByText('Owner Display')).toBeNull()
      expect(screen.queryByText('Blocked Owner')).toBeNull()
    })

    fireEvent.press(screen.getByText('Activos'))
    fireEvent.changeText(screen.getByPlaceholderText('Buscar cliente...'), 'Activo')

    await waitFor(() => {
      expect(screen.getByText('Owner Display')).toBeTruthy()
      expect(screen.queryByText('VIP Owner')).toBeNull()
    })

    fireEvent.press(screen.getByText('Owner Display'))
    expect(mockNavigate).toHaveBeenCalledWith('SupervisorClientDetail', { client: expect.objectContaining({ id: 'c1' }) })
  })

  it('navigates to create client', async () => {
    const screen = render(<SupervisorClientsScreen navigation={navigationMock} />)
    await waitFor(() => expect(screen.getByText('Owner Display')).toBeTruthy())

    fireEvent.press(screen.getAllByText('add')[0])
    expect(mockNavigate).toHaveBeenCalledWith('SupervisorClientForm')
  })
})
