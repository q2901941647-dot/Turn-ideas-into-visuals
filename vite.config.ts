import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  // Relative base so the app also works from a GitHub Pages project subpath
  // (e.g. https://<user>.github.io/<repo>/).
  base: './',
  plugins: [react()],
})
