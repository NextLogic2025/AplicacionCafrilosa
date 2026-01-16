import React from 'react'
import { act, fireEvent, render, waitFor } from '@testing-library/react-native'

const mockReset = jest.fn()

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ reset: mockReset }),
  useFocusEffect: (cb: any) => {
    const React = require('react')
    React.useEffect(() => cb(), [cb])
  },
}))

jest.mock('../../../../../../src/navigation/navigationRef', () => ({
  navigationRef: { isReady: () => false, navigate: jest.fn(), dispatch: jest.fn() },
}))

const mockShowToast = jest.fn()
jest.mock('../../../../../../src/context/ToastContext', () => ({
  useToast: () => ({ showToast: mockShowToast }),
}))

const mockGetProfile = jest.fn()
const mockUpdateProfile = jest.fn()
jest.mock('../../../../../../src/services/api/UserService', () => ({
  UserService: {
    getProfile: (...args: any[]) => mockGetProfile(...args),
    updateProfile: (...args: any[]) => mockUpdateProfile(...args),
  },
}))

const mockGetMyClientData = jest.fn()
jest.mock('../../../../../../src/services/api/ClientService', () => ({
  ClientService: {
    getMyClientData: (...args: any[]) => mockGetMyClientData(...args),
  },
}))

const mockSignOut = jest.fn()
jest.mock('../../../../../../src/services/auth/authClient', () => ({
  signOut: (...args: any[]) => mockSignOut(...args),
}))

jest.mock('../../../../../../src/components/profile/UserProfileTemplate', () => ({
  UserProfileTemplate: ({ user, onLogout, onUpdateProfile }: any) => {
    const React = require('react')
    const { Pressable, Text } = require('react-native')
    return (
      <>
        <Text>{user.name}</Text>
        <Pressable onPress={onLogout}>
          <Text>Logout</Text>
        </Pressable>
        <Pressable onPress={() => onUpdateProfile({ nombre: 'Nuevo', telefono: '099' })}>
          <Text>UpdateProfile</Text>
        </Pressable>
      </>
    )
  },
}))

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { ClientProfileScreen } = require('../../../../../../src/features/cliente/screens/ModuloPerfil/ClientProfileScreen')

describe('integration/cliente/ClientProfileScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetProfile.mockResolvedValue({ id: 'u1', name: 'Denis', email: 'a@b.com', phone: '1', role: 'cliente' })
    mockGetMyClientData.mockResolvedValue({
      identificacion: 'X',
      tipo_identificacion: 'RUC',
      razon_social: 'RS',
      lista_precios_id: 1,
      zona_comercial_id: null,
      tiene_credito: false,
      limite_credito: '0',
      saldo_actual: '0',
      dias_plazo: 0,
    })
    mockUpdateProfile.mockResolvedValue(true)
    mockSignOut.mockResolvedValue(undefined)
  })

  it('loads profile', async () => {
    const screen = render(<ClientProfileScreen />)
    await waitFor(() => {
      expect(screen.getByText('Denis')).toBeTruthy()
    })
  })

  it('logs out and resets navigation', async () => {
    jest.useFakeTimers()
    const screen = render(<ClientProfileScreen />)

    await waitFor(() => expect(screen.getByText('Logout')).toBeTruthy())
    await act(async () => {
      fireEvent.press(screen.getByText('Logout'))
    })

    expect(mockSignOut).toHaveBeenCalled()
    expect(mockShowToast).toHaveBeenCalledWith(expect.stringMatching(/cerrada/i), 'success')

    act(() => {
      jest.advanceTimersByTime(300)
    })
    expect(mockReset).toHaveBeenCalled()
    jest.useRealTimers()
  })

  it('updates profile via template callback', async () => {
    const screen = render(<ClientProfileScreen />)
    await waitFor(() => expect(screen.getByText('UpdateProfile')).toBeTruthy())

    await act(async () => {
      fireEvent.press(screen.getByText('UpdateProfile'))
    })

    await waitFor(() => {
      expect(mockUpdateProfile).toHaveBeenCalledWith('u1', { nombre: 'Nuevo', telefono: '099' })
    })
    await waitFor(() => {
      expect(mockGetProfile).toHaveBeenCalledTimes(2)
    })
  })
})
