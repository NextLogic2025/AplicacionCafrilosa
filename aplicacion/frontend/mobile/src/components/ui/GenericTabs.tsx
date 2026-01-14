
import React from 'react'
import { View, Text, TouchableOpacity, ScrollView } from 'react-native'
import { BRAND_COLORS } from '../../shared/types'

interface TabItem {
    key: string
    label: string
}

interface GenericTabsProps {
    tabs: TabItem[]
    activeTab: string
    onTabChange: (key: string) => void
    containerClassName?: string
}

export function GenericTabs({ tabs, activeTab, onTabChange, containerClassName }: GenericTabsProps) {
    return (
        <View className={`border-b border-neutral-100 bg-white ${containerClassName}`}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-4" contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}>
                {tabs.map((tab) => {
                    const isActive = activeTab === tab.key
                    return (
                        <TouchableOpacity
                            key={tab.key}
                            onPress={() => onTabChange(tab.key)}
                            className={`mr-6 py-4 border-b-2 ${isActive ? 'border-red-500' : 'border-transparent'}`}
                        >
                            <Text
                                className={`text-sm font-semibold ${isActive ? 'text-red-500' : 'text-neutral-500'
                                    }`}
                            >
                                {tab.label}
                            </Text>
                        </TouchableOpacity>
                    )
                })}
            </ScrollView>
        </View>
    )
}
