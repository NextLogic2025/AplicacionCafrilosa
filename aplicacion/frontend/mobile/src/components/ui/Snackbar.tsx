import { BRAND_COLORS } from '../../shared/types'
import { Ionicons } from '@expo/vector-icons'
import * as React from 'react'
import { Animated, Text, View } from 'react-native'

type SnackbarProps = {
    message: string
    visible: boolean
    onDismiss: () => void
    duration?: number
    type?: 'success' | 'info' | 'error'
}

export function Snackbar({ message, visible, onDismiss, duration = 3000, type = 'success' }: SnackbarProps) {
    const opacity = React.useRef(new Animated.Value(0)).current
    const translateY = React.useRef(new Animated.Value(20)).current

    React.useEffect(() => {
        if (visible) {
            Animated.parallel([
                Animated.timing(opacity, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.spring(translateY, {
                    toValue: 0,
                    useNativeDriver: true,
                })
            ]).start()

            const timer = setTimeout(() => {
                hide()
            }, duration)

            return () => clearTimeout(timer)
        } else {
            hide()
        }
    }, [visible])

    const hide = () => {
        Animated.parallel([
            Animated.timing(opacity, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
            }),
            Animated.timing(translateY, {
                toValue: 20,
                duration: 300,
                useNativeDriver: true,
            })
        ]).start(() => onDismiss())
    }

    const getIcon = () => {
        switch (type) {
            case 'success': return 'checkmark-circle'
            case 'error': return 'alert-circle'
            default: return 'information-circle'
        }
    }

    const getColor = () => {
        switch (type) {
            case 'success': return '#059669'
            case 'error': return '#DC2626'
            default: return '#374151'
        }
    }

    if (!visible) return null

    return (
        <Animated.View
            className="absolute left-5 right-5 p-4 rounded-xl flex-row items-center shadow-lg z-[2000]"
            style={{
                bottom: 90,
                opacity,
                transform: [{ translateY }],
                backgroundColor: '#1F2937',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 4.65,
                elevation: 8,
            }}
        >
            <Ionicons name={getIcon()} size={20} color={type === 'success' ? '#34D399' : '#fff'} className="mr-3" />
            <Text className="text-white font-semibold text-sm">{message}</Text>
        </Animated.View>
    )
}

