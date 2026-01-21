import { BRAND_COLORS } from '../../../../shared/types'
import { Ionicons } from '@expo/vector-icons'
import * as React from 'react'
import { FlatList, Text, View, Image, TouchableOpacity } from 'react-native'
import { useNavigation } from '@react-navigation/native'

import { EmptyState } from '../../../../components/ui/EmptyState'
import { Header } from '../../../../components/ui/Header'
import { FeedbackModal, type FeedbackType } from '../../../../components/ui/FeedbackModal' // # Importar FeedbackModal
import { useCart } from '../../../../context/CartContext'
import { useStableInsets } from '../../../../hooks/useStableInsets'

export function ClientCartScreen() {
  const navigation = useNavigation()
  const { cart, items, updateQuantity, removeItem, totalItems, clearCart } = useCart()
  const insets = useStableInsets()
  const priceSummaryHeight = 280
  const listPaddingBottom = priceSummaryHeight + insets.bottom + 24
  const [isProcessing, setIsProcessing] = React.useState(false)
  const [showPriceDetails, setShowPriceDetails] = React.useState(true)

  const [modalVisible, setModalVisible] = React.useState(false)
  const [modalConfig, setModalConfig] = React.useState<{
    type: FeedbackType
    title: string
    message: string
    showCancel?: boolean
    onConfirm?: () => void
    confirmText?: string
    cancelText?: string
  }>({
    type: 'info',
    title: '',
    message: ''
  })

  const handleClearCartPress = () => {
    setModalConfig({
      type: 'warning',
      title: 'Vaciar Carrito',
      message: '¿Estás seguro de que deseas eliminar todos los productos del carrito?',
      showCancel: true,
      confirmText: 'Vaciar',
      cancelText: 'Cancelar',
      onConfirm: async () => {
        setModalVisible(false) // Cerrar modal de confirmación
        await clearCart() // Acción real de vaciar
        // Mostrar modal de éxito
        setTimeout(() => {
          setModalConfig({
            type: 'success',
            title: 'Carrito Vaciado',
            message: 'Todos los productos han sido eliminados correctamente.',
            showCancel: false,
            confirmText: 'Entendido',
            onConfirm: () => setModalVisible(false)
          })
          setModalVisible(true)
        }, 300)
      }
    })
    setModalVisible(true)
  }

  const handleCheckout = React.useCallback(() => {
    if (items.length === 0) return
    // @ts-ignore
    navigation.navigate('ClientCheckout')
  }, [items, navigation])

  const renderCartItem = ({ item }: { item: typeof items[0] }) => (
    <View className="bg-white rounded-2xl p-4 mb-3 border border-neutral-100 shadow-sm">
      <View className="flex-row mb-3">
        {item.imagen_url ? (
          <Image
            source={{ uri: item.imagen_url }}
            className="w-16 h-16 rounded-xl bg-neutral-100"
            resizeMode="cover"
          />
        ) : (
          <View className="w-16 h-16 rounded-xl bg-neutral-100 justify-center items-center">
            <Ionicons name="image-outline" size={28} color="#D1D5DB" />
          </View>
        )}

        <View className="flex-1 ml-3 mr-2">
          <Text className="text-[15px] font-bold text-neutral-900 mb-1" numberOfLines={2}>
            {item.nombre_producto}
          </Text>
          <Text className="text-[13px] font-medium text-neutral-500 mb-1.5">
            {item.codigo_sku}
          </Text>

          {item.tiene_promocion && (
            <View className="flex-row items-center bg-red-50 px-2 py-1 rounded-lg self-start">
              <Ionicons name="pricetag" size={12} color="#DC2626" />
              <Text className="text-[11px] font-bold text-red-600 ml-1">
                -{item.descuento_porcentaje}% OFF
              </Text>
            </View>
          )}
        </View>

        <TouchableOpacity
          className="w-9 h-9 rounded-full bg-red-50 justify-center items-center"
          onPress={() => removeItem(item.producto_id)}
        >
          <Ionicons name="trash-outline" size={20} color="#EF4444" />
        </TouchableOpacity>
      </View>

      <View className="flex-row justify-between items-center">
        <View className="flex-row items-center bg-neutral-50 rounded-xl border border-neutral-200 px-2">
          <TouchableOpacity
            className="w-8 h-8 justify-center items-center"
            onPress={() => updateQuantity(item.producto_id, item.cantidad - 1)}
          >
            <Ionicons name="remove" size={18} color="#DC2626" />
          </TouchableOpacity>

          <Text className="text-base font-bold text-neutral-900 min-w-[24px] text-center mx-3">
            {item.cantidad}
          </Text>

          <TouchableOpacity
            className="w-8 h-8 justify-center items-center"
            onPress={() => updateQuantity(item.producto_id, item.cantidad + 1)}
          >
            <Ionicons name="add" size={18} color="#DC2626" />
          </TouchableOpacity>
        </View>

        <View className="items-end">
          {item.tiene_promocion && (
            <Text className="text-[13px] font-semibold text-neutral-400 line-through mb-0.5">
              ${((item.precio_lista || 0) * (item.cantidad || 0)).toFixed(2)}
            </Text>
          )}
          <Text className="text-lg font-extrabold text-neutral-900">
            ${(item.subtotal || 0).toFixed(2)}
          </Text>
        </View>
      </View>
    </View>
  )

  if (items.length === 0) {
    return (
      <View className="flex-1 bg-neutral-50">
        <Header userName="Usuario" variant="standard" title="Mi Carrito" />
        <EmptyState
          icon="cart-outline"
          title="Tu carrito está vacío"
          description="Explora nuestro catálogo y agrega los productos que necesitas."
          actionLabel="Ir a Productos"
          onAction={() => (navigation as any).navigate('Productos')}
          style={{ marginTop: 60 }}
        />
        <FeedbackModal
          visible={modalVisible}
          type={modalConfig.type}
          title={modalConfig.title}
          message={modalConfig.message}
          onClose={() => setModalVisible(false)}
          showCancel={modalConfig.showCancel}
          onConfirm={modalConfig.onConfirm}
          confirmText={modalConfig.confirmText}
          cancelText={modalConfig.cancelText}
        />
      </View>
    )
  }

  return (
    <View className="flex-1 bg-neutral-50">
      <Header userName="Usuario" variant="standard" title="Mi Carrito" />

      <View className="bg-white px-5 py-4 border-b border-neutral-100 flex-row justify-between items-center">
        <View className="flex-row items-center">
          <Ionicons name="bag-check-outline" size={24} color={BRAND_COLORS.red} />
          <View className="ml-3">
            <Text className="text-xs font-semibold text-neutral-500 mb-0.5">
              Resumen del Pedido
            </Text>
            <Text className="text-base font-bold text-neutral-900">
              {totalItems} {totalItems === 1 ? 'producto' : 'productos'}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={handleClearCartPress}
          className="flex-row items-center px-3 py-1.5 rounded-lg bg-red-50"
        >
          <Ionicons name="trash-outline" size={16} color={BRAND_COLORS.red} />
          <Text className="text-[13px] font-bold text-brand-red ml-1.5">Vaciar</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={items}
        keyExtractor={item => item.id}
        renderItem={renderCartItem}
        contentContainerStyle={{ padding: 20, paddingBottom: listPaddingBottom }}
        showsVerticalScrollIndicator={false}
      />

      <View
        className="absolute left-0 right-0 bg-white p-5 border-t border-neutral-200 shadow-lg rounded-t-3xl"
        style={{ bottom: insets.bottom + 80, paddingBottom: 20 + insets.bottom }}
      >
        <TouchableOpacity
          className="flex-row justify-between items-center py-2 mb-2"
          onPress={() => setShowPriceDetails(!showPriceDetails)}
          activeOpacity={0.7}
        >
          <View className="flex-row items-center">
            <Ionicons
              name={showPriceDetails ? 'checkmark-circle' : 'ellipse-outline'}
              size={20}
              color={showPriceDetails ? '#10B981' : '#9CA3AF'}
            />
            <Text className="text-sm font-semibold text-neutral-700 ml-2">
              Ver desglose de precios
            </Text>
          </View>
          <Ionicons
            name={showPriceDetails ? 'chevron-up' : 'chevron-down'}
            size={18}
            color="#6B7280"
          />
        </TouchableOpacity>

        {showPriceDetails && (
          <>
            <View className="flex-row justify-between mb-2.5">
              <Text className="text-sm font-semibold text-neutral-500">Subtotal</Text>
              <Text className="text-sm font-bold text-neutral-900">
                ${(cart.subtotal || 0).toFixed(2)}
              </Text>
            </View>

            {(cart.descuento_total || 0) > 0 && (
              <View className="flex-row justify-between mb-2.5">
                <Text className="text-sm font-semibold text-green-600">Descuentos</Text>
                <Text className="text-sm font-bold text-green-600">
                  -${(cart.descuento_total || 0).toFixed(2)}
                </Text>
              </View>
            )}

            <View className="flex-row justify-between mb-2.5">
              <Text className="text-sm font-semibold text-neutral-500">IVA (12%)</Text>
              <Text className="text-sm font-bold text-neutral-900">
                ${(cart.impuestos_total || 0).toFixed(2)}
              </Text>
            </View>

            <View className="h-px bg-neutral-200 my-3" />
          </>
        )}

        <View className="flex-row justify-between mb-4">
          <Text className="text-lg font-bold text-neutral-900">Total</Text>
          <Text className="text-[22px] font-extrabold text-brand-red">
            ${(cart.total_final || 0).toFixed(2)}
          </Text>
        </View>

        <TouchableOpacity
          className={`flex-row items-center justify-center py-4 rounded-xl shadow-md ${isProcessing ? 'bg-neutral-300' : 'bg-brand-red'
            }`}
          onPress={handleCheckout}
          disabled={isProcessing}
          activeOpacity={0.9}
        >
          {isProcessing ? (
            <Text className="text-base font-bold text-white tracking-wide">
              Procesando...
            </Text>
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
              <Text className="text-base font-bold text-white tracking-wide ml-2">
                Enviar Pedido • ${(cart.total_final || 0).toFixed(2)}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      <FeedbackModal
        visible={modalVisible}
        type={modalConfig.type}
        title={modalConfig.title}
        message={modalConfig.message}
        onClose={() => setModalVisible(false)}
        showCancel={modalConfig.showCancel}
        onConfirm={modalConfig.onConfirm}
        confirmText={modalConfig.confirmText}
        cancelText={modalConfig.cancelText}
      />
    </View>
  )
}
