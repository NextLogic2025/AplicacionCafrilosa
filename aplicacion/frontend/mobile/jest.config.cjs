module.exports = {
  preset: 'jest-expo',
  testMatch: ['**/test/**/*.spec.[tj]s?(x)'],
  setupFilesAfterEnv: ['<rootDir>/test/setup/jest.setup.ts'],
}

