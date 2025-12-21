import { LogBox } from 'react-native'
import 'react-native-gesture-handler'
import './global.css'
import { registerRootComponent } from 'expo'
import App from './App'

LogBox.ignoreLogs(['SafeAreaView has been deprecated'])

registerRootComponent(App)
