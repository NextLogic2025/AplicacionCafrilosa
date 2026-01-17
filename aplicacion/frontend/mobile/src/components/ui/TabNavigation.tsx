import { BottomTabBarProps } from '@react-navigation/bottom-tabs'
import { Text, View, Pressable, Platform } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { BRAND_COLORS } from '../../shared/types'
import { useCartOptional } from '../../context/CartContext'

const getIconName = (routeName: string, isFocused: boolean): keyof typeof Ionicons.glyphMap => {
    switch (routeName) {
        case 'Inicio':
        case 'Home':
        case 'Dashboard':
            return isFocused ? 'home' : 'home-outline'
        case 'Perfil':
        case 'Profile':
            return isFocused ? 'person' : 'person-outline'
        case 'Carrito':
        case 'Cart':
            return isFocused ? 'cart' : 'cart-outline'
        case 'Pedidos':
        case 'Orders':
            return isFocused ? 'receipt' : 'receipt-outline'
        case 'Entregas':
            return isFocused ? 'car' : 'car-outline'
        case 'Equipo':
            return isFocused ? 'people' : 'people-outline'
        case 'Productos':
        case 'Products':
            return isFocused ? 'cube' : 'cube-outline'
        case 'Configuracion':
        case 'Settings':
            return isFocused ? 'settings' : 'settings-outline'
        // Bodeguero Routes
        case 'WarehouseHome':
            return isFocused ? 'home' : 'home-outline'
        case 'WarehouseOrders':
            return isFocused ? 'receipt' : 'receipt-outline'
        case 'WarehouseInventory':
            return isFocused ? 'cube' : 'cube-outline'
        case 'WarehouseProfile':
            return isFocused ? 'person' : 'person-outline'

        // Seller Routes
        case 'SellerHome':
            return isFocused ? 'home' : 'home-outline'
        case 'SellerClients':
            return isFocused ? 'people' : 'people-outline'
        case 'SellerProductList':
            return isFocused ? 'cube' : 'cube-outline'
        case 'SellerCart':
            return isFocused ? 'cart' : 'cart-outline'
        case 'SellerOrder':
            return isFocused ? 'cart' : 'cart-outline'
        case 'SellerProfile':
            return isFocused ? 'person' : 'person-outline'

        // Transportista Routes
        case 'TransportistaHome':
            return isFocused ? 'home' : 'home-outline'
        case 'TransportistaOrders':
            return isFocused ? 'receipt' : 'receipt-outline'
        case 'TransportistaDeliveries':
            return isFocused ? 'cube' : 'cube-outline'
        case 'TransportistaProfile':
            return isFocused ? 'person' : 'person-outline'
        default:
            return isFocused ? 'ellipse' : 'ellipse-outline'

    }
}

export function TabNavigation({ state, descriptors, navigation }: BottomTabBarProps) {
    const insets = useSafeAreaInsets()

    // useCartOptional retorna null si no está dentro de CartProvider
    // Esto permite que TabNavigation funcione en todos los navegadores
    const cart = useCartOptional()
    const cartItemCount = cart?.getItemCount() ?? 0

    return (
        <View
            className="absolute bottom-0 left-0 right-0 bg-white border-t border-neutral-100 rounded-t-[24px] shadow-lg shadow-black/10"
            style={{
                paddingBottom: Math.max(insets.bottom, 16) + 14,
                paddingTop: 12,
                paddingHorizontal: 6,
                elevation: 12,
                zIndex: 50, 
            }}
        >
            <View className="flex-row items-center justify-around w-full">
                {state.routes.map((route, index) => {
                    const { options } = descriptors[route.key]
                    const label =
                        options.tabBarLabel !== undefined
                            ? options.tabBarLabel
                            : options.title !== undefined
                                ? options.title
                                : route.name

                    const isFocused = state.index === index

                    const onPress = () => {
                        const event = navigation.emit({
                            type: 'tabPress',
                            target: route.key,
                            canPreventDefault: true,
                        })

                        if (!isFocused && !event.defaultPrevented) {
                            navigation.navigate(route.name, route.params)
                        }
                    }

                    const onLongPress = () => {
                        navigation.emit({
                            type: 'tabLongPress',
                            target: route.key,
                        })
                    }

                    const iconName = getIconName(route.name, isFocused)
                    const color = isFocused ? BRAND_COLORS.red : '#94A3B8' // brand-red vs neutral-400
                    const isCartTab = route.name === 'SellerCart' || route.name === 'Cart' || route.name === 'Carrito'
                    const showBadge = isCartTab && cartItemCount > 0

                    return (
                        <Pressable
                            key={route.key}
                            accessibilityRole="button"
                            accessibilityState={isFocused ? { selected: true } : {}}
                            accessibilityLabel={options.tabBarAccessibilityLabel}
                            onPress={onPress}
                            onLongPress={onLongPress}
                            className="items-center justify-center flex-1"
                        >
                            <View className={`items-center justify-center rounded-2xl px-4 py-1.5 ${isFocused ? 'bg-brand-red/10' : 'bg-transparent'}`}>
                                <Ionicons name={iconName} size={24} color={color} />
                                {showBadge && (
                                    <View
                                        style={{
                                            position: 'absolute',
                                            top: -4,
                                            right: -4,
                                            backgroundColor: '#DC2626',
                                            borderRadius: 10,
                                            minWidth: 20,
                                            height: 20,
                                            justifyContent: 'center',
                                            alignItems: 'center',
                                            paddingHorizontal: 4,
                                            borderWidth: 2,
                                            borderColor: '#FFFFFF'
                                        }}
                                    >
                                        <Text
                                            style={{
                                                color: '#FFFFFF',
                                                fontSize: 11,
                                                fontWeight: '700'
                                            }}
                                        >
                                            {cartItemCount > 99 ? '99+' : cartItemCount}
                                        </Text>
                                    </View>
                                )}
                            </View>
                            <Text
                                className={`text-[10px] mt-1 font-medium ${isFocused ? 'text-brand-red' : 'text-neutral-400'}`}
                            >
                                {label as string}
                            </Text>
                        </Pressable>
                    )
                })}
            </View>
        </View>
    )
}
