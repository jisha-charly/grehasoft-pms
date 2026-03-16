import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests',

  reporter: [
    ['html'],
    ['list']
  ],

  use: {
    baseURL: 'http://localhost:3000'
  }
})