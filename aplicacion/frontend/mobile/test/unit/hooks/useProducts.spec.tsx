import React from 'react'
import { Text, View } from 'react-native'
import { render, waitFor } from '@testing-library/react-native'

jest.mock('../../../src/services/api/ProductService', () => ({
  ProductService: {
    getProducts: jest.fn(),
  },
}))

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { ProductService } = require('../../../src/services/api/ProductService') as { ProductService: { getProducts: jest.Mock } }
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { useProducts } = require('../../../src/hooks/useProducts') as { useProducts: () => any }

function ProductsHarness() {
  const { products, loading, error } = useProducts()
  return (
    <View>
      <Text testID="loading">{String(loading)}</Text>
      <Text testID="error">{error ?? ''}</Text>
      <Text testID="count">{products.length}</Text>
    </View>
  )
}

describe('hooks/useProducts', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('loads products on mount', async () => {
    ProductService.getProducts.mockResolvedValue([{ id: 'p1' }, { id: 'p2' }])
    const screen = render(<ProductsHarness />)

    await waitFor(() => {
      expect(screen.getByTestId('count').props.children).toBe(2)
      expect(screen.getByTestId('loading').props.children).toBe('false')
    })
  })

  it('sets error on failure', async () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
    ProductService.getProducts.mockRejectedValue(new Error('boom'))
    const screen = render(<ProductsHarness />)

    await waitFor(() => {
      expect(String(screen.getByTestId('error').props.children)).toMatch(/Error al cargar productos/i)
      expect(screen.getByTestId('loading').props.children).toBe('false')
    })

    errorSpy.mockRestore()
  })
})

