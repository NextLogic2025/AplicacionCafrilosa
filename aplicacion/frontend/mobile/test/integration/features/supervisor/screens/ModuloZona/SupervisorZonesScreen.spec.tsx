import React from 'react'
import { fireEvent, render, waitFor } from '@testing-library/react-native'

const mockNavigate = jest.fn()
const mockGetZones = jest.fn()
const mockGetAllAssignments = jest.fn()
const mockGetVendors = jest.fn()

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: mockNavigate, goBack: jest.fn() }),
  useFocusEffect: (cb: any) => {
    const React = require('react')
    React.useEffect(() => cb(), [cb])
  },
}))

jest.mock('../../../../../../src/navigation/navigationRef', () => ({
  navigationRef: { isReady: () => false, navigate: jest.fn(), dispatch: jest.fn() },
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
  },
}))

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { SupervisorZonesScreen } = require('../../../../../../src/features/supervisor/screens/ModuloZona/SupervisorZonesScreen')

describe('integration/supervisor/SupervisorZonesScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetZones.mockResolvedValue([
      { id: 1, nombre: 'Zona Norte', codigo: 'ZN', ciudad: 'Loja', activo: true },
      { id: 2, nombre: 'Zona Sur', codigo: 'ZS', ciudad: 'Quito', activo: false },
    ])
    mockGetAllAssignments.mockResolvedValue([
      { id: 9, zona_id: 1, vendedor_usuario_id: 'v1', es_principal: true, nombre_vendedor_cache: 'Vendedor Norte' },
    ])
    mockGetVendors.mockResolvedValue([{ id: 'v1', name: 'Vendedor Norte', role: 'Vendedor', email: '', phone: '', active: true }])
  })

  it('loads zones, filters and navigates', async () => {
    const screen = render(<SupervisorZonesScreen />)
    await waitFor(() => expect(screen.getByText('Zona Norte')).toBeTruthy())
    expect(mockGetZones).toHaveBeenCalled()

    fireEvent.press(screen.getByText('Inactivas'))
    await waitFor(() => {
      expect(screen.getByText('Zona Sur')).toBeTruthy()
      expect(screen.queryByText('Zona Norte')).toBeNull()
    })

    fireEvent.press(screen.getByText('Todas'))
    fireEvent.changeText(screen.getByPlaceholderText(/Buscar zona/i), 'Vendedor Norte')
    await waitFor(() => {
      expect(screen.getByText('Zona Norte')).toBeTruthy()
      expect(screen.queryByText('Zona Sur')).toBeNull()
    })

    fireEvent.press(screen.getByText('Zona Norte'))
    expect(mockNavigate).toHaveBeenCalledWith('SupervisorZoneDetail', { zone: expect.objectContaining({ id: 1 }) })

    fireEvent.press(screen.getAllByText('add')[0])
    expect(mockNavigate).toHaveBeenCalledWith('SupervisorZoneDetail', { zone: null })
  })
})

