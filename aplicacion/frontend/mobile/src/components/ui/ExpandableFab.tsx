import { BRAND_COLORS } from '../../shared/types'
import { Ionicons } from '@expo/vector-icons'
import * as React from 'react'
import {
    Animated,
    Pressable,
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    Modal
} from 'react-native'

export type FabAction = {
    icon: keyof typeof Ionicons.glyphMap
    label: string
    onPress: () => void
    color?: string
}

type Props = {
    actions: FabAction[]
}

export function ExpandableFab({ actions }: Props) {
    const [isOpen, setIsOpen] = React.useState(false)
    const animation = React.useRef(new Animated.Value(0)).current

    React.useEffect(() => {
        if (isOpen) {
            Animated.spring(animation, {
                toValue: 1,
                friction: 5,
                tension: 40,
                useNativeDriver: true,
            }).start()
        } else {
            Animated.spring(animation, {
                toValue: 0,
                friction: 5,
                tension: 40,
                useNativeDriver: true,
            }).start()
        }
    }, [isOpen])

    const closeMenu = () => {
        setIsOpen(false)
    }

    const rotation = animation.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '45deg'],
    })

    // Estilos y animaciones para los botones de acción
    const getActionStyle = (index: number) => {
        // Desplegar hacia arriba, espaciado de 60px
        const translateY = animation.interpolate({
            inputRange: [0, 1],
            outputRange: [20, -60 * (index + 1)], // Start slightly lower to pop up
        })

        const scale = animation.interpolate({
            inputRange: [0, 0.5, 1],
            outputRange: [0, 0.5, 1],
        })

        return {
            transform: [{ translateY }, { scale }],
            opacity: animation,
        }
    }

    const renderFabButton = (onPress: () => void, isClone: boolean = false) => (
        <View style={styles.fabContainer}>
            <Pressable
                onPress={onPress}
                style={[styles.fab, { shadowColor: BRAND_COLORS.red, elevation: isClone ? 0 : 5 }]}
            >
                <Animated.View style={{ transform: [{ rotate: rotation }] }}>
                    <Ionicons name="add" size={32} color="white" />
                </Animated.View>
            </Pressable>
        </View>
    )

    return (
        <>
            {/* 1. Botón "Real" (Visible cuando el menú está cerrado) */}
            {!isOpen && renderFabButton(() => setIsOpen(true))}

            {/* 2. Capa Superior (Visible cuando el menú está abierto) */}
            <Modal
                visible={isOpen}
                transparent={true}
                animationType="fade"
                onRequestClose={closeMenu}
                statusBarTranslucent={true}
            >
                {/* Fondo oscuro (Backdrop) */}
                <Pressable
                    style={styles.backdrop}
                    onPress={closeMenu}
                >
                    <View style={StyleSheet.absoluteFill} />
                </Pressable>

                {/* Acciones del Menú */}
                <View style={styles.actionsContainer} pointerEvents="box-none">
                    {actions.map((action, index) => (
                        <Animated.View
                            key={index}
                            style={[styles.actionItem, getActionStyle(index)]}
                        >
                            <TouchableOpacity
                                activeOpacity={0.8}
                                onPress={() => {
                                    closeMenu()
                                    action.onPress()
                                }}
                                style={styles.actionButtonContent}
                            >
                                <View style={styles.labelContainer}>
                                    <Text style={styles.label}>{action.label}</Text>
                                </View>
                                <View style={[styles.miniFab, { backgroundColor: 'white' }]}>
                                    <Ionicons
                                        name={action.icon as any}
                                        size={20}
                                        color={BRAND_COLORS.red}
                                    />
                                </View>
                            </TouchableOpacity>
                        </Animated.View>
                    ))}
                </View>

                {/* 3. Botón "Clon" (Para cerrar) - Misma posición exacta */}
                {renderFabButton(closeMenu, true)}
            </Modal>
        </>
    )
}

const styles = StyleSheet.create({
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.4)',
    },
    fabContainer: {
        position: 'absolute',
        bottom: 110, // Adjusted to avoid potential tab bar conflicts visually if needed, but user kept 110 in old code
        right: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    fab: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: BRAND_COLORS.red,
        alignItems: 'center',
        justifyContent: 'center',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    actionsContainer: {
        position: 'absolute',
        bottom: 110, // Anchor relative to FAB position
        right: 24,
        alignItems: 'flex-end',
        justifyContent: 'flex-end',
        zIndex: 40,
    },
    actionItem: {
        position: 'absolute',
        right: 6, // Center align with FAB (56/2 - 40/2 + offset?) Visual tweaking might be needed, keeping simple.
        // Actually, previous code used fixed bottom offsets.
        // Let's rely on translateY from getActionStyle relative to this container.
        bottom: 0,
        alignItems: 'flex-end',
        justifyContent: 'center',
        width: 200,
        paddingRight: 0,
    },
    actionButtonContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        paddingVertical: 4, // Spacing between items handled by translateY
    },
    miniFab: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 5,
    },
    labelContainer: {
        marginRight: 12,
        backgroundColor: 'white',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 5,
    },
    label: {
        fontSize: 12,
        fontWeight: '600',
        color: '#374151',
    },
})
