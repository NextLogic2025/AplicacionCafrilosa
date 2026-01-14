import { BRAND_COLORS } from '../../../shared/types'
import { StatusBar } from 'expo-status-bar'
import * as React from 'react'
import { Animated, Easing, Image, View } from 'react-native'

import logo from '../../../assets/logo'

type Props = {
  onDone: () => void
}

export function SplashScreen({ onDone }: Props) {
  const opacity = React.useRef(new Animated.Value(0)).current
  const scale = React.useRef(new Animated.Value(0.9)).current
  const rotate = React.useRef(new Animated.Value(0)).current
  const glow = React.useRef(new Animated.Value(0)).current

  React.useEffect(() => {
    const rotateLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(rotate, {
          toValue: 1,
          duration: 950,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(rotate, {
          toValue: 0,
          duration: 950,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    )

    const glowLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(glow, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(glow, {
          toValue: 0,
          duration: 900,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    )

    const intro = Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 550,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 7, tension: 80 }),
    ])

    rotateLoop.start()
    glowLoop.start()
    intro.start()

    const timer = setTimeout(() => {
      rotateLoop.stop()
      glowLoop.stop()
      onDone()
    }, 2000)

    return () => {
      clearTimeout(timer)
      intro.stop()
      rotateLoop.stop()
      glowLoop.stop()
    }
  }, [glow, onDone, opacity, rotate, scale])

  const glowStyle = {
    opacity: glow.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0.65] }),
    transform: [{ scale: glow.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1.06] }) }],
  } as const

  const rotateStyle = {
    transform: [
      { rotate: rotate.interpolate({ inputRange: [0, 1], outputRange: ['-2deg', '2deg'] }) },
      { scale },
    ],
  } as const

  return (
    <View className="flex-1 items-center justify-center bg-brand-red" accessibilityLabel="Cargando Cafrilosa">
      <StatusBar style="light" backgroundColor={BRAND_COLORS.red} />

      <Animated.View
        style={[
          {
            position: 'absolute',
            width: 620,
            height: 620,
            borderRadius: 620,
            backgroundColor: 'rgba(0,0,0,0.18)',
            top: -120,
            left: -180,
          },
          glowStyle,
        ]}
      />
      <Animated.View
        style={[
          {
            position: 'absolute',
            width: 560,
            height: 560,
            borderRadius: 560,
            backgroundColor: 'rgba(244,212,106,0.28)',
            bottom: -140,
            right: -190,
          },
          glowStyle,
        ]}
      />

      <Animated.View style={[{ opacity }, rotateStyle]}>
        <Image source={logo} style={{ width: 300, height: 150 }} resizeMode="contain" />
      </Animated.View>
    </View>
  )
}
