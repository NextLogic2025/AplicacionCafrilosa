import { BRAND_COLORS } from '@cafrilosa/shared-types'
import { Ionicons } from '@expo/vector-icons'
import * as React from 'react'
import {
    Animated,
    Dimensions,
    Pressable,
    StyleSheet,
    Text,
    View,
    TouchableOpacity
} from 'react-native'

export type FabAction = {
    icon: keyof typeof Ionicons.glyphMap
    label: string
    onPress: () => void
    color?: string
}

type Props = {
    actions: FabAction[]
    onPressMain?: () => void
}

export function ExpandableFab({ actions, onPressMain }: Props) {
    const [isOpen, setIsOpen] = React.useState(false)
    const animation = React.useRef(new Animated.Value(0)).current

    const toggleMenu = () => {
        const toValue = isOpen ? 0 : 1

        Animated.spring(animation, {
            toValue,
            friction: 5,
            tension: 40,
            useNativeDriver: true,
        }).start()

        setIsOpen(!isOpen)
    }

    const closeMenu = () => {
        Animated.spring(animation, {
            toValue: 0,
            friction: 5,
            tension: 40,
            useNativeDriver: true,
        }).start()
        setIsOpen(false)
    }

    const rotation = animation.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '45deg'],
    })

    const opacity = animation.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 1],
    })

    // Estilos y animaciones para los botones de acción
    const getActionStyle = (index: number) => {
        // Desplegar hacia arriba, espaciado de 60px
        const translateY = animation.interpolate({
            inputRange: [0, 1],
            outputRange: [0, -60 * (index + 1)],
        })

        const scale = animation.interpolate({
            inputRange: [0, 0.5, 1],
            outputRange: [0, 0.5, 1],
        })

        return {
            transform: [{ translateY }, { scale }],
            opacity, // Aparecer suavemente
        }
    }

    return (
        <View style={[StyleSheet.absoluteFill, styles.rootContainer]} pointerEvents="box-none">

            {/* Backdrop (Fondo oscuro) */}
            <Animated.View
                style={[
                    StyleSheet.absoluteFill,
                    { backgroundColor: 'rgba(0,0,0,0.4)', opacity }
                ]}
                pointerEvents={isOpen ? 'auto' : 'none'}
            >
                <Pressable style={StyleSheet.absoluteFill} onPress={closeMenu} />
            </Animated.View>

            {/* Contenedor de Botones y FAB (Posicionado abajo a la derecha) */}
            <View style={styles.fabContainer} pointerEvents="box-none">

                {/* Acciones */}
                <View style={styles.actionsContainer} pointerEvents="box-none">
                    {actions.map((action, index) => (
                        <Animated.View
                            key={index}
                            style={[styles.actionItem, getActionStyle(index)]}
                            pointerEvents={isOpen ? 'auto' : 'none'}
                        >
                            <TouchableOpacity
                                activeOpacity={0.8}
                                onPress={() => {
                                    closeMenu()
                                    action.onPress()
                                }}
                                style={styles.actionItem}
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

                {/* FAB Principal */}
                <Pressable
                    onPress={toggleMenu}
                    style={[styles.fab, { shadowColor: BRAND_COLORS.red, elevation: isOpen ? 0 : 6 }]} // Remove elevation when open to avoid shadow stacking weirdness if needed, or keep it.
                >
                    <Animated.View style={{ transform: [{ rotate: rotation }] }}>
                        <Ionicons name="add" size={32} color="white" />
                    </Animated.View>
                </Pressable>
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    rootContainer: {
        zIndex: 9999, // Super high to be on top of everything
        elevation: 99,
    },
    fabContainer: {
        position: 'absolute',
        bottom: 90,
        right: 24,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
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
        elevation: 6,
        zIndex: 10,
    },
    actionsContainer: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        alignItems: 'flex-end',
        width: 60,
        height: 650, // Increased height for 7 items
        zIndex: 20,
        elevation: 20, // Critical for android touches
    },
    actionItem: {
        position: 'absolute',
        bottom: 0,
        right: 8,
        width: 200,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        paddingRight: 0,
        zIndex: 30, // Higher than container
        elevation: 30,
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
        elevation: 10,
        zIndex: 40,
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
        elevation: 10,
        zIndex: 40,
    },
    label: {
        fontSize: 12,
        fontWeight: '600',
        color: '#374151',
    },
})
