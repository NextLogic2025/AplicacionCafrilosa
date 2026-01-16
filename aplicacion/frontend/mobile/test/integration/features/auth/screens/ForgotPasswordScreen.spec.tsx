import React from 'react'
import { fireEvent, render, waitFor } from '@testing-library/react-native'
import { ForgotPasswordScreen } from '../../../../../src/features/auth/screens/ForgotPasswordScreen'

jest.mock('../../../../../src/services/auth/authClient', () => ({
  requestPasswordReset: jest.fn(),
}))

describe('integration/auth/ForgotPasswordScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('submits and shows success screen', async () => {
    const { requestPasswordReset } = jest.requireMock('../../../../../src/services/auth/authClient') as { requestPasswordReset: jest.Mock }
    requestPasswordReset.mockResolvedValue(undefined)

    const onBack = jest.fn()
    const screen = render(<ForgotPasswordScreen onBack={onBack} />)

    fireEvent.changeText(screen.getByPlaceholderText('ejemplo@cafrilosa.com'), 'user@cafrilosa.com')
    fireEvent.press(screen.getByRole('button'))

    await waitFor(() => {
      expect(requestPasswordReset).toHaveBeenCalledWith('user@cafrilosa.com')
      expect(screen.getByText(/correo enviado/i)).toBeTruthy()
    })

    fireEvent.press(screen.getByText(/volver al inicio/i))
    expect(onBack).toHaveBeenCalled()
  })

  it('shows server error when request fails', async () => {
    const { requestPasswordReset } = jest.requireMock('../../../../../src/services/auth/authClient') as { requestPasswordReset: jest.Mock }
    requestPasswordReset.mockRejectedValue(new Error('Nope'))

    const screen = render(<ForgotPasswordScreen onBack={() => {}} />)

    fireEvent.changeText(screen.getByPlaceholderText('ejemplo@cafrilosa.com'), 'user@cafrilosa.com')
    fireEvent.press(screen.getByRole('button'))

    await waitFor(() => {
      expect(screen.getByText('Nope')).toBeTruthy()
    })
  })
})

