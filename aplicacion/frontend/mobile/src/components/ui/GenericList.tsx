import { BRAND_COLORS } from '../../shared/types'
import { Ionicons } from '@expo/vector-icons'
import React from 'react'
import { View, Text, ScrollView, RefreshControl } from 'react-native'

export interface EmptyStateConfig {
    icon: keyof typeof Ionicons.glyphMap
    title: string
    message: string
}

export interface GenericListProps<T> {
    items: T[]
    isLoading: boolean
    onRefresh: () => void
    renderItem: (item: T) => React.ReactNode
    emptyState: EmptyStateConfig
}

/**
 * Generic List Component
 * Reusable list view with loading, empty states, and refresh functionality
 */
export function GenericList<T>({
    items,
    isLoading,
    onRefresh,
    renderItem,
    emptyState
}: GenericListProps<T>) {
    if (isLoading && items.length === 0) {
        return (
            <View className="flex-1 justify-center items-center bg-neutral-50">
                <Ionicons
                    name="hourglass-outline"
                    size={48}
                    color={BRAND_COLORS.red}
                    style={{ opacity: 0.5 }}
                />
            </View>
        )
    }

    if (items.length === 0) {
        return (
            <ScrollView
                className="flex-1 bg-neutral-50"
                contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: 20 }}
                refreshControl={
                    <RefreshControl
                        refreshing={isLoading}
                        onRefresh={onRefresh}
                        tintColor={BRAND_COLORS.red}
                    />
                }
            >
                <View className="items-center">
                    <View className="p-4 rounded-full mb-4" style={{ backgroundColor: `${BRAND_COLORS.red}15` }}>
                        <Ionicons
                            name={emptyState.icon}
                            size={40}
                            color={BRAND_COLORS.red}
                        />
                    </View>
                    <Text className="text-lg font-bold text-neutral-900 text-center mb-2">
                        {emptyState.title}
                    </Text>
                    <Text className="text-center text-neutral-500 text-sm">
                        {emptyState.message}
                    </Text>
                </View>
            </ScrollView>
        )
    }

    return (
        <ScrollView
            className="flex-1 bg-neutral-50 px-5 pt-5"
            refreshControl={
                <RefreshControl
                    refreshing={isLoading}
                    onRefresh={onRefresh}
                    tintColor={BRAND_COLORS.red}
                />
            }
            contentContainerStyle={{ paddingBottom: 100 }}
        >
            {items.map((item, index) => (
                <View key={index}>
                    {renderItem(item)}
                </View>
            ))}
        </ScrollView>
    )
}
