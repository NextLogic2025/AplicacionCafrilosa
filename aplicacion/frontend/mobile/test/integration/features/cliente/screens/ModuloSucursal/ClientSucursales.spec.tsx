import React from 'react'
import { fireEvent, render, waitFor } from '@testing-library/react-native'

const mockNavigate = jest.fn()
const mockGoBack = jest.fn()

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: mockNavigate, goBack: mockGoBack }),
  useFocusEffect: (cb: any) => {
    const React = require('react')
    React.useEffect(() => cb(), [cb])
  },
}))

jest.mock('../../../../../../src/navigation/navigationRef', () => ({
  navigationRef: { isReady: () => false, navigate: jest.fn(), dispatch: jest.fn() },
}))

const mockGetMyClientData = jest.fn()
const mockGetClientBranches = jest.fn()
const mockGetDeactivatedClientBranches = jest.fn()
jest.mock('../../../../../../src/services/api/ClientService', () => ({
  ClientService: {
    getMyClientData: (...args: any[]) => mockGetMyClientData(...args),
    getClientBranches: (...args: any[]) => mockGetClientBranches(...args),
    getDeactivatedClientBranches: (...args: any[]) => mockGetDeactivatedClientBranches(...args),
  },
}))

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { ClientSucursalesScreen } = require('../../../../../../src/features/cliente/screens/ModuloSucursal/ClientSucursales')

describe('integration/cliente/ClientSucursalesScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetMyClientData.mockResolvedValue({ id: 'c1' })
    mockGetClientBranches.mockResolvedValue([{ id: 'b1', nombre_sucursal: 'Sucursal 1', direccion_entrega: 'Dir', activo: true }])
    mockGetDeactivatedClientBranches.mockResolvedValue([{ id: 'b2', nombre_sucursal: 'Sucursal 2', direccion_entrega: 'Dir2', activo: false }])
  })

  it('loads active branches and navigates to details', async () => {
    const screen = render(<ClientSucursalesScreen />)

    await waitFor(() => {
      expect(screen.getByText('Sucursal 1')).toBeTruthy()
    })

    fireEvent.press(screen.getByText('Sucursal 1'))
    expect(mockNavigate).toHaveBeenCalledWith('ClientDetallesSucursales', { branchId: 'b1' })
  })

  it('switches to inactive filter and loads deactivated branches', async () => {
    const screen = render(<ClientSucursalesScreen />)

    await waitFor(() => {
      expect(screen.getByText('Sucursal 1')).toBeTruthy()
    })

    fireEvent.press(screen.getByText('Inactivas'))

    await waitFor(() => {
      expect(screen.queryByText('Sucursal 1')).toBeNull()
      expect(screen.getByText('Sucursal 2')).toBeTruthy()
    })
  })

  it('navigates to create screen when pressing +', async () => {
    const screen = render(<ClientSucursalesScreen />)

    await waitFor(() => {
      expect(screen.getByText('add')).toBeTruthy()
    })

    fireEvent.press(screen.getByText('add').parent as any)
    expect(mockNavigate).toHaveBeenCalledWith('CrearClienteSucursales')
  })
})
