import { createRoot } from 'react-dom/client'
import { loadGoogleMaps } from './utils/googleMapsLoader'

import './styles/index.css'
import { App } from './App'

// Preload Google Maps to avoid "loading=async" warning
loadGoogleMaps()

const root = document.getElementById('root')
if (!root) throw new Error('No se encontró #root')
createRoot(root).render(<App />)
