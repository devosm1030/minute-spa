import { defineConfig } from 'vite'

export default defineConfig({
  root: 'src',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    rollupOptions: {
      input: '/index.html'
    }
  },
  test: {
    root: './',
    globals: true,
    environment: 'jsdom',
    include: ['./test/**/*.test.js'],
    reporters: [
      'verbose',
      ['html', { outputFile: './testResults/index.html' }],
    ],
    coverage: {
      enabled: true,
      provider: 'v8',
      reportsDirectory: './testResults/coverage',
      reporter: ['text', 'html', 'lcov'],
      include: ['src/**/*.js', 'packages/**/*.js'],
      exclude: ['test/**', 'node_modules/**', 'src/config.js'],
      thresholds: { branches: 100, functions: 100, lines: 100, statements: 100 },
      all: true,
      skipFull: false,
      reportOnFailure: true
    }
  }
})
