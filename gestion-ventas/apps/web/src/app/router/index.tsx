import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'

const Home = React.lazy(() => import('../../domains/ventas/Home').catch(() => ({ default: () => <div>Home</div> })))

export default function AppRouter() {
  return (
    <React.Suspense fallback={<div>Loading...</div>}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </React.Suspense>
  )
}
