import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// The INT-Hub API sends no CORS headers, so the browser talks to /int/* on
// this origin and Vite forwards it to the backend.
export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const target = env.API_PROXY_TARGET
  // Only the dev/preview servers proxy; a production build doesn't need it.
  if (!target && command === 'serve') throw new Error('API_PROXY_TARGET belum diisi. Salin .env.example ke .env dan isi alamat backend.')
  return {
    plugins: [react()],
    server: { proxy: { '/int': { target, changeOrigin: true } } },
    preview: { proxy: { '/int': { target, changeOrigin: true } } },
  }
})
