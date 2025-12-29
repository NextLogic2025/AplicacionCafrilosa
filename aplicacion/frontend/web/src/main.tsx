import { createRoot } from 'react-dom/client'

import './styles/index.css'
import './utils/extensionErrorHandler' // Suppress Chrome extension errors
import { App } from './App'

const root = document.getElementById('root')
if (!root) throw new Error('No se encontró #root')
createRoot(root).render(<App />)
