import React, { useState, useEffect } from 'react'
import { View, Text, ScrollView, Pressable, TextInput, Alert, Modal } from 'react-native'
import { Header } from '../../../../components/ui/Header'
import { Ionicons } from '@expo/vector-icons'
import { BRAND_COLORS } from '../../../../shared/types'
import { useRoute } from '@react-navigation/native'
import { type Client } from '../../../../services/api/ClientService'

interface OrderItem {
    productId: string
    productName: string
    quantity: number
    price: number
    discount?: number
}

export function SellerOrderScreen() {
    const route = useRoute()
    // @ts-ignore
    const { preselectedClient } = route.params || {}

    const [client, setClient] = useState<Client | null>(preselectedClient || null)
    const [items, setItems] = useState<OrderItem[]>([])
    const [condition, setCondition] = useState('contado')

    useEffect(() => {
        if (preselectedClient) {
            setClient(preselectedClient)
        }
    }, [preselectedClient])

    const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0)

    const handleAddItem = () => {
        const newItem: OrderItem = {
            productId: Math.random().toString(),
            productName: `Producto Ejemplo ${items.length + 1}`,
            quantity: 1,
            price: 15.50
        }
        setItems([...items, newItem])
    }

    const handleRemoveItem = (id: string) => {
        setItems(items.filter(i => i.productId !== id))
    }

    const handleUpdateQty = (id: string, delta: number) => {
        setItems(items.map(i => {
            if (i.productId === id) {
                return { ...i, quantity: Math.max(1, i.quantity + delta) }
            }
            return i
        }))
    }

    const handleSendOrder = () => {
        if (!client) return Alert.alert('Error', 'Selecciona un cliente')
        if (items.length === 0) return Alert.alert('Error', 'Agrega productos')

        Alert.alert('Pedido Enviado', 'El pedido ha sido enviado a bodega.', [
            {
                text: 'OK', onPress: () => {
                    setItems([])
                    setCondition('contado')
                }
            }
        ])
    }

    const handleSaveDraft = () => {
        Alert.alert('Borrador', 'Pedido guardado en borradores.')
    }

    return (
        <View className="flex-1 bg-neutral-50 relative">
            <Header title="Nuevo Pedido" variant="standard" />

            <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 150 }}>
                <View className="p-5">
                    <Text className="text-neutral-900 font-bold mb-2">1. Cliente</Text>
                    {client ? (
                        <View className="bg-white p-4 rounded-xl border border-neutral-200 flex-row justify-between items-center">
                            <View>
                                <Text className="font-bold text-neutral-900">{client.businessName}</Text>
                                <Text className="text-neutral-500 text-sm">{client.ruc}</Text>
                            </View>
                            <Pressable onPress={() => setClient(null)}>
                                <Ionicons name="close-circle" size={24} color="#D1D5DB" />
                            </Pressable>
                        </View>
                    ) : (
                        <Pressable
                            className="bg-white border-2 border-dashed border-neutral-300 p-4 rounded-xl items-center justify-center"
                            onPress={() => Alert.alert('Seleccionar Cliente', 'Navega a la pestaña Clientes o usa el buscador (Simulado)')}
                        >
                            <Ionicons name="search" size={24} color="#9CA3AF" />
                            <Text className="text-neutral-400 font-bold mt-1">Seleccionar Cliente</Text>
                        </Pressable>
                    )}
                </View>

                <View className="px-5 mb-5 h-auto">
                    <View className="flex-row justify-between items-center mb-2">
                        <Text className="text-neutral-900 font-bold">2. Productos ({items.length})</Text>
                        <Pressable onPress={handleAddItem} disabled={!client}>
                            <Text className={`font-bold ${!client ? 'text-neutral-300' : 'text-brand-red'}`}>+ Agregar</Text>
                        </Pressable>
                    </View>

                    {items.length === 0 ? (
                        <View className="bg-neutral-100 p-6 rounded-xl items-center">
                            <Text className="text-neutral-400 text-sm">Carrito vacío</Text>
                        </View>
                    ) : (
                        items.map(item => (
                            <View key={item.productId} className="bg-white p-3 rounded-xl border border-neutral-100 mb-2 flex-row items-center justify-between">
                                <View className="flex-1">
                                    <Text className="font-medium text-neutral-900">{item.productName}</Text>
                                    <Text className="text-neutral-500 text-xs">${item.price.toFixed(2)} c/u</Text>
                                </View>
                                <View className="flex-row items-center bg-neutral-100 rounded-lg">
                                    <Pressable onPress={() => handleUpdateQty(item.productId, -1)} className="p-2">
                                        <Text className="font-bold">-</Text>
                                    </Pressable>
                                    <Text className="font-bold w-6 text-center">{item.quantity}</Text>
                                    <Pressable onPress={() => handleUpdateQty(item.productId, 1)} className="p-2">
                                        <Text className="font-bold">+</Text>
                                    </Pressable>
                                </View>
                                <Pressable onPress={() => handleRemoveItem(item.productId)} className="ml-3">
                                    <Ionicons name="trash-outline" size={20} color="#EF4444" />
                                </Pressable>
                            </View>
                        ))
                    )}
                </View>

                <View className="px-5 mb-5">
                    <Text className="text-neutral-900 font-bold mb-2">3. Condición Comercial</Text>
                    <View className="flex-row gap-3">
                        <Pressable
                            className={`flex-1 p-3 rounded-xl border ${condition === 'contado' ? 'bg-red-50 border-brand-red' : 'bg-white border-neutral-200'}`}
                            onPress={() => setCondition('contado')}
                        >
                            <Text className={`text-center font-bold ${condition === 'contado' ? 'text-brand-red' : 'text-neutral-500'}`}>Contado</Text>
                        </Pressable>
                        <Pressable
                            className={`flex-1 p-3 rounded-xl border ${condition === 'credito' ? 'bg-red-50 border-brand-red' : 'bg-white border-neutral-200'}`}
                            onPress={() => setCondition('credito')}
                        >
                            <Text className={`text-center font-bold ${condition === 'credito' ? 'text-brand-red' : 'text-neutral-500'}`}>Crédito</Text>
                        </Pressable>
                    </View>
                </View>

                <View className="px-5">
                    <View className="bg-white p-4 rounded-xl border border-neutral-100">
                        <View className="flex-row justify-between mb-2">
                            <Text className="text-neutral-500">Subtotal</Text>
                            <Text className="text-neutral-900 font-bold">${total.toFixed(2)}</Text>
                        </View>
                        <View className="flex-row justify-between mb-2">
                            <Text className="text-neutral-500">IVA (12%)</Text>
                            <Text className="text-neutral-900 font-bold">${(total * 0.12).toFixed(2)}</Text>
                        </View>
                        <View className="h-[1px] bg-neutral-100 my-2" />
                        <View className="flex-row justify-between">
                            <Text className="text-lg font-bold text-neutral-900">Total</Text>
                            <Text className="text-lg font-bold text-brand-red">${(total * 1.12).toFixed(2)}</Text>
                        </View>
                    </View>
                </View>

            </ScrollView>

            <View className="absolute bottom-0 left-0 right-0 bg-white border-t border-neutral-100 p-5 pb-8 shadow-lg z-20">
                <View className="flex-row gap-3">
                    <Pressable
                        className="flex-1 bg-white border border-neutral-300 py-3 rounded-xl items-center"
                        onPress={handleSaveDraft}
                    >
                        <Text className="font-bold text-neutral-700">Guardar Borrador</Text>
                    </Pressable>
                    <Pressable
                        className={`flex-1 py-3 rounded-xl items-center ${!client || items.length === 0 ? 'bg-neutral-300' : 'bg-brand-red'}`}
                        onPress={handleSendOrder}
                        disabled={!client || items.length === 0}
                    >
                        <Text className="font-bold text-white">Enviar Pedido</Text>
                    </Pressable>
                </View>
            </View>
        </View>
    )
}
