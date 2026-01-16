import React from 'react'
import { TouchableOpacity } from 'react-native'
import { fireEvent, render } from '@testing-library/react-native'
import { ClientProductCard } from '../../../../src/components/ui/ClientProductCard'
import type { Product } from '../../../../src/services/api/CatalogService'

const productBase: Product = {
  id: 'p1',
  codigo_sku: 'SKU-1',
  nombre: 'Producto 1',
  activo: true,
  precio_original: 10,
  precio_oferta: 8,
  ahorro: 2,
}

describe('components/ui/ClientProductCard', () => {
  it('calls onPress when pressing the card', () => {
    const onPress = jest.fn()
    const screen = render(<ClientProductCard product={productBase} onPress={onPress} />)
    fireEvent.press(screen.UNSAFE_getByType(TouchableOpacity))
    expect(onPress).toHaveBeenCalledWith(productBase)
  })

  it('calls onAddToCart when pressing Agregar', () => {
    const onPress = jest.fn()
    const onAddToCart = jest.fn()
    const screen = render(<ClientProductCard product={productBase} onPress={onPress} onAddToCart={onAddToCart} />)
    fireEvent.press(screen.getByText('Agregar'), { stopPropagation: jest.fn() })
    expect(onAddToCart).toHaveBeenCalledWith(productBase)
  })

  it('shows promotion badge when precio_oferta < precio_original', () => {
    const screen = render(<ClientProductCard product={productBase} onPress={() => {}} />)
    expect(screen.getByText(/promoci/i)).toBeTruthy()
  })
})
