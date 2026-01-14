import React from 'react'
import { View, Text } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { BRAND_COLORS } from '../../../shared/types'

export function AccountOverview() {
    return (
        <View className="bg-white mx-4 mt-4 rounded-xl p-4 shadow-sm border border-neutral-100">
            <Text className="text-neutral-500 text-xs font-semibold uppercase tracking-wider mb-2">Resumen de Cuenta</Text>
            <View className="flex-row justify-between items-center mb-4">
                <View>
                    <Text className="text-2xl font-bold text-neutral-900">$0.00</Text>
                    <Text className="text-neutral-500 text-xs mt-0.5">Saldo Pendiente (ERP)</Text>
                </View>
                <View className="bg-green-100 px-3 py-1 rounded-full border border-green-200">
                    <Text className="text-green-700 text-xs font-bold">AL DÍA</Text>
                </View>
            </View>
            <View className="h-[1px] bg-neutral-100 mb-3" />
            <Text className="text-neutral-400 text-xs text-center italic">
                * Datos actualizados en tiempo real
            </Text>
        </View>
    )
}

export function QuickStats() {
    return (
        <View className="flex-row justify-between mx-4 mt-4">
            <StatItem icon="receipt" label="Pedidos" value="0" color="#3B82F6" />
            <StatItem icon="wallet" label="Facturas" value="0" color="#EF4444" />
            <StatItem icon="time" label="Entregas" value="0" color="#F59E0B" />
        </View>
    )
}

function StatItem({ icon, label, value, color }: { icon: any, label: string, value: string, color: string }) {
    return (
        <View className="bg-white flex-1 mx-1.5 p-3 rounded-xl items-center shadow-sm border border-neutral-100">
            <View className="h-8 w-8 rounded-full items-center justify-center mb-1" style={{ backgroundColor: `${color}15` }}>
                <Ionicons name={icon} size={16} color={color} />
            </View>
            <Text className="text-lg font-bold text-neutral-800">{value}</Text>
            <Text className="text-[10px] text-neutral-400 uppercase font-medium">{label}</Text>
        </View>
    )
}

export function RecentActivity({ navigation }: { navigation: any }) {
    return (
        <View className="mx-4 mt-6">
            <View className="flex-row justify-between items-center mb-3">
                <Text className="font-bold text-neutral-800">Última Actividad</Text>
            </View>

            {/* Empty State */}
            <View className="bg-white p-6 rounded-xl border border-neutral-100 items-center justify-center">
                <View className="h-10 w-10 bg-neutral-50 rounded-full items-center justify-center mb-2">
                    <Ionicons name="time-outline" size={20} color="#94A3B8" />
                </View>
                <Text className="text-neutral-400 text-sm">No hay movimientos recientes</Text>
            </View>
        </View>
    )
}
