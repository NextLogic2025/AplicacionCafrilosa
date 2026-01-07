import { BrowserRouter } from 'react-router-dom'

import { AuthProvider } from './context/auth/AuthContext'
import AppRouter from './routes/AppRouter'

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AppRouter />
      </BrowserRouter>
    </AuthProvider>
  )
}
