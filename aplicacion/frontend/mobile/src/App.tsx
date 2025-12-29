import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import * as ExpoSplashScreen from 'expo-splash-screen'
import * as React from 'react'
import { SafeAreaProvider } from 'react-native-safe-area-context'

import '../global.css'

import { RoleSelectorScreen } from './features/auth/screens/RoleSelectorScreen'
import { ForgotPasswordScreen } from './features/auth/screens/ForgotPasswordScreen'
import { LoginScreen } from './features/auth/screens/LoginScreen'
import { SplashScreen } from './features/auth/screens/SplashScreen'
// Placeholder screens
import { PlaceholderScreen } from './features/shared/screens/PlaceholderScreen'
import { ClientNavigator } from './navigation/ClientNavigator'
import { WarehouseNavigator } from './navigation/WarehouseNavigator'
import { SellerNavigator } from './navigation/SellerNavigator'
import { TransportistaNavigator } from './navigation/TransportistaNavigator'
import type { RootStackParamList } from './navigation/types'
import { getToken } from './storage/authStorage'
import { CartProvider } from './hooks/useCart'

ExpoSplashScreen.preventAutoHideAsync().catch(() => { })

const Stack = createNativeStackNavigator<RootStackParamList>()

export default function App() {
  React.useEffect(() => {
    ExpoSplashScreen.hideAsync().catch(() => { })
  }, [])

  return (
    <CartProvider>
      <SafeAreaProvider>
        <NavigationContainer>
          <Stack.Navigator initialRouteName="Splash" screenOptions={{ headerShown: false }}>
            <Stack.Screen
              name="Splash"
              children={({ navigation }) => (
                <SplashScreen
                  onDone={async () => {
                    const token = await getToken()
                    navigation.replace(token ? 'RoleSelector' : 'Login')
                  }}
                />
              )}
            />

            <Stack.Screen
              name="Login"
              children={({ navigation }) => (
                <LoginScreen
                  onSignedIn={() => navigation.replace('RoleSelector')}
                  onForgotPassword={() => navigation.navigate('ForgotPassword')}
                />
              )}
            />

            <Stack.Screen
              name="ForgotPassword"
              children={({ navigation }) => <ForgotPasswordScreen onBack={() => navigation.goBack()} />}
            />

            <Stack.Screen name="RoleSelector" component={RoleSelectorScreen} />

            <Stack.Screen name="Cliente" component={ClientNavigator} />
            <Stack.Screen name="Supervisor" component={PlaceholderScreen} />
            <Stack.Screen name="Vendedor" component={SellerNavigator} />
            <Stack.Screen name="Transportista" component={TransportistaNavigator} />
            <Stack.Screen name="Bodeguero" component={WarehouseNavigator} />
          </Stack.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>
    </CartProvider>
  )
}
