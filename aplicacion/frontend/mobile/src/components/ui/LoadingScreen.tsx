import { BRAND_COLORS } from '@cafrilosa/shared-types'
import React from 'react'
import { View, ActivityIndicator } from 'react-native'

/**
 * Reusable Loading Screen Component
 * Shows a centered spinner while data is loading
 */
export function LoadingScreen() {
    return (
        <View className="flex-1 justify-center items-center bg-neutral-50">
            <ActivityIndicator size="large" color={BRAND_COLORS.red} />
        </View>
    )
}
