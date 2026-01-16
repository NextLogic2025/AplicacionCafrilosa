import React from 'react'
import { Alert, Text, View } from 'react-native'
import { act, render, waitFor } from '@testing-library/react-native'

jest.mock('../../../src/services/api/UserService', () => ({
  UserService: {
    getProfile: jest.fn(),
  },
}))

jest.mock('../../../src/services/api/CartService', () => ({
  CartService: {
    getCart: jest.fn(),
    addToCart: jest.fn(),
    removeFromCart: jest.fn(),
    clearCart: jest.fn(),
  },
}))

jest.mock('../../../src/services/api/CatalogService', () => ({
  CatalogService: {
    getClientProducts: jest.fn(),
    getProductsPaginated: jest.fn(),
  },
}))

import { CartProvider, useCart } from '../../../src/context/CartContext'

type Ctx = {
  items: any[]
  totalItems: number
  cart: any
  updateQuantity: (productId: string, qty: number) => Promise<void>
}

function Harness({ onCtx }: { onCtx: (ctx: Ctx) => void }) {
  const ctx = useCart() as Ctx

  React.useEffect(() => {
    onCtx(ctx)
  }, [ctx, onCtx])

  return (
    <View>
      <Text testID="count">{ctx.items.length}</Text>
      <Text testID="totalItems">{ctx.totalItems}</Text>
      <Text testID="totalFinal">{String(ctx.cart.total_final ?? '')}</Text>
      <Text testID="firstName">{ctx.items[0]?.nombre_producto ?? ''}</Text>
      <Text testID="firstPromo">{String(ctx.items[0]?.tiene_promocion ?? '')}</Text>
      <Text testID="firstDiscount">{String(ctx.items[0]?.descuento_porcentaje ?? '')}</Text>
      <Text testID="firstQty">{String(ctx.items[0]?.cantidad ?? '')}</Text>
    </View>
  )
}

describe('context/CartContext', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('loads server cart and maps enriched items + totals', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {})
    const { UserService } = jest.requireMock('../../../src/services/api/UserService') as { UserService: { getProfile: jest.Mock } }
    const { CartService } = jest.requireMock('../../../src/services/api/CartService') as { CartService: { getCart: jest.Mock } }
    const { CatalogService } = jest.requireMock('../../../src/services/api/CatalogService') as {
      CatalogService: { getClientProducts: jest.Mock; getProductsPaginated: jest.Mock }
    }

    UserService.getProfile.mockResolvedValue({ id: 'u1', role: 'cliente' })
    CartService.getCart.mockResolvedValue({
      items: [
        {
          id: 'i1',
          producto_id: 'p1',
          cantidad: 2,
          precio_original_snapshot: 10,
          precio_unitario_ref: 7,
          codigo_sku: 'SKU-OLD',
          nombre_producto: 'Nombre OLD',
          unidad_medida: 'UN',
        },
      ],
      subtotal: 14,
      descuento_total: 6,
      impuestos_total: 1.68,
      total_final: 15.68,
    })

    const productsResponse = { metadata: { total_items: 1, page: 1, per_page: 1000, total_pages: 1 }, items: [{ id: 'p1', nombre: 'Nombre REAL', codigo_sku: 'SKU1', unidad_medida: 'KG', imagen_url: 'u', activo: true }] }
    CatalogService.getClientProducts.mockResolvedValue(productsResponse)
    CatalogService.getProductsPaginated.mockResolvedValue(productsResponse)

    let ctx: Ctx | null = null
    const screen = render(
      <CartProvider>
        <Harness onCtx={(c) => (ctx = c)} />
      </CartProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('count').props.children).toBe(1)
      expect(screen.getByTestId('firstName').props.children).toBe('Nombre REAL')
      expect(screen.getByTestId('firstPromo').props.children).toBe('true')
      expect(screen.getByTestId('firstDiscount').props.children).toBe('30')
      expect(screen.getByTestId('totalItems').props.children).toBe(2)
      expect(Number(screen.getByTestId('totalFinal').props.children)).toBeCloseTo(15.68, 2)
    })

    expect(ctx?.items[0].producto_id).toBe('p1')
    expect(CartService.getCart).toHaveBeenCalledWith({ type: 'me' })
    expect(alertSpy).not.toHaveBeenCalled()
    alertSpy.mockRestore()
  })

  it('updateQuantity calls CartService.addToCart and refreshes cart', async () => {
    const { UserService } = jest.requireMock('../../../src/services/api/UserService') as { UserService: { getProfile: jest.Mock } }
    const { CartService } = jest.requireMock('../../../src/services/api/CartService') as { CartService: { getCart: jest.Mock; addToCart: jest.Mock } }
    const { CatalogService } = jest.requireMock('../../../src/services/api/CatalogService') as {
      CatalogService: { getClientProducts: jest.Mock; getProductsPaginated: jest.Mock }
    }

    UserService.getProfile.mockResolvedValue({ id: 'u1', role: 'cliente' })

    const cart1 = {
      items: [{ id: 'i1', producto_id: 'p1', cantidad: 1, precio_original_snapshot: 10, precio_unitario_ref: 7 }],
      subtotal: 7,
      descuento_total: 3,
      impuestos_total: 0.84,
      total_final: 7.84,
    }
    const cart2 = {
      items: [{ id: 'i1', producto_id: 'p1', cantidad: 3, precio_original_snapshot: 10, precio_unitario_ref: 7 }],
      subtotal: 21,
      descuento_total: 9,
      impuestos_total: 2.52,
      total_final: 23.52,
    }
    CartService.getCart.mockResolvedValueOnce(cart1).mockResolvedValueOnce(cart2)
    CartService.addToCart.mockResolvedValue(undefined)

    const productsResponse = { metadata: { total_items: 1, page: 1, per_page: 1000, total_pages: 1 }, items: [{ id: 'p1', nombre: 'Nombre REAL', codigo_sku: 'SKU1', unidad_medida: 'KG', activo: true }] }
    CatalogService.getClientProducts.mockResolvedValue(productsResponse)
    CatalogService.getProductsPaginated.mockResolvedValue(productsResponse)

    let ctx: Ctx | null = null
    const screen = render(
      <CartProvider>
        <Harness onCtx={(c) => (ctx = c)} />
      </CartProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('firstQty').props.children).toBe('1')
    })

    await act(async () => {
      await ctx!.updateQuantity('p1', 3)
    })

    await waitFor(() => {
      expect(CartService.addToCart).toHaveBeenCalledWith({ type: 'me' }, { producto_id: 'p1', cantidad: 3 })
      expect(screen.getByTestId('firstQty').props.children).toBe('3')
    })
  })
})
