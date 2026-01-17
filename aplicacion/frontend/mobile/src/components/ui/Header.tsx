import { Ionicons } from '@expo/vector-icons'
import { BRAND_COLORS } from '../../shared/types'
import React from 'react'
import { Image, Pressable, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { navigationRef } from '../../navigation/navigationRef'
import { useNotificationsOptional } from '../../context/NotificationContext'

type HeaderProps = {
  userName?: string
  userImage?: string
  role?: string
  showNotification?: boolean
  notificationCount?: number
  useGlobalNotifications?: boolean
  onNotificationPress?: () => void
  showCart?: boolean
  cartCount?: number
  onCartPress?: () => void
  onMenuPress?: () => void
  style?: any
  variant?: 'home' | 'standard'
  title?: string
  onBackPress?: () => void
  notificationRoute?: string
  rightAction?: {
    icon: keyof typeof Ionicons.glyphMap
    onPress: () => void
  }
}

export function Header({
  userName,
  userImage,
  role,
  showNotification = true,
  notificationCount,
  useGlobalNotifications = true,
  onNotificationPress,
  showCart = false,
  cartCount = 0,
  onCartPress,
  onMenuPress,
  style,
  variant = 'home',
  title,
  onBackPress,
  notificationRoute,
  rightAction
}: HeaderProps) {
  const insets = useSafeAreaInsets()
  const notificationsCtx = useNotificationsOptional()

  const isStandard = variant === 'standard' || !!title

  const handleNotificationPress = () => {
    if (onNotificationPress) {
      onNotificationPress()
    } else if (notificationRoute) {
      if (navigationRef.isReady()) {
        navigationRef.navigate(notificationRoute as never);
      }
    }
    notificationsCtx?.markAllRead()
  }

  const effectiveNotificationCount = useGlobalNotifications
    ? (notificationCount ?? notificationsCtx?.badgeCount ?? 0)
    : (notificationCount ?? 0)

  return (
    <View
      className="bg-brand-red z-10"
      style={[
        { paddingTop: insets.top + 12, paddingBottom: 20, paddingHorizontal: 24 },
        style
      ]}
    >
      <View className="flex-row items-center justify-between">

        {isStandard ? (
          <View className="flex-row items-center flex-1">
            {onBackPress && (
              <Pressable onPress={onBackPress} className="mr-3 p-1">
                <Ionicons name="arrow-back" size={24} color="white" />
              </Pressable>
            )}
            <Text className="text-white text-xl font-bold flex-1">
              {title || 'Cafrilosa'}
            </Text>
          </View>
        ) : (
          <View className="flex-row items-center flex-1 mr-4">
            <Pressable onPress={onMenuPress} className="mr-3">
              <View className="h-12 w-12 rounded-full bg-white/20 items-center justify-center">
                {userImage ? (
                  <Image
                    source={{ uri: userImage }}
                    className="h-full w-full rounded-full"
                    resizeMode="cover"
                  />
                ) : (
                  <Text className="text-white text-lg font-bold">
                    {userName?.charAt(0).toUpperCase() || 'U'}
                  </Text>
                )}
              </View>
            </Pressable>

            <View className="flex-1">
              <Text className="text-red-100 text-xs font-medium mb-0.5">
                Bienvenido de nuevo
              </Text>
              <Text numberOfLines={1} className="text-white text-lg font-bold leading-tight">
                Hola, {userName?.split(' ')[0] || 'Cliente'}
              </Text>
              {role && (
                <View className="bg-brand-gold self-start px-2 py-0.5 rounded-full mt-1">
                  <Text className="text-brand-red font-bold text-[10px] uppercase tracking-wider">
                    {role}
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}

        <View className="flex-row items-center">
          {showCart && (
            <Pressable
              onPress={onCartPress}
              className="h-10 w-10 bg-white/10 rounded-full items-center justify-center active:bg-white/20 mr-3"
            >
              <Ionicons name="cart-outline" size={22} color="white" />
              {cartCount > 0 && (
                <View className="absolute top-2 right-2 h-2.5 w-2.5 bg-brand-gold rounded-full border border-brand-red" />
              )}
            </Pressable>
          )}

          {showNotification && (
            <Pressable
              onPress={handleNotificationPress}
              className="h-10 w-10 bg-white/10 rounded-full items-center justify-center active:bg-white/20 mr-3"
            >
              <Ionicons name="notifications-outline" size={22} color="white" />
              {effectiveNotificationCount > 0 && (
                <View className="absolute top-2 right-2 h-2.5 w-2.5 bg-brand-gold rounded-full border border-brand-red" />
              )}
            </Pressable>
          )}

          {rightAction && (
            <Pressable
              onPress={rightAction.onPress}
              className="h-10 w-10 bg-white/10 rounded-full items-center justify-center active:bg-white/20"
            >
              <Ionicons name={rightAction.icon} size={22} color="white" />
            </Pressable>
          )}

          {/* Menu Icon Removed by user request */}
        </View>
      </View>
    </View>
  )
}
