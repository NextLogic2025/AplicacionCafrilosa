import React from 'react'
import { Switch } from 'react-native'
import { fireEvent, render, waitFor } from '@testing-library/react-native'

const mockNavigate = jest.fn()
const mockGetCampaigns = jest.fn()
const mockUpdateCampaign = jest.fn()

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

jest.mock('../../../../../../src/services/api/PromotionService', () => ({
  PromotionService: {
    getCampaigns: (...args: any[]) => mockGetCampaigns(...args),
    updateCampaign: (...args: any[]) => mockUpdateCampaign(...args),
  },
}))

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { SupervisorPromotionsScreen } = require('../../../../../../src/features/supervisor/screens/ModuloPromocion/SupervisorPromotionsScreen')

describe('integration/supervisor/SupervisorPromotionsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetCampaigns.mockResolvedValue([
      { id: 'p1', nombre: 'Promo Global', alcance: 'GLOBAL', activo: true, tipo_descuento: 'PORCENTAJE', valor_descuento: 10, fecha_inicio: new Date().toISOString(), fecha_fin: new Date().toISOString() },
      { id: 'p2', nombre: 'Promo Lista', alcance: 'POR_LISTA', activo: false, tipo_descuento: 'VALOR', valor_descuento: 5, fecha_inicio: new Date().toISOString(), fecha_fin: new Date().toISOString() },
    ])
    mockUpdateCampaign.mockResolvedValue({})
  })

  it('loads campaigns, filters and toggles status', async () => {
    const screen = render(<SupervisorPromotionsScreen />)

    await waitFor(() => expect(screen.getByText('Promo Global')).toBeTruthy())
    expect(mockGetCampaigns).toHaveBeenCalled()

    fireEvent.press(screen.getByText('Por Lista'))
    await waitFor(() => {
      expect(screen.getByText('Promo Lista')).toBeTruthy()
      expect(screen.queryByText('Promo Global')).toBeNull()
    })

    fireEvent.press(screen.getByText('Todas'))
    await waitFor(() => expect(screen.getByText('Promo Global')).toBeTruthy())

    const switches = screen.UNSAFE_getAllByType(Switch)
    fireEvent(switches[0], 'valueChange', false)
    await waitFor(() => expect(mockUpdateCampaign).toHaveBeenCalledWith('p1', { activo: false }))

    fireEvent.press(screen.getByText('Promo Global'))
    expect(mockNavigate).toHaveBeenCalledWith('SupervisorPromotionForm', { campaign: expect.objectContaining({ id: 'p1' }) })
  })
})
