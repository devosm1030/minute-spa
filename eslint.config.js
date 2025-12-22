import neostandard from 'neostandard'

export default neostandard({
  env: ['browser', 'vitest'],
  ignores: ['node_modules/', 'dist', 'testResults/'],
})
