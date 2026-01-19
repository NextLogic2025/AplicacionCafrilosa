import { Ionicons } from '@expo/vector-icons'
import * as React from 'react'
import { Animated, Modal, Pressable, Text, View } from 'react-native'

import { BRAND_COLORS } from '../../shared/types'
import { useStableInsets } from '../../hooks/useStableInsets'

const ACTION_ITEM_SPACING = 62

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
    const insets = useStableInsets()
    const [isOpen, setIsOpen] = React.useState(false)
    const animation = React.useRef(new Animated.Value(0)).current
    const fabBottom = React.useMemo(() => {
        const base = 96
        return base + (insets.bottom || 16)
    }, [insets.bottom])

    const openMenu = React.useCallback(() => {
        setIsOpen(true)
        Animated.spring(animation, {
            toValue: 1,
            friction: 6,
            tension: 45,
            useNativeDriver: true,
        }).start()
    }, [animation])

    const closeMenu = React.useCallback((afterClose?: () => void) => {
        Animated.timing(animation, {
            toValue: 0,
            duration: 150,
            useNativeDriver: true,
        }).start(() => {
            setIsOpen(false)
            afterClose?.()
        })
    }, [animation])

    const rotation = animation.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '45deg'],
    })

    const backdropOpacity = animation.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 0.4],
    })

    const renderFab = (onPress: () => void) => (
        <View
            className="absolute right-6"
            style={{ bottom: fabBottom }}
            pointerEvents="box-none"
        >
            <Pressable
                onPress={onPress}
                accessibilityRole="button"
                className="w-14 h-14 rounded-full items-center justify-center bg-brand-red"
                style={{
                    shadowColor: BRAND_COLORS.red,
                    shadowOffset: { width: 0, height: 6 },
                    shadowOpacity: 0.35,
                    shadowRadius: 10,
                    elevation: 10,
                }}
            >
                <Animated.View style={{ transform: [{ rotate: rotation }] }}>
                    <Ionicons name="add" size={32} color="white" />
                </Animated.View>
            </Pressable>
        </View>
    )

    const getActionAnimatedStyle = (positionIndex: number) => {
        const translateY = animation.interpolate({
            inputRange: [0, 1],
            outputRange: [16, -ACTION_ITEM_SPACING * positionIndex],
        })

        const scale = animation.interpolate({
            inputRange: [0, 0.35, 1],
            outputRange: [0.9, 0.98, 1],
        })

        const opacity = animation.interpolate({
            inputRange: [0, 0.25, 1],
            outputRange: [0, 0, 1],
        })

        return {
            transform: [{ translateY }, { scale }],
            opacity,
        } as const
    }

    return (
        <>
            {!isOpen && renderFab(openMenu)}

            <Modal
                visible={isOpen}
                transparent
                animationType="fade"
                onRequestClose={() => closeMenu()}
                statusBarTranslucent
            >
                <View className="flex-1" pointerEvents="box-none">
                    <Animated.View
                        style={[
                            {
                                opacity: backdropOpacity,
                            },
                        ]}
                        className="absolute inset-0 bg-black"
                        pointerEvents="none"
                    />

                    <Pressable
                        className="absolute inset-0"
                        onPress={() => closeMenu()}
                    />

                    <View
                        className="absolute right-6 items-end"
                        style={{ bottom: fabBottom }}
                        pointerEvents="box-none"
                    >
                        {actions.map((action, index) => {
                            const positionIndex = actions.length - index
                            return (
                                <Animated.View
                                    key={action.label}
                                    style={[
                                        getActionAnimatedStyle(positionIndex),
                                    ]}
                                    className="absolute right-0 bottom-0 h-14 justify-center items-end"
                                    pointerEvents="box-none"
                                >
                                    <Pressable
                                        onPress={() => closeMenu(action.onPress)}
                                        accessibilityRole="button"
                                        className="flex-row items-center justify-end h-14"
                                    >
                                        <View
                                            className="mr-3 bg-white px-4 h-9 rounded-full justify-center border border-neutral-200"
                                            style={{
                                                shadowColor: '#000',
                                                shadowOffset: { width: 0, height: 2 },
                                                shadowOpacity: 0.12,
                                                shadowRadius: 4,
                                                elevation: 3,
                                                maxWidth: 200,
                                            }}
                                        >
                                            <Text
                                                className="text-[12px] font-semibold text-neutral-700"
                                                numberOfLines={1}
                                                ellipsizeMode="tail"
                                            >
                                                {action.label}
                                            </Text>
                                        </View>

                                        <View
                                            className="w-14 h-14 items-center justify-center"
                                            pointerEvents="none"
                                        >
                                            <View
                                                className="w-11 h-11 bg-white items-center justify-center rounded-full border border-neutral-200"
                                                style={{
                                                    shadowColor: '#000',
                                                    shadowOffset: { width: 0, height: 3 },
                                                    shadowOpacity: 0.16,
                                                    shadowRadius: 6,
                                                    elevation: 6,
                                                }}
                                            >
                                                <Ionicons
                                                    name={action.icon}
                                                    size={20}
                                                    color={action.color ?? BRAND_COLORS.red}
                                                />
                                            </View>
                                        </View>
                                    </Pressable>
                                </Animated.View>
                            )
                        })}
                    </View>

                    {renderFab(() => closeMenu())}
                </View>
            </Modal>
        </>
    )
}
