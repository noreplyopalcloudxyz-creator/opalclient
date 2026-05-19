import { defineConfig } from 'vitest/config'
import { join } from 'path'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    alias: [
      {
        find: /^~\/(.*)$/,
        replacement: join(__dirname, '$1'),
      },
    ],
  },
})
