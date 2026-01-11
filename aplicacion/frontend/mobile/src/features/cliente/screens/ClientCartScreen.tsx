import { BRAND_COLORS } from '@cafrilosa/shared-types'
import { Ionicons } from '@expo/vector-icons'
import * as React from 'react'
import { FlatList, Pressable, Text, View, Image, TouchableOpacity, StyleSheet, Alert } from 'react-native'
import { useNavigation } from '@react-navigation/native'

import { EmptyState } from '../../../components/ui/EmptyState'
import { Header } from '../../../components/ui/Header'
import { useCart } from '../../../context/CartContext'
import { OrderService, CreateOrderPayload } from '../../../services/api/OrderService'
import { ClientService } from '../../../services/api/ClientService'

export function ClientCartScreen() {
  const navigation = useNavigation()
  const { cart, items, updateQuantity, removeItem, totalPrice, totalItems, clearCart } = useCart()
  const [isProcessing, setIsProcessing] = React.useState(false)

  // Placeholder para datos del cliente (debería venir de Context/Store)
  const clientData = {
    creditLimit: 500.00,
    balance: 120.50,
    status: 'active' // 'active' | 'blocked'
  }

  const handleCheckout = React.useCallback(() => {
    // 1. Validar que hay items
    if (items.length === 0) return

    // Navegar a pantalla de checkout
    // @ts-ignore
    navigation.navigate('ClientCheckout')
  }, [items, navigation])

  // Renderizar cada item del carrito con el diseño del vendedor
  const renderCartItem = ({ item }: { item: typeof items[0] }) => (
    <View style={styles.cartItem}>
      <View style={styles.itemHeader}>
        {item.imagen_url ? (
          <Image
            source={{ uri: item.imagen_url }}
            style={styles.productImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.placeholderImage}>
            <Ionicons name="image-outline" size={28} color="#D1D5DB" />
          </View>
        )}

        <View style={styles.itemInfo}>
          <Text style={styles.productName} numberOfLines={2}>
            {item.nombre_producto}
          </Text>
          <Text style={styles.productSku}>{item.codigo_sku}</Text>

          {item.tiene_promocion && (
            <View style={styles.promotionBadge}>
              <Ionicons name="pricetag" size={12} color="#DC2626" />
              <Text style={styles.promotionText}>
                -{item.descuento_porcentaje}% OFF
              </Text>
            </View>
          )}
        </View>

        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => removeItem(item.producto_id)}
        >
          <Ionicons name="trash-outline" size={20} color="#EF4444" />
        </TouchableOpacity>
      </View>

      <View style={styles.itemFooter}>
        <View style={styles.quantityControl}>
          <TouchableOpacity
            style={styles.quantityButton}
            onPress={() => updateQuantity(item.producto_id, item.cantidad - 1)}
          >
            <Ionicons name="remove" size={18} color="#DC2626" />
          </TouchableOpacity>

          <Text style={styles.quantityText}>{item.cantidad}</Text>

          <TouchableOpacity
            style={styles.quantityButton}
            onPress={() => updateQuantity(item.producto_id, item.cantidad + 1)}
          >
            <Ionicons name="add" size={18} color="#DC2626" />
          </TouchableOpacity>
        </View>

        <View style={styles.priceContainer}>
          {item.tiene_promocion && (
            <Text style={styles.originalPrice}>
              ${(item.precio_lista * item.cantidad).toFixed(2)}
            </Text>
          )}
          <Text style={styles.finalPrice}>
            ${item.subtotal.toFixed(2)}
          </Text>
        </View>
      </View>
    </View>
  )

  if (items.length === 0) {
    return (
      <View style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
        <Header
          userName="Usuario"
          variant="standard"
          title="Mi Carrito"
        />
        <EmptyState
          icon="cart-outline"
          title="Tu carrito está vacío"
          description="Explora nuestro catálogo y agrega los productos que necesitas."
          actionLabel="Ir a Productos"
          onAction={() => {
            (navigation as any).navigate('Productos')
          }}
          style={{ marginTop: 60 }}
        />
      </View>
    )
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
      <Header
        userName="Usuario"
        variant="standard"
        title="Mi Carrito"
      />

      {/* Header con contador y botón vaciar */}
      <View style={styles.headerSection}>
        <View style={styles.headerInfo}>
          <Ionicons name="bag-check-outline" size={24} color={BRAND_COLORS.red} />
          <View style={{ marginLeft: 12 }}>
            <Text style={styles.headerLabel}>Resumen del Pedido</Text>
            <Text style={styles.headerValue}>
              {totalItems} {totalItems === 1 ? 'producto' : 'productos'}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={() => {
            Alert.alert(
              'Vaciar Carrito',
              '¿Estás seguro de que deseas vaciar el carrito?',
              [
                { text: 'Cancelar', style: 'cancel' },
                { text: 'Vaciar', style: 'destructive', onPress: clearCart }
              ]
            )
          }}
          style={styles.clearButton}
        >
          <Ionicons name="trash-outline" size={16} color={BRAND_COLORS.red} />
          <Text style={styles.clearButtonText}>Vaciar</Text>
        </TouchableOpacity>
      </View>

      {/* Lista de items del carrito */}
      <FlatList
        data={items}
        keyExtractor={item => item.id}
        renderItem={renderCartItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      {/* Resumen y totales */}
      <View style={styles.summaryContainer}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Subtotal</Text>
          <Text style={styles.summaryValue}>${cart.subtotal.toFixed(2)}</Text>
        </View>

        {cart.descuento_total > 0 && (
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: '#10B981' }]}>
              Descuentos
            </Text>
            <Text style={[styles.summaryValue, { color: '#10B981' }]}>
              -${cart.descuento_total.toFixed(2)}
            </Text>
          </View>
        )}

        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>IVA (12%)</Text>
          <Text style={styles.summaryValue}>${cart.impuestos_total.toFixed(2)}</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.summaryRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>${cart.total_final.toFixed(2)}</Text>
        </View>

        <TouchableOpacity
          style={[
            styles.checkoutButton,
            isProcessing && styles.checkoutButtonDisabled
          ]}
          onPress={handleCheckout}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <Text style={styles.checkoutButtonText}>Procesando...</Text>
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
              <Text style={styles.checkoutButtonText}>
                Enviar Pedido • ${cart.total_final.toFixed(2)}
              </Text>
            </>
          )}
        </TouchableOpacity>

        <View style={styles.securityNote}>
          <Ionicons name="lock-closed-outline" size={12} color="#6B7280" />
          <Text style={styles.securityText}>
            Tus créditos y descuentos se validarán al confirmar.
          </Text>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  headerSection: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  headerInfo: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  headerLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 2
  },
  headerValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827'
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#FEE2E2'
  },
  clearButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: BRAND_COLORS.red
  },
  listContent: {
    padding: 20,
    paddingBottom: 300
  },
  cartItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3
  },
  itemHeader: {
    flexDirection: 'row',
    marginBottom: 12
  },
  productImage: {
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: '#F3F4F6'
  },
  placeholderImage: {
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center'
  },
  itemInfo: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8
  },
  productName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4
  },
  productSku: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: 6
  },
  promotionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
    gap: 4
  },
  promotionText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#DC2626'
  },
  deleteButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center'
  },
  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  quantityControl: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 12,
    paddingHorizontal: 8
  },
  quantityButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center'
  },
  quantityText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    minWidth: 24,
    textAlign: 'center'
  },
  priceContainer: {
    alignItems: 'flex-end'
  },
  originalPrice: {
    fontSize: 13,
    fontWeight: '600',
    color: '#9CA3AF',
    textDecorationLine: 'line-through',
    marginBottom: 2
  },
  finalPrice: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827'
  },
  summaryContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    padding: 20,
    paddingBottom: 100,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10
  },
  summaryLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280'
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827'
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 12
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827'
  },
  totalValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#DC2626'
  },
  checkoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DC2626',
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 16,
    gap: 8,
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6
  },
  checkoutButtonDisabled: {
    backgroundColor: '#9CA3AF'
  },
  checkoutButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3
  },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 12
  },
  securityText: {
    fontSize: 11,
    color: '#6B7280'
  }
})
