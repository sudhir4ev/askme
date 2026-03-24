import { defineConfig } from 'vitest/config'

export default defineConfig({
   test: {
      // ...
      projects: ['services/*/vite.config.ts'],
      // testTimeout: 10000
   },
})
