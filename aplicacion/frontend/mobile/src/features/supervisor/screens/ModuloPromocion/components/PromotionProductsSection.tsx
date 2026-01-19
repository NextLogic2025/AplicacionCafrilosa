import React from 'react'
import { View, Text, TouchableOpacity } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import type { Product } from '../../../../../services/api/CatalogService'
import type { PriceList } from '../../../../../services/api/PriceService'
import type { PromotionProduct } from '../../../../../services/api/PromotionService'
import { ProductPriceDisplay } from '../../../../../components/ui/ProductPriceDisplay'

type Props = {
  promoProducts: PromotionProduct[]
  expandedProducts: Record<string, boolean>
  onToggleProductExpansion: (productId: string) => void
  onRemoveProduct: (productId: string) => void
  onAddProduct: () => void
  priceLists: PriceList[]
  tipoDescuento: 'PORCENTAJE' | 'MONTO_FIJO'
  valorDescuento: number | undefined
}

export function PromotionProductsSection({
  promoProducts,
  expandedProducts,
  onToggleProductExpansion,
  onRemoveProduct,
  onAddProduct,
  priceLists,
  tipoDescuento,
  valorDescuento,
}: Props) {
  return (
    <View className="bg-white mx-4 mt-0 mb-8 p-4 rounded-xl shadow-sm border border-gray-100">
      <View className="flex-row justify-between items-center mb-4">
        <Text className="text-gray-500 font-bold text-xs uppercase tracking-wider">Productos en promoción</Text>
        <TouchableOpacity onPress={onAddProduct} className="bg-red-600 px-3 py-1.5 rounded-full flex-row items-center">
          <Ionicons name="add" color="white" size={16} />
          <Text className="text-white text-xs font-bold ml-1">Agregar</Text>
        </TouchableOpacity>
      </View>

      {promoProducts.length === 0 ? (
        <Text className="text-gray-400 text-sm text-center italic py-4">No hay productos seleccionados.</Text>
      ) : (
        promoProducts.map(p => {
          const producto = p.producto as Product | undefined
          const isExpanded = expandedProducts[p.producto_id] ?? false
          const hasPrices = !!(producto?.precios && producto.precios.length > 0)

          return (
            <View key={p.producto_id} className="mb-4 pb-4 border-b border-gray-100">
              <TouchableOpacity
                onPress={() => hasPrices && onToggleProductExpansion(p.producto_id)}
                className="flex-row items-center mb-3"
                activeOpacity={hasPrices ? 0.7 : 1}
              >
                <View className="h-10 w-10 bg-gray-100 rounded-lg items-center justify-center mr-3">
                  <Ionicons name="cube" size={20} color="gray" />
                </View>
                <View className="flex-1">
                  <Text className="font-bold text-gray-800">{producto?.nombre || 'Producto'}</Text>
                  <View className="flex-row items-center">
                    <Text className="text-xs text-gray-400">{producto?.codigo_sku || p.producto_id}</Text>
                    {hasPrices && (
                      <View className="flex-row items-center ml-2">
                        <Ionicons name="pricetags" size={12} color="#10B981" />
                        <Text className="text-[10px] text-green-600 ml-1">
                          {producto?.precios?.length || 0} {producto?.precios?.length !== 1 ? 'listas' : 'lista'}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
                <View className="flex-row items-center">
                  {hasPrices && (
                    <View className="bg-gray-100 rounded-full px-2 py-1 mr-2">
                      <Ionicons name={isExpanded ? 'chevron-up' : 'chevron-down'} size={16} color="#6B7280" />
                    </View>
                  )}
                  <TouchableOpacity onPress={() => onRemoveProduct(p.producto_id)} className="p-2">
                    <Ionicons name="close-circle" size={20} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>

              {hasPrices ? (
                isExpanded && (
                  <View className="ml-2">
                    <ProductPriceDisplay
                      precios={producto!.precios}
                      priceLists={priceLists}
                      showAllPrices={true}
                      precioOfertaFijo={p.precio_oferta_fijo}
                      tipoDescuento={tipoDescuento}
                      valorDescuento={valorDescuento}
                    />
                  </View>
                )
              ) : (
                <View className="ml-2 bg-amber-50 p-4 rounded-lg border border-amber-200">
                  <View className="flex-row items-center">
                    <Ionicons name="warning" size={20} color="#F59E0B" />
                    <View className="flex-1 ml-3">
                      <Text className="text-amber-800 text-xs font-bold mb-1">Sin precios configurados</Text>
                      <Text className="text-amber-600 text-[10px]">
                        Este producto necesita precios asignados para calcular descuentos. Ve a Catálogo → Listas de precios para configurarlos.
                      </Text>
                    </View>
                  </View>
                </View>
              )}
            </View>
          )
        })
      )}
    </View>
  )
}

