import React from 'react'
import { TextInput } from 'react-native'
import { fireEvent, render, waitFor } from '@testing-library/react-native'
import { LoginScreen } from '../../../../../src/features/auth/screens/LoginScreen'

jest.mock('../../../../../src/services/auth/authClient', () => ({
  signIn: jest.fn(),
}))

describe('integration/auth/LoginScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('calls onForgotPassword when pressed', () => {
    const onSignedIn = jest.fn()
    const onForgotPassword = jest.fn()
    const screen = render(<LoginScreen onSignedIn={onSignedIn} onForgotPassword={onForgotPassword} />)

    fireEvent.press(screen.getByText(/olvid/i))
    expect(onForgotPassword).toHaveBeenCalled()
  })

  it('signs in and calls onSignedIn with role', async () => {
    const { signIn } = jest.requireMock('../../../../../src/services/auth/authClient') as { signIn: jest.Mock }
    signIn.mockResolvedValue({ token: 't', user: { role: 'cliente' } })

    const onSignedIn = jest.fn()
    const screen = render(<LoginScreen onSignedIn={onSignedIn} onForgotPassword={() => {}} />)

    const emailInput = screen.UNSAFE_getByProps({ textContentType: 'emailAddress' }) as React.ComponentProps<typeof TextInput>
    const passwordInput = screen.UNSAFE_getByProps({ textContentType: 'password' }) as React.ComponentProps<typeof TextInput>

    fireEvent.changeText(emailInput as any, 'user@cafrilosa.com')
    fireEvent.changeText(passwordInput as any, 'Password123!')

    fireEvent.press(screen.getByRole('button'))

    await waitFor(() => {
      expect(signIn).toHaveBeenCalledWith('user@cafrilosa.com', 'Password123!')
      expect(onSignedIn).toHaveBeenCalledWith('cliente')
    })
  })

  it('shows server error when signIn fails', async () => {
    const { signIn } = jest.requireMock('../../../../../src/services/auth/authClient') as { signIn: jest.Mock }
    signIn.mockRejectedValue(new Error('Credenciales inválidas'))

    const screen = render(<LoginScreen onSignedIn={() => {}} onForgotPassword={() => {}} />)

    const emailInput = screen.UNSAFE_getByProps({ textContentType: 'emailAddress' }) as React.ComponentProps<typeof TextInput>
    const passwordInput = screen.UNSAFE_getByProps({ textContentType: 'password' }) as React.ComponentProps<typeof TextInput>

    fireEvent.changeText(emailInput as any, 'user@cafrilosa.com')
    fireEvent.changeText(passwordInput as any, 'badbad')
    fireEvent.press(screen.getByRole('button'))

    await waitFor(() => {
      expect(screen.getByText(/credenciales/i)).toBeTruthy()
    })
  })
})
