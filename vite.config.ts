import { defineConfig } from 'vite'
import { devtools } from '@tanstack/devtools-vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import viteTsConfigPaths from 'vite-tsconfig-paths'
import { fileURLToPath, URL } from 'url'

import tailwindcss from '@tailwindcss/vite'
import { nitro } from 'nitro/vite'

const config = defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      // Alias OpenTelemetry imports to stub file for client builds
      '@/integrations/opentelemetry$': fileURLToPath(
        new URL('./src/integrations/opentelemetry/logger.ts', import.meta.url),
      ),
    },
  },
  ssr: {
    noExternal: ['@theme-toggles/react'],
    external: [
      '@opentelemetry/sdk-node',
      '@opentelemetry/exporter-logs-otlp-http',
      '@opentelemetry/api-logs',
      '@opentelemetry/resources',
      '@opentelemetry/semantic-conventions',
    ],
  },
  plugins: [
    devtools(),
    nitro(),
    // this is the plugin that enables path aliases
    viteTsConfigPaths({
      projects: ['./tsconfig.json'],
    }),
    tailwindcss(),
    tanstackStart(),
    viteReact(),
  ],
})

export default config
