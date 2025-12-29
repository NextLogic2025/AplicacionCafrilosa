import React from 'react'
import { View, Text } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { BRAND_COLORS } from '@cafrilosa/shared-types'

import type { RecentActivity, WarehouseStats } from '../../../services/api/WarehouseService'

export function WarehouseKPIs({ stats }: { stats: WarehouseStats }) {
    return (
        <View className="flex-row justify-between mx-4 mt-4">
            <StatItem icon="download-outline" label="Pendientes" value={stats.pendingOrders.toString()} color="#3B82F6" />
            <StatItem icon="cube-outline" label="En Prep." value={stats.preparingOrders.toString()} color="#F59E0B" />
            <StatItem icon="bus-outline" label="Listos" value={stats.readyOrders.toString()} color="#10B981" />
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

export function CriticalAlerts({ stats }: { stats: WarehouseStats }) {
    if (stats.expiringLots === 0 && stats.criticalStock === 0) return null

    return (
        <View className="mx-4 mt-6">
            <Text className="text-neutral-500 text-xs font-bold uppercase mb-3 ml-1">Alertas Críticas</Text>
            <View className="gap-3">
                {stats.expiringLots > 0 && (
                    <View className="bg-red-50 p-4 rounded-xl border border-red-100 flex-row items-center">
                        <View className="h-10 w-10 bg-red-100 rounded-full items-center justify-center mr-3">
                            <Ionicons name="warning-outline" size={24} color="#DC2626" />
                        </View>
                        <View className="flex-1">
                            <Text className="text-red-800 font-bold text-sm">Lotes Próximos a Vencer</Text>
                            <Text className="text-red-600 text-xs">{stats.expiringLots} lotes vencen pronto.</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color="#DC2626" />
                    </View>
                )}

                {stats.criticalStock > 0 && (
                    <View className="bg-orange-50 p-4 rounded-xl border border-orange-100 flex-row items-center">
                        <View className="h-10 w-10 bg-orange-100 rounded-full items-center justify-center mr-3">
                            <Ionicons name="trending-down-outline" size={24} color="#EA580C" />
                        </View>
                        <View className="flex-1">
                            <Text className="text-orange-800 font-bold text-sm">Stock Crítico</Text>
                            <Text className="text-orange-600 text-xs">{stats.criticalStock} productos bajo el mínimo.</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color="#EA580C" />
                    </View>
                )}
            </View>
        </View>
    )
}

export function WarehouseRecentActivity({ activities }: { activities: RecentActivity[] }) {
    if (!activities || activities.length === 0) {
        return (
            <View className="mx-4 mt-6 mb-6">
                <Text className="text-neutral-500 text-xs font-bold uppercase mb-3 ml-1">Actividad Reciente</Text>
                <View className="bg-neutral-50 p-4 rounded-xl items-center justify-center border border-neutral-100 border-dashed">
                    <Text className="text-neutral-400 text-xs">Sin actividad reciente</Text>
                </View>
            </View>
        )
    }

    return (
        <View className="mx-4 mt-6 mb-6">
            <Text className="text-neutral-500 text-xs font-bold uppercase mb-3 ml-1">Actividad Reciente</Text>
            <View className="bg-white rounded-xl border border-neutral-100 overflow-hidden">
                {activities.map(activity => (
                    <ActivityRow
                        key={activity.id}
                        icon={activity.type === 'approved' ? 'checkmark-circle' : activity.type === 'rejected' ? 'close-circle' : 'cube'}
                        color={activity.type === 'approved' ? '#10B981' : activity.type === 'rejected' ? '#EF4444' : '#3B82F6'}
                        title={activity.title}
                        time={activity.timestamp} // Should be formatted relative time
                    />
                ))}
            </View>
        </View>
    )
}

function ActivityRow({ icon, color, title, time }: { icon: any, color: string, title: string, time: string }) {
    return (
        <View className="flex-row items-center p-4 border-b border-neutral-50 last:border-0">
            <Ionicons name={icon} size={20} color={color} style={{ marginRight: 12 }} />
            <View className="flex-1">
                <Text className="text-neutral-800 font-medium text-sm">{title}</Text>
            </View>
            <Text className="text-neutral-400 text-xs">{time}</Text>
        </View>
    )
}
