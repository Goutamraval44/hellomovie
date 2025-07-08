const { getDefaultConfig } = require('expo/metro-config');
const { mergeConfig } = require('@react-native/metro-config');
const path = require('path');

const defaultConfig = getDefaultConfig(__dirname);

const extraNodeModulesToTranspile = [
  'query-string',
  'strict-uri-encode',
  'decode-uri-component',
];

defaultConfig.resolver = {
  ...defaultConfig.resolver,
  unstable_enableSymlinks: true,
  resolverMainFields: ['browser', 'main'],
};

defaultConfig.transformer = {
  ...defaultConfig.transformer,
  babelTransformerPath: require.resolve('metro-react-native-babel-transformer'),
};

defaultConfig.watchFolders = [
  ...defaultConfig.watchFolders,
  ...extraNodeModulesToTranspile.map(pkg =>
    path.resolve(__dirname, 'node_modules', pkg)
  ),
];

module.exports = mergeConfig(defaultConfig, {});
