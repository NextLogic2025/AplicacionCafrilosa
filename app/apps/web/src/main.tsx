import * as React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './styles/app.css'
import AppRouter from './app/router'

function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AppRouter />
    </BrowserRouter>
  )
}

const root = document.getElementById('root')
if (!root) throw new Error('No se encontró #root')
createRoot(root).render(<App />)
