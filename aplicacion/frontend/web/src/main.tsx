import { createRoot } from 'react-dom/client'

// Styles
import './styles/index.css'
import { App } from './App'


const root = document.getElementById('root')
if (!root) throw new Error('No se encontró #root')
createRoot(root).render(<App />)
