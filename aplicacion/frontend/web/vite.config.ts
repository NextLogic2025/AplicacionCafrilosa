import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig(async () => {
  const tailwindcss = (await import('@tailwindcss/vite')).default
  return {
    plugins: [react(), tailwindcss()],
  }
})
