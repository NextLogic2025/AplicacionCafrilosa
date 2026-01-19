import React from 'react'
import { View, Text, FlatList, TouchableOpacity, Modal, Pressable } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { BRAND_COLORS } from '../../shared/types'

export type NotificationListItem = {
    id: string
    title?: string
    message: string
    date: string
    type?: 'info' | 'warning' | 'success' | 'error' | 'promo' | 'critical'
    read?: boolean
    data?: any
}

type Props = {
    items: NotificationListItem[]
    isLoading?: boolean
    onRefresh?: () => void
    onMarkRead?: (id: string) => void
    emptyState?: { title: string; message: string }
}

const typeStyle = (type?: string) => {
    const map: Record<string, { bg: string; text: string; border: string; icon: keyof typeof Ionicons.glyphMap }> = {
        success: { bg: '#E9FCEB', text: '#14532D', border: '#16A34A', icon: 'checkmark-circle' },
        warning: { bg: '#FFF6E6', text: '#92400E', border: '#D97706', icon: 'warning' },
        error: { bg: '#FDECEC', text: '#991B1B', border: '#DC2626', icon: 'alert-circle' },
        promo: { bg: '#EEF2FF', text: '#4338CA', border: '#6366F1', icon: 'pricetag' },
        critical: { bg: '#FEF2F2', text: '#991B1B', border: '#DC2626', icon: 'alert' },
        info: { bg: '#ECF5FF', text: '#1E3A8A', border: '#1D4ED8', icon: 'information-circle' },
    }
    return map[type || 'info'] || map.info
}

export function NotificationList({ items, isLoading = false, onRefresh, onMarkRead, emptyState }: Props) {
    const [selected, setSelected] = React.useState<NotificationListItem | null>(null)

    const renderItem = ({ item }: { item: NotificationListItem }) => {
        const colors = typeStyle(item.type)
        const read = item.read
        return (
            <Pressable
                onPress={() => setSelected(item)}
                className="mb-3 rounded-2xl border bg-white shadow-sm"
                style={{ borderColor: colors.border + '33', shadowColor: '#000', shadowOpacity: 0.05, shadowOffset: { width: 0, height: 2 }, shadowRadius: 6, elevation: 2 }}
            >
                <View className="flex-row items-start p-4">
                    <View className="w-10 h-10 rounded-full items-center justify-center mr-3" style={{ backgroundColor: colors.bg, borderColor: colors.border, borderWidth: 1 }}>
                        <Ionicons name={colors.icon} size={18} color={colors.border} />
                    </View>
                    <View className="flex-1">
                        {item.title ? (
                            <Text className={`text-sm font-bold ${read ? 'text-neutral-700' : 'text-neutral-900'}`} numberOfLines={1}>
                                {item.title}
                            </Text>
                        ) : null}
                        <Text className={`text-sm ${read ? 'text-neutral-500' : 'text-neutral-800'} mt-0.5`} numberOfLines={3}>
                            {item.message}
                        </Text>
                        <View className="flex-row items-center justify-between mt-3">
                            <Text className="text-xs text-neutral-400">{new Date(item.date).toLocaleString()}</Text>
                            {!read && onMarkRead && (
                                <TouchableOpacity onPress={() => onMarkRead(item.id)} className="px-3 py-1 rounded-full" style={{ backgroundColor: colors.bg, borderColor: colors.border, borderWidth: 1 }}>
                                    <Text className="text-[11px] font-semibold" style={{ color: colors.text }}>Marcar leida</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>
                </View>
            </Pressable>
        )
    }

    if (!isLoading && items.length === 0) {
        return (
            <View className="flex-1 items-center justify-center px-8">
                <Ionicons name="notifications-off-outline" size={42} color="#9CA3AF" />
                <Text className="text-lg font-bold text-neutral-800 mt-3">{emptyState?.title || 'Sin notificaciones'}</Text>
                <Text className="text-neutral-500 text-sm text-center mt-1">{emptyState?.message || 'No tienes mensajes nuevos.'}</Text>
            </View>
        )
    }

    return (
        <>
            <FlatList
                data={items}
                keyExtractor={(item) => item.id}
                renderItem={renderItem}
                contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
                refreshing={isLoading}
                onRefresh={onRefresh}
            />
            {selected ? (
                <Modal transparent animationType="fade" visible={true} onRequestClose={() => setSelected(null)}>
                    <Pressable className="flex-1 bg-black/40" onPress={() => setSelected(null)} />
                    <View className="absolute left-0 right-0 top-1/4 px-6">
                        <View className="bg-white rounded-2xl p-5 shadow-lg">
                            <View className="flex-row items-center mb-3">
                                <View
                                    className="w-10 h-10 rounded-full items-center justify-center mr-3"
                                    style={{
                                        backgroundColor: typeStyle(selected.type).bg,
                                        borderColor: typeStyle(selected.type).border,
                                        borderWidth: 1
                                    }}
                                >
                                    <Ionicons name={typeStyle(selected.type).icon} size={18} color={typeStyle(selected.type).border} />
                                </View>
                                <View className="flex-1">
                                    {selected.title ? (
                                        <Text className="text-base font-bold text-neutral-900">{selected.title}</Text>
                                    ) : null}
                                    <Text className="text-xs text-neutral-500 mt-1">{new Date(selected.date).toLocaleString()}</Text>
                                </View>
                                <Pressable onPress={() => setSelected(null)} className="p-2">
                                    <Ionicons name="close" size={20} color="#9CA3AF" />
                                </Pressable>
                            </View>
                            <Text className="text-neutral-700 text-sm leading-5">{selected.message}</Text>
                            {selected.data ? (
                                <View className="bg-neutral-50 rounded-xl border border-neutral-200 p-3 mt-3">
                                    <Text className="text-xs text-neutral-500 mb-1">Detalle</Text>
                                    <Text className="text-neutral-700 text-sm" numberOfLines={6}>
                                        {typeof selected.data === 'string' ? selected.data : JSON.stringify(selected.data, null, 2)}
                                    </Text>
                                </View>
                            ) : null}
                            <View className="flex-row justify-end mt-4">
                                <TouchableOpacity onPress={() => setSelected(null)} className="px-4 py-2 rounded-xl bg-brand-red">
                                    <Text className="text-white font-semibold text-sm">Cerrar</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Modal>
            ) : null}
        </>
    )
}
