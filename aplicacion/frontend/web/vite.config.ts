import path from 'node:path'

import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig(async () => {
  const tailwindcss = (await import('@tailwindcss/vite')).default
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        components: path.resolve(__dirname, 'src/components'),
        features: path.resolve(__dirname, 'src/features'),
        utils: path.resolve(__dirname, 'src/utils'),
      },
    },
  }
})
