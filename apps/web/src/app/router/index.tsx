import * as React from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { LoginPage } from '../../domains/auth/LoginPage'
import { SplashPage } from '../../domains/auth/SplashPage'

const Home = React.lazy(() => import('../../domains/ventas/Home'))

export default function AppRouter() {
  return (
    <React.Suspense fallback={<SplashPage />}>
      <Routes>
        <Route path="/" element={<SplashPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/app" element={<Home />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </React.Suspense>
  )
}
