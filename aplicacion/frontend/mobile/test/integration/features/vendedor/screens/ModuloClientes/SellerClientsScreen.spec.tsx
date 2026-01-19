import React from 'react'
import { fireEvent, render, waitFor } from '@testing-library/react-native'

const mockNavigate = jest.fn()
const mockGetMyClients = jest.fn()
const mockGetPriceLists = jest.fn()

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

jest.mock('../../../../../../src/services/api/ClientService', () => ({
  ClientService: {
    getMyClients: (...args: any[]) => mockGetMyClients(...args),
    getPriceLists: (...args: any[]) => mockGetPriceLists(...args),
  },
}))

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { SellerClientsScreen } = require('../../../../../../src/features/vendedor/screens/ModuloClientes/SellerClientsScreen')

describe('integration/vendedor/SellerClientsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetMyClients.mockResolvedValue([
      {
        id: 'c1',
        razon_social: 'Cliente Activo',
        nombre_comercial: 'Activo SA',
        identificacion: '123',
        lista_precios_id: 1,
        bloqueado: false,
        zona_comercial_nombre: 'Zona 1',
      },
      {
        id: 'c2',
        razon_social: 'Cliente Bloq',
        nombre_comercial: 'Bloq SA',
        identificacion: '456',
        lista_precios_id: 2,
        bloqueado: true,
        zona_comercial_nombre: 'Zona 2',
      },
    ])
    mockGetPriceLists.mockResolvedValue([
      { id: 1, nombre: 'General' },
      { id: 2, nombre: 'VIP' },
    ])
  })

  it('loads clients, filters and navigates to detail', async () => {
    const screen = render(<SellerClientsScreen />)

    await waitFor(() => expect(screen.getByText('Activo SA')).toBeTruthy())
    expect(mockGetMyClients).toHaveBeenCalled()
    expect(screen.getByText('General')).toBeTruthy()

    fireEvent.changeText(screen.getByPlaceholderText('Buscar por nombre o RUC...'), '456')
    await waitFor(() => {
      expect(screen.getByText('Bloq SA')).toBeTruthy()
      expect(screen.queryByText('Activo SA')).toBeNull()
    })

    fireEvent.press(screen.getByText('Ver detalles'))
    expect(mockNavigate).toHaveBeenCalledWith('SellerClientDetail', { clientId: 'c2' })
  })
})

