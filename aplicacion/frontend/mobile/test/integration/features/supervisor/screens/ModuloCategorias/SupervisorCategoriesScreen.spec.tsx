import React from 'react'
import { act, fireEvent, render, waitFor } from '@testing-library/react-native'

const mockGoBack = jest.fn()
const mockNavigate = jest.fn()

const mockGetCategories = jest.fn()
const mockCreateCategory = jest.fn()
const mockUpdateCategory = jest.fn()
const mockDeleteCategory = jest.fn()

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ goBack: mockGoBack, navigate: mockNavigate }),
}))

jest.mock('../../../../../../src/navigation/navigationRef', () => ({
  navigationRef: { isReady: () => false, navigate: jest.fn(), dispatch: jest.fn() },
}))

jest.mock('../../../../../../src/services/api/CatalogService', () => ({
  CatalogService: {
    getCategories: (...args: any[]) => mockGetCategories(...args),
    createCategory: (...args: any[]) => mockCreateCategory(...args),
    updateCategory: (...args: any[]) => mockUpdateCategory(...args),
    deleteCategory: (...args: any[]) => mockDeleteCategory(...args),
  },
}))

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { SupervisorCategoriesScreen } = require('../../../../../../src/features/supervisor/screens/ModuloCategorias/SupervisorCategoriesScreen')

describe('integration/supervisor/SupervisorCategoriesScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetCategories.mockResolvedValue([
      { id: 1, nombre: 'Lácteos', descripcion: 'Quesos y leche', imagen_url: null, activo: true },
      { id: 2, nombre: 'Bebidas', descripcion: 'Gaseosas', imagen_url: null, activo: false },
    ])
    mockCreateCategory.mockResolvedValue({ id: 3 })
    mockUpdateCategory.mockResolvedValue({})
    mockDeleteCategory.mockResolvedValue({})
  })

  it('loads categories, filters by search, opens detail', async () => {
    const screen = render(<SupervisorCategoriesScreen />)

    await waitFor(() => expect(screen.getByText('Lácteos')).toBeTruthy())
    expect(mockGetCategories).toHaveBeenCalled()

    fireEvent.changeText(screen.getByPlaceholderText(/Buscar categor/i), 'beb')
    await waitFor(() => {
      expect(screen.getByText('Bebidas')).toBeTruthy()
      expect(screen.queryByText('Lácteos')).toBeNull()
    })

    fireEvent.press(screen.getByText('Bebidas'))
    await act(async () => {
      fireEvent.changeText(screen.getByPlaceholderText('Nombre'), 'Bebidas Editadas')
      fireEvent.press(screen.getByText('Guardar'))
    })

    expect(mockUpdateCategory).toHaveBeenCalledWith(2, expect.objectContaining({ nombre: expect.any(String) }))
  })

  it('creates category with validation', async () => {
    const screen = render(<SupervisorCategoriesScreen />)
    await waitFor(() => expect(screen.getByText('Lácteos')).toBeTruthy())

    fireEvent.press(screen.getAllByText('add')[0])
    await waitFor(() => expect(screen.getByPlaceholderText('Nombre')).toBeTruthy())

    fireEvent.press(screen.getByText('Guardar'))
    expect(screen.getByText(/obligatorio/i)).toBeTruthy()

    fireEvent.changeText(screen.getByPlaceholderText('Nombre'), 'Nueva Cat')
    fireEvent.press(screen.getByText('Guardar'))

    await waitFor(() => expect(mockCreateCategory).toHaveBeenCalledWith(expect.objectContaining({ nombre: 'Nueva Cat' })))
  })
})
