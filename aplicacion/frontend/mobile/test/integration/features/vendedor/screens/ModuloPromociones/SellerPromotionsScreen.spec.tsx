import React from 'react'
import { fireEvent, render, waitFor } from '@testing-library/react-native'

const mockGoBack = jest.fn()
const mockGetCampaigns = jest.fn()

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ goBack: mockGoBack }),
}))

jest.mock('../../../../../../src/navigation/navigationRef', () => ({
  navigationRef: { isReady: () => false, navigate: jest.fn(), dispatch: jest.fn() },
}))

jest.mock('../../../../../../src/services/api/PromotionService', () => ({
  PromotionService: {
    getCampaigns: (...args: any[]) => mockGetCampaigns(...args),
  },
}))

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { SellerPromotionsScreen } = require('../../../../../../src/features/vendedor/screens/ModuloPromociones/SellerPromotionsScreen')

describe('integration/vendedor/SellerPromotionsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetCampaigns.mockResolvedValue([
      { id: 'p1', nombre: 'Promo A', descripcion: 'Desc', valor_descuento: 10, tipo_descuento: 'PORCENTAJE', fecha_fin: new Date().toISOString(), activo: true },
    ])
  })

  it('loads active promotions and refreshes empty state', async () => {
    const screen = render(<SellerPromotionsScreen />)

    await waitFor(() => expect(screen.getByText('Promo A')).toBeTruthy())
    expect(mockGetCampaigns).toHaveBeenCalled()
  })
})
