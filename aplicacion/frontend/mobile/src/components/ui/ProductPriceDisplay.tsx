import React from 'react'
import { View, Text } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

interface ProductPriceDisplayProps {
    precioOriginal?: number
    precioOferta?: number
    ahorro?: number
    precios?: Array<{ lista_id: number; precio: number }>
    priceLists?: Array<{ id: number; nombre: string }>
    size?: 'sm' | 'md' | 'lg'
    layout?: 'horizontal' | 'vertical'
    showAllPrices?: boolean 
    precioOfertaFijo?: number | null 
    tipoDescuento?: 'PORCENTAJE' | 'MONTO_FIJO'
    valorDescuento?: number
}

const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(price)
}

const formatDiscount = (discount: number) => {
    return new Intl.NumberFormat('es-CO', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(discount)
}

export function ProductPriceDisplay({
    precioOriginal,
    precioOferta,
    ahorro,
    precios,
    priceLists,
    size = 'md',
    layout = 'horizontal',
    showAllPrices = false,
    precioOfertaFijo,
    tipoDescuento,
    valorDescuento
}: ProductPriceDisplayProps) {
    const textSizes = {
        sm: { price: 'text-sm', original: 'text-[10px]', badge: 'text-[9px]', discount: 'text-[10px]' },
        md: { price: 'text-base', original: 'text-xs', badge: 'text-[10px]', discount: 'text-xs' },
        lg: { price: 'text-lg', original: 'text-sm', badge: 'text-xs', discount: 'text-sm' }
    }

    const sizes = textSizes[size]

    // Función para renderizar todas las listas de precios con sus promociones
    const renderAllPricesWithPromotion = () => {
        const calcularPrecioConDescuento = (precioBase: number): number => {
            // Si hay un precio de oferta fijo definido y válido, usarlo
            if (precioOfertaFijo !== undefined && precioOfertaFijo !== null && precioOfertaFijo > 0) {
                return precioOfertaFijo
            }

            // Si no hay tipo de descuento o el valor es inválido, retornar el precio base
            if (!tipoDescuento || valorDescuento === undefined || valorDescuento === null || valorDescuento <= 0) {
                return precioBase
            }

            // Calcular según el tipo de descuento
            if (tipoDescuento === 'PORCENTAJE') {
                return precioBase * (1 - valorDescuento / 100)
            } else if (tipoDescuento === 'MONTO_FIJO') {
                return Math.max(0, precioBase - valorDescuento)
            }
            return precioBase
        }

        type PrecioConLista = {
            precioItem: { lista_id: number; precio: number }
            lista: { id: number; nombre: string }
        }

        const preciosConLista: PrecioConLista[] = (precios || [])
            .map(precioItem => {
                const lista = (priceLists || []).find(l => l.id === precioItem.lista_id)
                if (!lista) return null
                return { precioItem, lista }
            })
            .filter((item): item is PrecioConLista => item !== null)

        if (preciosConLista.length === 0) {
            return (
                <View className="w-full">
                    <Text className="text-neutral-400 text-xs italic">Sin listas de precios válidas</Text>
                </View>
            )
        }

        return (
            <View className="w-full">
                {preciosConLista.map(({ precioItem, lista }) => {
                    const precioBase = precioItem.precio
                    const precioConDescuento = calcularPrecioConDescuento(precioBase)
                    const tieneDescuento = precioConDescuento < precioBase
                    const ahorroCalculado = precioBase - precioConDescuento

                    return (
                        <View
                            key={precioItem.lista_id}
                            className={`mb-3 p-3 bg-white rounded-lg border ${tieneDescuento ? 'border-red-200 bg-red-50' : 'border-neutral-100'}`}
                        >
                            <View className="flex-row items-center mb-2">
                                <View className={`px-2 py-1 rounded-md mr-2 ${
                                    lista.nombre === 'General' ? 'bg-blue-100' :
                                    lista.nombre === 'Mayorista' ? 'bg-purple-100' :
                                    'bg-amber-100'
                                }`}>
                                    <Text className={`text-[10px] font-bold uppercase ${
                                        lista.nombre === 'General' ? 'text-blue-700' :
                                        lista.nombre === 'Mayorista' ? 'text-purple-700' :
                                        'text-amber-700'
                                    }`}>
                                        {lista.nombre}
                                    </Text>
                                </View>
                                {tieneDescuento && (
                                    <View className="bg-red-500 px-2 py-0.5 rounded-md">
                                        <Text className="text-white text-[9px] font-bold">CON PROMOCIÓN</Text>
                                    </View>
                                )}
                            </View>

                            {tieneDescuento ? (
                                <View className="flex-row items-center justify-between">
                                    <View className="flex-1">
                                        <Text className="text-neutral-500 text-xs mb-1">Precio Original:</Text>
                                        <Text className="text-neutral-400 line-through text-sm font-semibold">
                                            {formatPrice(precioBase)}
                                        </Text>
                                    </View>
                                    <View className="w-8 items-center">
                                        <Ionicons name="arrow-forward" size={16} color="#EF4444" />
                                    </View>
                                    <View className="flex-1 items-end">
                                        <Text className="text-neutral-500 text-xs mb-1">Con Descuento:</Text>
                                        <Text className="text-red-600 font-bold text-lg">
                                            {formatPrice(precioConDescuento)}
                                        </Text>
                                    </View>
                                </View>
                            ) : (
                                <View>
                                    <Text className="text-neutral-500 text-xs mb-1">Precio:</Text>
                                    <Text className="text-neutral-900 font-bold text-base">
                                        {formatPrice(precioBase)}
                                    </Text>
                                </View>
                            )}

                            {tieneDescuento && ahorroCalculado > 0 && (
                                <View className="flex-row items-center mt-2 pt-2 border-t border-red-100">
                                    <Ionicons name="pricetag" size={12} color="#16A34A" />
                                    <Text className="text-green-600 font-bold text-xs ml-1">
                                        Ahorras {formatPrice(ahorroCalculado)}
                                    </Text>
                                    {tipoDescuento === 'PORCENTAJE' && valorDescuento != null && valorDescuento > 0 && (
                                        <Text className="text-green-600 text-xs ml-1">
                                            ({valorDescuento}% de descuento)
                                        </Text>
                                    )}
                                    {tipoDescuento === 'MONTO_FIJO' && valorDescuento != null && valorDescuento > 0 && (
                                        <Text className="text-green-600 text-xs ml-1">
                                            (-{formatPrice(valorDescuento)})
                                        </Text>
                                    )}
                                </View>
                            )}
                        </View>
                    )
                })}
            </View>
        )
    }

    if (showAllPrices && precios && priceLists && precios.length > 0) {
        return renderAllPricesWithPromotion()
    }

    if (!precioOriginal && !precioOferta && (!precios || precios.length === 0)) {
        return (
            <View className="flex-row items-center">
                <Text className="text-neutral-400 text-xs italic">Sin precio asignado</Text>
            </View>
        )
    }

    const hasPromotion = precioOferta != null && precioOferta < (precioOriginal || Infinity)

    if (layout === 'vertical') {
        return (
            <View className="items-start">
                {hasPromotion ? (
                    <>
                        <View className="flex-row items-center mb-1">
                            <View className="bg-red-100 px-2 py-0.5 rounded-md mr-2">
                                <Text className={`font-bold text-red-600 ${sizes.badge} uppercase`}>OFERTA</Text>
                            </View>
                            <Text className={`font-bold text-red-600 ${sizes.price}`}>
                                {formatPrice(precioOferta!)}
                            </Text>
                        </View>
                        <Text className={`text-neutral-400 line-through ${sizes.original}`}>
                            {formatPrice(precioOriginal!)}
                        </Text>
                        {ahorro != null && ahorro > 0 && (
                            <View className="flex-row items-center mt-1">
                                <Ionicons name="pricetag" size={10} color="#16A34A" />
                                <Text className={`text-green-600 font-semibold ${sizes.discount} ml-1`}>
                                    Ahorra {formatPrice(ahorro)}
                                </Text>
                            </View>
                        )}
                    </>
                ) : (
                    <Text className={`font-bold text-neutral-900 ${sizes.price}`}>
                        {formatPrice(precioOriginal!)}
                    </Text>
                )}
            </View>
        )
    }

    return (
        <View className="flex-row items-center flex-wrap">
            {hasPromotion ? (
                <>
                    <View className="bg-red-100 px-2 py-0.5 rounded-md mr-2">
                        <Text className={`font-bold text-red-600 ${sizes.badge} uppercase`}>OFERTA</Text>
                    </View>
                    <Text className={`font-bold text-red-600 ${sizes.price} mr-2`}>
                        {formatPrice(precioOferta!)}
                    </Text>
                    <Text className={`text-neutral-400 line-through ${sizes.original}`}>
                        {formatPrice(precioOriginal!)}
                    </Text>
                </>
            ) : (
                <Text className={`font-bold text-neutral-900 ${sizes.price}`}>
                    {formatPrice(precioOriginal!)}
                </Text>
            )}
        </View>
    )
}