import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  server: {
    host: 'localhost',
    port: 5173,
    strictPort: true,
  },
  plugins: [vue(), vueDevTools(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    // Source maps desabilitados no build de produção (padrão do Vite, tornado
    // explícito para documentar a decisão): mapas públicos expõem o código
    // completo e facilitam engenharia reversa. Habilite apenas se houver
    // ferramenta de monitoramento de erros que justifique.
    sourcemap: false,
  },
})
