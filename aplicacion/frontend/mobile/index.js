import 'react-native-gesture-handler'
import { registerRootComponent } from 'expo'
import { LogBox } from 'react-native'
import './global.css'

import App from './App'

LogBox.ignoreLogs(['SafeAreaView has been deprecated'])

registerRootComponent(App)
