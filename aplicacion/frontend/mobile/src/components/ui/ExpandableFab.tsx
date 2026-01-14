import { BRAND_COLORS } from '../../shared/types'
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
    tabActions?: FabAction[] // Acciones de navegación de tabs (opcional)
    onPressMain?: () => void
}

export function ExpandableFab({ actions, tabActions, onPressMain }: Props) {
    const [isOpen, setIsOpen] = React.useState(false)
    const animation = React.useRef(new Animated.Value(0)).current
    const backdropOpacity = React.useRef(new Animated.Value(0)).current
    const tabBarAnimation = React.useRef(new Animated.Value(0)).current // Animación para la barra de tabs

    const toggleMenu = () => {
        const toValue = isOpen ? 0 : 1

        if (!isOpen) {
            setIsOpen(true)
        }

        Animated.parallel([
            Animated.spring(animation, {
                toValue,
                friction: 5,
                tension: 40,
                useNativeDriver: true,
            }),
            Animated.timing(backdropOpacity, {
                toValue,
                duration: 200,
                useNativeDriver: true,
            }),
            // Animación para mostrar/ocultar la barra de tabs
            Animated.spring(tabBarAnimation, {
                toValue,
                friction: 6,
                tension: 40,
                useNativeDriver: true,
            })
        ]).start(() => {
            if (isOpen) {
                setIsOpen(false)
            }
        })
    }

    const closeMenu = () => {
        Animated.parallel([
            Animated.spring(animation, {
                toValue: 0,
                friction: 5,
                tension: 40,
                useNativeDriver: true,
            }),
            Animated.timing(backdropOpacity, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
            }),
            Animated.spring(tabBarAnimation, {
                toValue: 0,
                friction: 6,
                tension: 40,
                useNativeDriver: true,
            })
        ]).start(() => {
            setIsOpen(false)
        })
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
        <>
            {/* Backdrop (Fondo oscuro semi-transparente) - Cubre toda la pantalla incluyendo TabNavigation */}
            <Animated.View
                style={[
                    StyleSheet.absoluteFill,
                    {
                        backgroundColor: 'rgba(0,0,0,0.4)',
                        opacity: backdropOpacity,
                        zIndex: 99999, // Muy alto para cubrir TabNavigation (zIndex: 50)
                    }
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

                {/* FAB Principal */}
                <Pressable
                    onPress={toggleMenu}
                    style={[styles.fab, { shadowColor: BRAND_COLORS.red, elevation: isOpen ? 0 : 5 }]}
                >
                    <Animated.View style={{ transform: [{ rotate: rotation }] }}>
                        <Ionicons name="add" size={32} color="white" />
                    </Animated.View>
                </Pressable>
            </View>

            {/* Barra de navegación de tabs (Header oscuro overlay) - Solo si se proporcionan tabActions */}
            {tabActions && tabActions.length > 0 && (
                <Animated.View
                    style={[
                        styles.tabBarOverlay,
                        {
                            opacity: tabBarAnimation,
                            transform: [
                                {
                                    translateY: tabBarAnimation.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: [100, 0], // Se desliza desde abajo
                                    }),
                                },
                            ],
                        }
                    ]}
                    pointerEvents={isOpen ? 'auto' : 'none'}
                >
                    <View style={styles.tabBarContent}>
                        {tabActions.map((tab, index) => (
                            <TouchableOpacity
                                key={index}
                                style={styles.tabButton}
                                onPress={() => {
                                    closeMenu()
                                    tab.onPress()
                                }}
                                activeOpacity={0.7}
                            >
                                <View style={styles.tabIconCircle}>
                                    <Ionicons
                                        name={tab.icon as any}
                                        size={24}
                                        color="#FFFFFF"
                                    />
                                </View>
                                <Text style={styles.tabLabel}>{tab.label}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </Animated.View>
            )}
        </>
    )
}

const styles = StyleSheet.create({
    fabContainer: {
        position: 'absolute',
        bottom: 110,
        right: 24,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100000, // Más alto que el backdrop para estar encima
        backgroundColor: 'transparent',
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
        zIndex: 50,
    },
    actionsContainer: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        alignItems: 'flex-end',
        width: 60,
        height: 650,
        zIndex: 40,
        backgroundColor: 'transparent', // Ensure no shadow from this
    },
    actionItem: {
        position: 'absolute',
        bottom: 0,
        right: 8,
        width: 200,
        alignItems: 'flex-end', // Align content to right
        justifyContent: 'center',
        paddingRight: 0,
        zIndex: 45,
        backgroundColor: 'transparent', // Ensure no shadow from this
    },
    actionButtonContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
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
    // Estilos para la barra de tabs overlay (Header oscuro)
    tabBarOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(30, 30, 30, 0.97)', // Fondo oscuro semi-transparente
        paddingBottom: 24,
        paddingTop: 16,
        zIndex: 99998, // Justo debajo del backdrop pero encima de todo lo demás
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 20,
    },
    tabBarContent: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    tabButton: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 8,
        paddingHorizontal: 12,
        minWidth: 70,
    },
    tabIconCircle: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: BRAND_COLORS.red,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 6,
        shadowColor: BRAND_COLORS.red,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.4,
        shadowRadius: 4,
        elevation: 4,
    },
    tabLabel: {
        fontSize: 11,
        fontWeight: '700',
        color: '#FFFFFF',
        letterSpacing: 0.3,
    },
})
