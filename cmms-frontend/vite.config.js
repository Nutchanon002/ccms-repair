import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: '/repairjob/', 

  server: {
    proxy: {
      '/sso-api': {
        target: process.env.VITE_SSO_API_TARGET || 'https://service-pro.example.com/api',
        changeOrigin: true,
        secure: false, // ปิดการเช็ค SSL เพราะเป็น IP
        rewrite: (path) => path.replace(/^\/sso-api/, '')
      }
    }
  }
})