import { BRAND_COLORS } from '@cafrilosa/shared-types'
import { LinearGradient } from 'expo-linear-gradient'
import * as React from 'react'
import { ActivityIndicator, Pressable, Text, ViewStyle } from 'react-native'

type Props = {
  title: string
  onPress: () => void
  loading?: boolean
  disabled?: boolean
  style?: ViewStyle
}

export const PrimaryButton = React.memo(function PrimaryButton({
  title,
  onPress,
  loading,
  disabled,
  style,
}: Props) {
  const isDisabled = disabled || loading

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={isDisabled}
      className={['overflow-hidden rounded-2xl', isDisabled ? 'opacity-60' : 'active:opacity-90'].join(' ')}
      style={({ pressed }) => [pressed && !isDisabled ? { transform: [{ translateY: 1 }] } : null, style]}
    >
      <LinearGradient
        colors={[BRAND_COLORS.red, BRAND_COLORS.red700]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{ paddingVertical: 12, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center' }}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text className="font-extrabold text-white">{title}</Text>
        )}
      </LinearGradient>
    </Pressable>
  )
})
