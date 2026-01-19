import { BRAND_COLORS } from '../../shared/types'
import React from 'react'
import { View, ActivityIndicator } from 'react-native'

export function LoadingScreen() {
    return (
        <View className="flex-1 justify-center items-center bg-neutral-50">
            <ActivityIndicator size="large" color={BRAND_COLORS.red} />
        </View>
    )
}
