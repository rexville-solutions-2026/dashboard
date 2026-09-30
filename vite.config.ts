import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  // GitHub Pages serves this as a project site at /dashboard/, so assets
  // need that base path in production. Local dev keeps the default '/'.
  base: process.env.GITHUB_PAGES ? '/dashboard/' : '/',
  plugins: [react(), tailwindcss()],
  server: {
    host: true,
  },
})
