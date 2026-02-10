import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from "path";

export default defineConfig({
  plugins: [react()],
  base: "/ww-atlas-frontend/",
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
      },
    },
  },
});