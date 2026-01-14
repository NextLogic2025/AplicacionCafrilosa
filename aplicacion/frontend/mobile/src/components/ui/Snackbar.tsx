import { BRAND_COLORS } from '../../shared/types'
import { Ionicons } from '@expo/vector-icons'
import * as React from 'react'
import { Animated, StyleSheet, Text, View } from 'react-native'

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
            case 'success': return '#059669' // brand greenish
            case 'error': return '#DC2626'
            default: return '#374151'
        }
    }

    if (!visible) return null

    return (
        <Animated.View
            style={[
                styles.container,
                { opacity, transform: [{ translateY }] },
                { backgroundColor: '#1F2937' } // Dark toast
            ]}
        >
            <Ionicons name={getIcon()} size={20} color={type === 'success' ? '#34D399' : '#fff'} style={{ marginRight: 12 }} />
            <Text style={styles.text}>{message}</Text>
        </Animated.View>
    )
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: 90, // Above tabs/FAB
        left: 20,
        right: 20,
        padding: 16,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4.65,
        elevation: 8,
        zIndex: 2000,
    },
    text: {
        color: 'white',
        fontWeight: '600',
        fontSize: 14
    }
})
