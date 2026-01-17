import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import * as ExpoSplashScreen from 'expo-splash-screen'
import * as React from 'react'
import { Platform } from 'react-native'
import * as NavigationBar from 'expo-navigation-bar'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { jwtDecode } from 'jwt-decode'
import { SafeAreaProvider } from 'react-native-safe-area-context'

import '../global.css'

import { ForgotPasswordScreen } from './features/auth/screens/ForgotPasswordScreen'
import { LoginScreen } from './features/auth/screens/LoginScreen'
import { SplashScreen } from './features/auth/screens/SplashScreen'
import { ClientNavigator } from './navigation/ClientNavigator'
import { WarehouseNavigator } from './navigation/WarehouseNavigator'
import { SellerNavigator } from './navigation/SellerNavigator'
import { TransportistaNavigator } from './navigation/TransportistaNavigator'
import { SupervisorNavigator } from './navigation/SupervisorNavigator'
import { navigationRef } from './navigation/navigationRef'
import type { RootStackParamList } from './navigation/types'
import { getToken } from './storage/authStorage'
import { CartProvider } from './context/CartContext'
import { ToastProvider } from './context/ToastContext'
import { NotificationProvider } from './context/NotificationContext'

ExpoSplashScreen.preventAutoHideAsync().catch(() => {})

const Stack = createNativeStackNavigator<RootStackParamList>()

type DecodedAccessToken = {
    role?: string
    rol?: string
}

type AuthStartRoute = 'Login' | 'Cliente' | 'Supervisor' | 'Vendedor' | 'Transportista' | 'Bodeguero'

const ROLE_ROUTES: Record<string, AuthStartRoute> = {
    cliente: 'Cliente',
    supervisor: 'Supervisor',
    admin: 'Supervisor',
    vendedor: 'Vendedor',
    transportista: 'Transportista',
    bodeguero: 'Bodeguero'
}

const getRouteForRole = (role?: string | null): AuthStartRoute => {
    if (!role) return 'Login'
    return ROLE_ROUTES[role.toLowerCase()] || 'Login'
}

export default function App() {
    React.useEffect(() => {
        ExpoSplashScreen.hideAsync().catch(() => {})

        if (Platform.OS === 'android') {
            NavigationBar.setBackgroundColorAsync('#f3f4f6').catch(() => {})
            NavigationBar.setButtonStyleAsync('dark').catch(() => {})
        }
    }, [])

    const handleSplashDone = async (navigation: NativeStackNavigationProp<RootStackParamList, 'Splash'>) => {
        const token = await getToken()
        if (token) {
            try {
                const decoded = jwtDecode<DecodedAccessToken>(token)
                navigation.replace(getRouteForRole(decoded.role || decoded.rol))
            } catch (e) {
                console.error('Error decoding token:', e)
                navigation.replace('Login')
            }
        } else {
            navigation.replace('Login')
        }
    }

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <CartProvider>
                <SafeAreaProvider>
                    <NotificationProvider>
                        <ToastProvider>
                            <NavigationContainer ref={navigationRef}>
                                <Stack.Navigator initialRouteName="Splash" screenOptions={{ headerShown: false }}>
                                    <Stack.Screen name="Splash">
                                        {({ navigation }) => (
                                            <SplashScreen onDone={() => handleSplashDone(navigation)} />
                                        )}
                                    </Stack.Screen>

                                    <Stack.Screen name="Login">
                                        {({ navigation }) => (
                                            <LoginScreen
                                                onSignedIn={(role) => navigation.replace(getRouteForRole(role))}
                                                onForgotPassword={() => navigation.navigate('ForgotPassword')}
                                            />
                                        )}
                                    </Stack.Screen>

                                    <Stack.Screen name="ForgotPassword">
                                        {({ navigation }) => (
                                            <ForgotPasswordScreen onBack={() => navigation.goBack()} />
                                        )}
                                    </Stack.Screen>

                                    <Stack.Screen name="Cliente" component={ClientNavigator} />
                                    <Stack.Screen name="Supervisor" component={SupervisorNavigator} />
                                    <Stack.Screen name="Vendedor" component={SellerNavigator} />
                                    <Stack.Screen name="Transportista" component={TransportistaNavigator} />
                                    <Stack.Screen name="Bodeguero" component={WarehouseNavigator} />
                                </Stack.Navigator>
                            </NavigationContainer>
                        </ToastProvider>
                    </NotificationProvider>
                </SafeAreaProvider>
            </CartProvider>
        </GestureHandlerRootView>
    )
}
