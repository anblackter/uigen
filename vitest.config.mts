import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    projects: [
      {
        plugins: [tsconfigPaths(), react()],
        test: {
          name: 'dom',
          environment: 'jsdom',
          include: ['src/components/**/__tests__/**/*.test.{ts,tsx}'],
        },
      },
      {
        plugins: [tsconfigPaths()],
        test: {
          name: 'node',
          environment: 'node',
          include: ['src/lib/__tests__/**/*.test.ts'],
        },
      },
    ],
  },
})