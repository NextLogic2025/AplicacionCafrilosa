import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import * as ExpoSplashScreen from 'expo-splash-screen'
import * as React from 'react'
import { SafeAreaProvider } from 'react-native-safe-area-context'

import { RoleSelectorScreen } from './features/app/screens/RoleSelectorScreen'
import { ForgotPasswordScreen } from './features/auth/screens/ForgotPasswordScreen'
import { LoginScreen } from './features/auth/screens/LoginScreen'
import { SplashScreen } from './features/auth/screens/SplashScreen'
import { BodegueroScreen } from './features/bodeguero/screens/BodegueroScreen'
import { ClienteScreen } from './features/cliente/screens/ClienteScreen'
import { SupervisorScreen } from './features/supervisor/screens/SupervisorScreen'
import { TransportistaScreen } from './features/transportista/screens/TransportistaScreen'
import { VendedorScreen } from './features/vendedor/screens/VendedorScreen'
import type { RootStackParamList } from './navigation/types'
import { getToken } from './storage/authStorage'

ExpoSplashScreen.preventAutoHideAsync().catch(() => {})

const Stack = createNativeStackNavigator<RootStackParamList>()

export default function App() {
  React.useEffect(() => {
    ExpoSplashScreen.hideAsync().catch(() => {})
  }, [])

  return (
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
            children={({ navigation }) => <ForgotPasswordScreen onDone={() => navigation.goBack()} />}
          />

          <Stack.Screen name="RoleSelector" component={RoleSelectorScreen} />

          <Stack.Screen name="Cliente" component={ClienteScreen} />
          <Stack.Screen name="Supervisor" component={SupervisorScreen} />
          <Stack.Screen name="Vendedor" component={VendedorScreen} />
          <Stack.Screen name="Transportista" component={TransportistaScreen} />
          <Stack.Screen name="Bodeguero" component={BodegueroScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  )
}
