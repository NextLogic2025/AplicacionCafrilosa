import React, { useEffect, useRef } from 'react'
import { Animated, Dimensions, Platform, View, Text } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

type NotificationToastProps = {
    message: string
    title?: string
    type?: 'info' | 'success' | 'warning' | 'error'
    duration?: number
    onHide?: () => void
}

const { width } = Dimensions.get('window')

const palette = {
    info: { bg: '#ECF5FF', border: '#1D4ED8', icon: 'information-circle' as const, text: '#1E3A8A' },
    success: { bg: '#E9FCEB', border: '#16A34A', icon: 'checkmark-circle' as const, text: '#14532D' },
    warning: { bg: '#FFF6E6', border: '#D97706', icon: 'warning' as const, text: '#92400E' },
    error: { bg: '#FDECEC', border: '#DC2626', icon: 'alert-circle' as const, text: '#991B1B' },
}

export function NotificationToast({ message, title, type = 'info', duration = 3500, onHide }: NotificationToastProps) {
    const translateY = useRef(new Animated.Value(-120)).current
    const opacity = useRef(new Animated.Value(0)).current
    const colors = palette[type] || palette.info

    useEffect(() => {
        Animated.parallel([
            Animated.timing(translateY, { toValue: Platform.OS === 'ios' ? 60 : 50, duration: 380, useNativeDriver: true }),
            Animated.timing(opacity, { toValue: 1, duration: 380, useNativeDriver: true }),
        ]).start()

        const timer = setTimeout(() => hide(), duration)
        return () => clearTimeout(timer)
    }, [duration])

    const hide = () => {
        Animated.parallel([
            Animated.timing(translateY, { toValue: -120, duration: 260, useNativeDriver: true }),
            Animated.timing(opacity, { toValue: 0, duration: 260, useNativeDriver: true }),
        ]).start(() => onHide?.())
    }

    return (
        <Animated.View
            className="absolute top-0 self-center rounded-2xl flex-row items-start p-4"
            style={{
                width: width * 0.9,
                backgroundColor: colors.bg,
                borderColor: colors.border,
                borderWidth: 1,
                opacity,
                transform: [{ translateY }],
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.12,
                shadowRadius: 8,
                elevation: 10,
                zIndex: 9999,
            }}
        >
            <View className="mr-3 mt-0.5">
                <Ionicons name={colors.icon} size={22} color={colors.border} />
            </View>
            <View className="flex-1">
                {title ? <Text className="text-sm font-bold mb-1" style={{ color: colors.text }}>{title}</Text> : null}
                <Text className="text-sm" style={{ color: colors.text }}>{message}</Text>
            </View>
        </Animated.View>
    )
}
