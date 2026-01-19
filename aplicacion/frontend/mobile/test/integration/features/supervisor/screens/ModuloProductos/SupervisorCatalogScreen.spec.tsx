import React from 'react'
import { fireEvent, render, waitFor } from '@testing-library/react-native'

const mockNavigate = jest.fn()

const mockGetProducts = jest.fn()
const mockGetCategories = jest.fn()
const mockGetCampaigns = jest.fn()

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: mockNavigate, goBack: jest.fn() }),
  useIsFocused: () => true,
}))

jest.mock('../../../../../../src/navigation/navigationRef', () => ({
  navigationRef: { isReady: () => false, navigate: jest.fn(), dispatch: jest.fn() },
}))

jest.mock('../../../../../../src/services/api/CatalogService', () => ({
  CatalogService: {
    getProducts: (...args: any[]) => mockGetProducts(...args),
    getCategories: (...args: any[]) => mockGetCategories(...args),
  },
}))

jest.mock('../../../../../../src/services/api/PromotionService', () => ({
  PromotionService: {
    getCampaigns: (...args: any[]) => mockGetCampaigns(...args),
  },
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

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { SupervisorCatalogScreen } = require('../../../../../../src/features/supervisor/screens/ModuloProductos/SupervisorCatalogScreen')

describe('integration/supervisor/SupervisorCatalogScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetProducts.mockResolvedValue([
      {
        id: 'p1',
        nombre: 'Producto Uno',
        codigo_sku: 'SKU1',
        categoria_id: 1,
        activo: true,
        precios: [{ lista_id: 1 }],
        promociones: [],
      },
      {
        id: 'p2',
        nombre: 'Producto Dos',
        codigo_sku: 'SKU2',
        categoria_id: 2,
        activo: true,
        precios: [],
        promociones: [{ id: 99 }],
        precio_original: 100,
        precio_oferta: 80,
      },
    ])
    mockGetCategories.mockResolvedValue([
      { id: 1, nombre: 'Cat A', activo: true },
      { id: 2, nombre: 'Cat B', activo: true },
    ])
    mockGetCampaigns.mockResolvedValue([
      { id: 'c1', nombre: 'Campaña', fecha_inicio: new Date().toISOString(), fecha_fin: new Date().toISOString(), activo: true, alcance: 'GLOBAL' },
    ])
  })

  it('loads products, filters and navigates', async () => {
    const screen = render(<SupervisorCatalogScreen />)

    await waitFor(() => expect(screen.getByText('Producto Uno')).toBeTruthy())
    expect(mockGetProducts).toHaveBeenCalled()

    fireEvent.press(screen.getByText('Cat B'))
    await waitFor(() => {
      expect(screen.getByText('Producto Dos')).toBeTruthy()
      expect(screen.queryByText('Producto Uno')).toBeNull()
    })

    fireEvent.press(screen.getByText('Todas'))
    fireEvent.changeText(screen.getByPlaceholderText('Buscar producto...'), 'SKU1')
    await waitFor(() => {
      expect(screen.getByText('Producto Uno')).toBeTruthy()
      expect(screen.queryByText('Producto Dos')).toBeNull()
    })

    fireEvent.press(screen.getByText('Producto Uno'))
    expect(mockNavigate).toHaveBeenCalledWith('SupervisorProductDetail', { productId: 'p1' })

    fireEvent.press(screen.getByText(/Categor/i))
    expect(mockNavigate).toHaveBeenCalledWith('SupervisorCategories')
  })
})
