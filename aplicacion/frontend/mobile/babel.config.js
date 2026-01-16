module.exports = function (api) {
  api.cache(true)
  const isTest = process.env.NODE_ENV === 'test' || process.env.BABEL_ENV === 'test'
  return {
    presets: ['babel-preset-expo', ...(isTest ? [] : ['nativewind/babel'])],
    plugins: ['react-native-reanimated/plugin'],
  }
}
