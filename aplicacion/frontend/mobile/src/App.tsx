import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import * as ExpoSplashScreen from 'expo-splash-screen'
import * as React from 'react'
import { jwtDecode } from 'jwt-decode'
import { SafeAreaProvider } from 'react-native-safe-area-context'

import '../global.css'

import { ForgotPasswordScreen } from './features/auth/screens/ForgotPasswordScreen'
import { LoginScreen } from './features/auth/screens/LoginScreen'
import { SplashScreen } from './features/auth/screens/SplashScreen'
// Navigators
import { ClientNavigator } from './navigation/ClientNavigator'
import { WarehouseNavigator } from './navigation/WarehouseNavigator'
import { SellerNavigator } from './navigation/SellerNavigator'
import { TransportistaNavigator } from './navigation/TransportistaNavigator'
import { SupervisorNavigator } from './navigation/SupervisorNavigator'
import type { RootStackParamList } from './navigation/types'
import { getToken } from './storage/authStorage'
import { CartProvider } from './hooks/useCart'

ExpoSplashScreen.preventAutoHideAsync().catch(() => { })

const Stack = createNativeStackNavigator<RootStackParamList>()

// Helper para navegar según el rol
const getRoleAndNavigate = (role?: string | null, navigation?: any) => {
  if (!role) {
    // Si no hay rol (ej. error en token), volver a login o manejar error
    navigation.replace('Login')
    return
  }

  const roleLower = role.toLowerCase()
  let targetRoute = 'Login'

  switch (roleLower) {
    case 'cliente':
      targetRoute = 'Cliente'
      break
    case 'supervisor':
    case 'admin': // Admin usa interfaz de supervisor por ahora
      targetRoute = 'Supervisor'
      break
    case 'vendedor':
      targetRoute = 'Vendedor'
      break
    case 'transportista':
      targetRoute = 'Transportista'
      break
    case 'bodeguero':
      targetRoute = 'Bodeguero'
      break
    default:
      console.warn('Rol desconocido:', role)
      targetRoute = 'Login' // O una pantalla de "No autorizado"
  }

  navigation.replace(targetRoute)
}

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
                    if (token) {
                      // Decodificar token para obtener rol
                      try {
                        const { jwtDecode } = require('jwt-decode'); // Import dynamic or move top-level if possible
                        const decoded: any = jwtDecode(token);
                        getRoleAndNavigate(decoded.role || decoded.rol, navigation);
                      } catch (e) {
                        console.error('Error decoding token on splash:', e);
                        navigation.replace('Login');
                      }
                    } else {
                      navigation.replace('Login')
                    }
                  }}
                />
              )}
            />

            <Stack.Screen
              name="Login"
              children={({ navigation }) => (
                <LoginScreen
                  onSignedIn={(role) => getRoleAndNavigate(role, navigation)}
                  onForgotPassword={() => navigation.navigate('ForgotPassword')}
                />
              )}
            />

            <Stack.Screen
              name="ForgotPassword"
              children={({ navigation }) => <ForgotPasswordScreen onBack={() => navigation.goBack()} />}
            />

            <Stack.Screen
              name="Cliente"
              component={ClientNavigator}
            />
            <Stack.Screen
              name="Supervisor"
              component={SupervisorNavigator}
            />
            <Stack.Screen
              name="Vendedor"
              component={SellerNavigator}
            />
            <Stack.Screen
              name="Transportista"
              component={TransportistaNavigator}
            />
            <Stack.Screen
              name="Bodeguero"
              component={WarehouseNavigator}
            />
          </Stack.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>
    </CartProvider>
  )
}
