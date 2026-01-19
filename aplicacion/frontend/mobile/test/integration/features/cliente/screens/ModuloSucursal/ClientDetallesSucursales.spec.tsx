import React from 'react'
import { act, fireEvent, render, waitFor } from '@testing-library/react-native'

const mockGoBack = jest.fn()
let mockRoute: any = { params: { branchId: 'b1' } }

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ goBack: mockGoBack, navigate: jest.fn() }),
  useRoute: () => mockRoute,
}))

jest.mock('../../../../../../src/navigation/navigationRef', () => ({
  navigationRef: { isReady: () => false, navigate: jest.fn(), dispatch: jest.fn() },
}))

const mockGetClientBranchById = jest.fn()
const mockGetCommercialZoneById = jest.fn()
const mockUpdateClientBranch = jest.fn()
jest.mock('../../../../../../src/services/api/ClientService', () => ({
  ClientService: {
    getClientBranchById: (...args: any[]) => mockGetClientBranchById(...args),
    getCommercialZoneById: (...args: any[]) => mockGetCommercialZoneById(...args),
    updateClientBranch: (...args: any[]) => mockUpdateClientBranch(...args),
  },
}))

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { ClientDetallesSucursalesScreen } = require('../../../../../../src/features/cliente/screens/ModuloSucursal/ClientDetallesSucursales')

describe('integration/cliente/ClientDetallesSucursalesScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockRoute = { params: { branchId: 'b1' } }
    mockGetClientBranchById.mockResolvedValue({
      id: 'b1',
      nombre_sucursal: 'Sucursal 1',
      direccion_entrega: 'Dir',
      activo: true,
      zona_id: null,
      ubicacion_gps: null,
    })
    mockGetCommercialZoneById.mockResolvedValue(null)
    mockUpdateClientBranch.mockResolvedValue({
      id: 'b1',
      nombre_sucursal: 'Sucursal 1',
      direccion_entrega: 'Dir',
      activo: false,
      zona_id: null,
      ubicacion_gps: null,
    })
  })

  it('deactivates branch after confirming modal', async () => {
    jest.useFakeTimers()
    const screen = render(<ClientDetallesSucursalesScreen />)

    await waitFor(() => {
      expect(screen.getByText('Desactivar Sucursal')).toBeTruthy()
    })

    fireEvent.press(screen.getByText('Desactivar Sucursal'))

    await waitFor(() => {
      expect(screen.getAllByText('Desactivar Sucursal').length).toBeGreaterThan(0)
      expect(screen.getByText('Desactivar')).toBeTruthy()
    })

    await act(async () => {
      fireEvent.press(screen.getByText('Desactivar'))
    })

    await waitFor(() => {
      expect(mockUpdateClientBranch).toHaveBeenCalledWith('b1', { activo: false })
    })

    act(() => {
      jest.advanceTimersByTime(300)
    })

    await waitFor(() => {
      expect(screen.getByText(/Éxito|Exito/i)).toBeTruthy()
    })

    jest.useRealTimers()
  })
})
