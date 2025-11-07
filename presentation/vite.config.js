import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/',
  server: {
    port: 9000,
    host: '0.0.0.0',
    strictPort: true,
    // Allow Cloudflare / reverse-proxy hostnames (enable access via doc.tritton.dev.br)
    allowedHosts: ['.tritton.dev.br', 'doc.tritton.dev.br', 'localhost'],
    hmr: {
      // Let the client connect over WSS through the proxy; server binds to localhost
      protocol: 'wss',
      clientPort: 443
    }
  }
})
