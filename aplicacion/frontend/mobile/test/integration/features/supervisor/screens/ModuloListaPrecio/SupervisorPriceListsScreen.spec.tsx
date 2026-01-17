import React from 'react'
import { act, fireEvent, render, waitFor } from '@testing-library/react-native'

const mockGoBack = jest.fn()
const mockNavigate = jest.fn()

const mockGetLists = jest.fn()
const mockCreateList = jest.fn()
const mockUpdateList = jest.fn()
const mockDeleteList = jest.fn()

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ goBack: mockGoBack, navigate: mockNavigate }),
}))

jest.mock('../../../../../../src/navigation/navigationRef', () => ({
  navigationRef: { isReady: () => false, navigate: jest.fn(), dispatch: jest.fn() },
}))

jest.mock('../../../../../../src/services/api/PriceService', () => ({
  PriceService: {
    getLists: (...args: any[]) => mockGetLists(...args),
    createList: (...args: any[]) => mockCreateList(...args),
    updateList: (...args: any[]) => mockUpdateList(...args),
    deleteList: (...args: any[]) => mockDeleteList(...args),
  },
}))

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { SupervisorPriceListsScreen } = require('../../../../../../src/features/supervisor/screens/ModuloListaPrecio/SupervisorPriceListsScreen')

describe('integration/supervisor/SupervisorPriceListsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetLists.mockResolvedValue([
      { id: 1, nombre: 'General', activa: true, moneda: 'USD' },
      { id: 2, nombre: 'VIP', activa: false, moneda: 'USD' },
    ])
    mockCreateList.mockResolvedValue({ id: 3, nombre: 'Mayorista', activa: true, moneda: 'USD' })
    mockUpdateList.mockImplementation(async (_id: number, payload: any) => ({ id: _id, ...payload, moneda: 'USD' }))
    mockDeleteList.mockResolvedValue(undefined)
  })

  it('loads lists, creates and edits', async () => {
    const screen = render(<SupervisorPriceListsScreen navigation={{ goBack: mockGoBack }} />)
    await waitFor(() => expect(screen.getByText('General')).toBeTruthy())
    expect(mockGetLists).toHaveBeenCalled()

    // Create
    fireEvent.press(screen.getAllByText('add')[0])
    await waitFor(() => expect(screen.getByText('Nueva Lista')).toBeTruthy())

    fireEvent.changeText(screen.getByPlaceholderText('Ej. Distribuidor A'), 'Mayorista')
    await act(async () => {
      fireEvent.press(screen.getByText('Guardar Lista'))
    })
    await waitFor(() => expect(mockCreateList).toHaveBeenCalledWith(expect.objectContaining({ nombre: 'Mayorista', activa: true, moneda: 'USD' })))

    // Edit
    fireEvent.press(screen.getByText('General'))
    await waitFor(() => expect(screen.getByText('Editar Lista')).toBeTruthy())
    fireEvent.changeText(screen.getByPlaceholderText('Ej. Distribuidor A'), 'General X')
    await act(async () => {
      fireEvent.press(screen.getByText('Guardar Lista'))
    })
    expect(mockUpdateList).toHaveBeenCalledWith(1, expect.objectContaining({ nombre: 'General X', activa: true }))
  })
})

