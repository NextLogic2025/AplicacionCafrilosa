import * as React from 'react'
import * as SplashScreen from 'expo-splash-screen'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import * as SecureStore from 'expo-secure-store'
import { SplashScreen as AnimatedSplash } from './src/screens/SplashScreen'
import { LoginScreen } from './src/screens/LoginScreen'
import { Pressable, Text, View } from 'react-native'
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context'

SplashScreen.preventAutoHideAsync().catch(() => {})

type RootStackParamList = {
  Splash: undefined
  Login: undefined
  Home: undefined
}

const Stack = createNativeStackNavigator<RootStackParamList>()

function HomeScreen({ onSignOut }: { onSignOut: () => void }) {
  return (
    <SafeAreaView className="flex-1 items-center justify-center gap-3 bg-white px-6">
      <Text className="text-2xl font-extrabold text-neutral-950">Inicio</Text>
      <Text className="text-sm text-neutral-600">Pantalla de ejemplo</Text>
      <Pressable onPress={onSignOut} className="mt-2 rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3">
        <Text className="font-bold text-neutral-900">Cerrar sesión</Text>
      </Pressable>
    </SafeAreaView>
  )
}

export default function App() {
  React.useEffect(() => {
    SplashScreen.hideAsync().catch(() => {})
  }, [])

  // Nota: el warning de `SafeAreaView` lo genera una dependencia en dev.
  // Se silencia en `apps/mobile/index.js` para que aplique lo antes posible.

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Splash" screenOptions={{ headerShown: false }}>
          <Stack.Screen
            name="Splash"
            children={({ navigation }) => (
              <AnimatedSplash
                onDone={() => {
                  navigation.replace('Login')
                }}
              />
            )}
          />
          <Stack.Screen
            name="Login"
            children={({ navigation }) => <LoginScreen onSignedIn={() => navigation.replace('Home')} />}
          />
          <Stack.Screen
            name="Home"
            children={({ navigation }) => (
              <HomeScreen
                onSignOut={async () => {
                  await SecureStore.deleteItemAsync('cafrilosa.token')
                  navigation.replace('Login')
                }}
              />
            )}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  )
}
