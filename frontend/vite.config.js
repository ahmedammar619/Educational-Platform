import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3001,
    host: '0.0.0.0',
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          calendar: ['@fullcalendar/react', '@fullcalendar/daygrid', '@fullcalendar/interaction', '@fullcalendar/timegrid'],
          stripe: ['@stripe/react-stripe-js', '@stripe/stripe-js'],
          icons: ['lucide-react'],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
})
