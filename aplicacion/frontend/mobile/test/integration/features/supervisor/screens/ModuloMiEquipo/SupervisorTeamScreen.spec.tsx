import React from 'react'
import { fireEvent, render, waitFor } from '@testing-library/react-native'

const mockNavigate = jest.fn()
const mockGetUsers = jest.fn()

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

jest.mock('../../../../../../src/services/api/UserService', () => ({
  UserService: {
    getUsers: (...args: any[]) => mockGetUsers(...args),
  },
}))

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { SupervisorTeamScreen } = require('../../../../../../src/features/supervisor/screens/ModuloMiEquipo/SupervisorTeamScreen')

describe('integration/supervisor/SupervisorTeamScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetUsers.mockResolvedValue([
      { id: 'u1', name: 'Alice Supervisor', role: 'Supervisor', email: 'alice@c.com', phone: '1', active: true },
      { id: 'u2', name: 'Bob Vendor', role: 'Vendedor', email: 'bob@c.com', phone: '2', active: true },
      { id: 'u3', name: 'Charlie Transportista', role: 'Transportista', email: 'char@c.com', phone: '3', active: false },
    ])
  })

  it('loads team, filters by role/search, and navigates to detail', async () => {
    const screen = render(<SupervisorTeamScreen />)

    await waitFor(() => expect(screen.getByText('Alice Supervisor')).toBeTruthy())
    expect(mockGetUsers).toHaveBeenCalled()

    fireEvent.press(screen.getByText('Alice Supervisor'))
    expect(mockNavigate).toHaveBeenCalledWith('SupervisorTeamDetail', { user: expect.objectContaining({ id: 'u1' }) })
    mockNavigate.mockClear()

    fireEvent.press(screen.getAllByText('Vendedor')[0])
    await waitFor(() => {
      expect(screen.getByText('Bob Vendor')).toBeTruthy()
      expect(screen.queryByText('Alice Supervisor')).toBeNull()
    })

    fireEvent.press(screen.getByText('Todos'))
    fireEvent.changeText(screen.getByPlaceholderText('Buscar miembro...'), 'charlie')

    await waitFor(() => {
      expect(screen.getByText('Charlie Transportista')).toBeTruthy()
      expect(screen.queryByText('Bob Vendor')).toBeNull()
    })
  })

  it('navigates to create new member', async () => {
    const screen = render(<SupervisorTeamScreen />)
    await waitFor(() => expect(screen.getByText('Alice Supervisor')).toBeTruthy())

    fireEvent.press(screen.getAllByText('add')[0])
    expect(mockNavigate).toHaveBeenCalledWith('SupervisorTeamDetail', { user: null })
  })
})
