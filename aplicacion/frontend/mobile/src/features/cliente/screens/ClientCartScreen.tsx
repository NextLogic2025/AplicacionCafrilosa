import { BRAND_COLORS } from '@cafrilosa/shared-types'
import { Ionicons } from '@expo/vector-icons'
import * as React from 'react'
import { FlatList, Pressable, SafeAreaView, Text, View } from 'react-native'

import { CartItemRow } from '../../../components/ui/CartItemRow'
import { CartSummary } from '../../../components/ui/CartSummary'
import { EmptyState } from '../../../components/ui/EmptyState'
import { PrimaryButton } from '../../../components/ui/PrimaryButton'
import { Header } from '../../../components/ui/Header'
import { useCart } from '../../../hooks/useCart'

export function ClientCartScreen() {
  const { items, updateQuantity, removeItem, totalPrice, totalItems, clearCart } = useCart()
  const [isProcessing, setIsProcessing] = React.useState(false)

  // Placeholder para datos del cliente (debería venir de Context/Store)
  const clientData = {
    creditLimit: 500.00,
    balance: 120.50,
    status: 'active' // 'active' | 'blocked'
  }

  const handleCheckout = React.useCallback(async () => {
    // 1. Validar estado del cliente
    if (clientData.status === 'blocked') {
      alert('❌ No puedes realizar pedidos. Tu cuenta está bloqueada.')
      return
    }

    // 2. Validar cupo de crédito
    const projectedBalance = clientData.balance + totalPrice
    if (projectedBalance > clientData.creditLimit) {
      alert(`⚠️ Excedes tu cupo de crédito.\n\nCupo: $${clientData.creditLimit}\nSaldo actual: $${clientData.balance}\nPedido: $${totalPrice.toFixed(2)}`)
      return
    }

    setIsProcessing(true)
    try {
      // Simular llamada a API
      await new Promise(resolve => setTimeout(resolve, 1500))
      // En producción: mostrar modal de éxito y limpiar carrito
      alert('✅ Pedido confirmado correctamente')
      clearCart()
    } catch (error) {
      console.error('Error al confirmar pedido:', error)
      alert('Error al procesar el pedido')
    } finally {
      setIsProcessing(false)
    }
  }, [items, totalPrice, clearCart])

  if (items.length === 0) {
    return (
      <View className="flex-1 bg-neutral-50">
        <Header
          userName="Usuario"
          variant="standard"
          title="Mi Carrito"
        />
        <View className="flex-1 items-center justify-center px-5">
          <EmptyState
            icon="cart-outline"
            title="Tu carrito está vacío"
            description="Explora nuestro catálogo y agrega los productos que necesitas."
            actionLabel="Ir a Productos"
            onAction={() => {
              // Navegación se maneja via Tab, pero aquí podríamos redirigir
              console.log('Ir a productos')
            }}
          />
        </View>
      </View>
    )
  }

  return (
    <View className="flex-1 bg-neutral-50 relative">
      <Header
        userName="Usuario"
        variant="standard"
        title="Mi Carrito"
      />

      {/* Header con contador */}
      <View className="flex-row items-center justify-between px-5 py-4 bg-white border-b border-neutral-100 z-0">
        <View className="flex-row items-center gap-2">
          <Ionicons name="bag-check-outline" size={24} color={BRAND_COLORS.red} />
          <View>
            <Text className="text-neutral-600 text-xs font-medium">Resumen del Pedido</Text>
            <Text className="text-neutral-900 font-bold text-lg">{totalItems} {totalItems === 1 ? 'producto' : 'productos'}</Text>
          </View>
        </View>

        <Pressable
          onPress={clearCart}
          className="flex-row items-center gap-1 px-3 py-1.5 rounded-lg bg-red-50 active:bg-red-100"
        >
          <Ionicons name="trash-outline" size={16} color={BRAND_COLORS.red} />
          <Text className="text-brand-red font-medium text-xs">Vaciar</Text>
        </Pressable>
      </View>

      {/* Lista de items del carrito */}
      <FlatList
        data={items}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <CartItemRow
            item={item}
            onIncrement={() => updateQuantity(item.id, item.quantity + 1)}
            onDecrement={() => updateQuantity(item.id, item.quantity - 1)}
            onRemove={() => removeItem(item.id)}
          />
        )}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 16,
          paddingBottom: 20,
        }}
        showsVerticalScrollIndicator={false}
      />

      {/* Footer Sticky */}
      <View className="bg-white border-t border-neutral-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] pb-5 pt-3">
        <CartSummary
          totalItems={totalItems}
          subtotal={totalPrice}
          discount={0}
          tax={0}
          shipping={0}
        />

        <View className="px-5 mt-4">
          <PrimaryButton
            title={isProcessing ? 'Procesando...' : `Enviar Pedido • $${totalPrice.toFixed(2)}`}
            onPress={handleCheckout}
            loading={isProcessing}
            disabled={isProcessing}
          />

          <View className="flex-row items-center justify-center gap-1.5 mt-3">
            <Ionicons name="lock-closed-outline" size={12} color="#6B7280" />
            <Text className="text-neutral-400 text-[10px] text-center">
              Tus créditos y descuentos se validarán al confirmar.
            </Text>
          </View>
        </View>
      </View>
    </View>
  )
}

