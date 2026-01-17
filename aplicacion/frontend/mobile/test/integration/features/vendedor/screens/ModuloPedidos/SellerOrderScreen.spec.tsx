import React from 'react'
import { Alert } from 'react-native'
import { fireEvent, render, waitFor } from '@testing-library/react-native'

jest.mock('@react-navigation/native', () => ({
  useRoute: () => ({ params: { preselectedClient: { id: 'c1', nombre_comercial: 'Cliente 1', razon_social: 'Cliente 1', identificacion: '111' } } }),
}))

jest.mock('../../../../../../src/navigation/navigationRef', () => ({
  navigationRef: { isReady: () => false, navigate: jest.fn(), dispatch: jest.fn() },
}))

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { SellerOrderScreen } = require('../../../../../../src/features/vendedor/screens/ModuloPedidos/SellerOrderScreen')

describe('integration/vendedor/SellerOrderScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.spyOn(Alert, 'alert').mockImplementation(() => {})
  })

  it('adds items and sends order', async () => {
    const screen = render(<SellerOrderScreen />)

    await waitFor(() => expect(screen.getByText('Cliente 1')).toBeTruthy())

    fireEvent.press(screen.getByText('+ Agregar'))
    await waitFor(() => expect(screen.getByText(/Producto Ejemplo/)).toBeTruthy())

    fireEvent.press(screen.getByText('Enviar Pedido'))
    expect(Alert.alert).toHaveBeenCalled()
  })
})

