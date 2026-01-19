import React from 'react'
import { fireEvent, render, waitFor } from '@testing-library/react-native'

const mockGoBack = jest.fn()
let mockRoute: any = { params: {} }

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ goBack: mockGoBack, navigate: jest.fn() }),
  useRoute: () => mockRoute,
}))

jest.mock('../../../../../../src/navigation/navigationRef', () => ({
  navigationRef: { isReady: () => false, navigate: jest.fn(), dispatch: jest.fn() },
}))

const mockGetCommercialZones = jest.fn()
const mockGetMyClientData = jest.fn()
jest.mock('../../../../../../src/services/api/ClientService', () => ({
  ClientService: {
    getCommercialZones: (...args: any[]) => mockGetCommercialZones(...args),
    getMyClientData: (...args: any[]) => mockGetMyClientData(...args),
    getClientBranchById: jest.fn(),
    getCommercialZoneById: jest.fn(),
    updateClientBranch: jest.fn(),
    createClientBranch: jest.fn(),
  },
}))

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { CrearClienteSucursalesScreen } = require('../../../../../../src/features/cliente/screens/ModuloSucursal/CrearClienteSucursales')

describe('integration/cliente/CrearClienteSucursalesScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockRoute = { params: {} }
    mockGetCommercialZones.mockResolvedValue([])
    mockGetMyClientData.mockResolvedValue({ id: 'c1' })
  })

  it('shows validation modal when required fields are empty', async () => {
    const screen = render(<CrearClienteSucursalesScreen />)

    await waitFor(() => {
      expect(screen.getByText('Crear Sucursal')).toBeTruthy()
    })

    fireEvent.press(screen.getByText('Crear Sucursal'))

    await waitFor(() => {
      expect(screen.getByText('Campo Incompleto')).toBeTruthy()
    })
  })
})

