import React, { useState } from 'react'
import { View, Text, ScrollView } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { Header } from '../../../components/ui/Header'
import { Ionicons } from '@expo/vector-icons'

const MOCK_LOGS = [
    { id: 1, action: 'CREATE', entity: 'Producto', detail: 'Leche Entera 1L', user: 'Juan Supervisor', time: 'Hace 10 min' },
    { id: 2, action: 'UPDATE', entity: 'Precio', detail: 'Lista Mayorista actualizado', user: 'Juan Supervisor', time: 'Hace 2 horas' },
    { id: 3, action: 'DELETE', entity: 'Categoría', detail: 'Bebidas (Soft Delete)', user: 'Maria Admin', time: 'Ayer' },
    { id: 4, action: 'UPDATE', entity: 'Zona', detail: 'Asignación Vendedor ZN-01', user: 'Sistema', time: 'Ayer' },
]

export function SupervisorAuditScreen() {
    const navigation = useNavigation()

    return (
        <View className="flex-1 bg-neutral-50">
            <Header title="Auditoría de Catálogo" variant="standard" onBackPress={() => navigation.goBack()} />

            <ScrollView className="flex-1 px-5 pt-4">
                {MOCK_LOGS.map((log, index) => (
                    <View key={index} className="flex-row items-start bg-white p-4 mb-3 rounded-xl border border-neutral-100 shadow-sm">
                        <View className={`w-8 h-8 rounded-full items-center justify-center mr-3 mt-1 ${log.action === 'CREATE' ? 'bg-green-100' :
                                log.action === 'UPDATE' ? 'bg-blue-100' : 'bg-red-100'
                            }`}>
                            <Ionicons
                                name={
                                    log.action === 'CREATE' ? 'add' :
                                        log.action === 'UPDATE' ? 'pencil' : 'trash'
                                }
                                size={14}
                                color={
                                    log.action === 'CREATE' ? '#16A34A' :
                                        log.action === 'UPDATE' ? '#2563EB' : '#DC2626'
                                }
                            />
                        </View>
                        <View className="flex-1">
                            <View className="flex-row justify-between">
                                <Text className="font-bold text-neutral-900 text-sm">{log.entity}: {log.detail}</Text>
                                <Text className="text-neutral-400 text-xs">{log.time}</Text>
                            </View>
                            <Text className="text-neutral-500 text-xs mt-1">Por: <Text className="font-medium text-neutral-700">{log.user}</Text></Text>
                        </View>
                    </View>
                ))}
            </ScrollView>
        </View>
    )
}
