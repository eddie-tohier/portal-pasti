import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// The INT-Hub API sends no CORS headers, so the browser talks to /int/* on
// this origin and Vite forwards it to the backend.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const target = env.API_PROXY_TARGET || 'http://34.160.82.207'
  return {
    plugins: [react()],
    server: { proxy: { '/int': { target, changeOrigin: true } } },
    preview: { proxy: { '/int': { target, changeOrigin: true } } },
  }
})
