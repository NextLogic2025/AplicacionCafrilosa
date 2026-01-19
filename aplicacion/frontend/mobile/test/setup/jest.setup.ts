import '@testing-library/jest-native/extend-expect'
import 'react-native-gesture-handler/jestSetup'

jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'))

jest.mock('expo-linear-gradient', () => {
  const React = require('react')
  const { View } = require('react-native')
  const LinearGradient = ({ children }: { children?: any }) => React.createElement(View, null, children)
  return { LinearGradient }
})

jest.mock('react-native-safe-area-context', () => require('react-native-safe-area-context/jest/mock').default)

jest.mock('expo-secure-store', () => {
  const store: Record<string, string> = {}
  return {
    getItemAsync: jest.fn(async (key: string) => store[key] ?? null),
    setItemAsync: jest.fn(async (key: string, value: string) => {
      store[key] = String(value)
    }),
    deleteItemAsync: jest.fn(async (key: string) => {
      delete store[key]
    }),
  }
})

jest.mock('@expo/vector-icons', () => {
  const React = require('react')
  const { Text } = require('react-native')
  const Ionicons = ({ name }: { name: string }) => React.createElement(Text, null, name)
  return { Ionicons }
})

jest.mock('react-native-maps', () => {
  const React = require('react')
  const { View } = require('react-native')
  const Mock = ({ children }: { children?: any }) => React.createElement(View, null, children)
  return {
    __esModule: true,
    default: Mock,
    Marker: Mock,
    Polygon: Mock,
    PROVIDER_GOOGLE: 'google',
  }
})
