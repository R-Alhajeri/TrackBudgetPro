const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// Add support for .svg files
config.resolver.assetExts.push("svg");
config.transformer.babelTransformerPath = require.resolve(
  "react-native-svg-transformer"
);

// Performance optimizations
config.transformer.minifierConfig = {
  keep_fnames: true,
  mangle: {
    keep_fnames: true,
  },
};

// Enable tree shaking for better bundle size
config.resolver.platforms = ["ios", "android", "native", "web"];

// Optimize asset handling
config.transformer.assetPlugins = ["expo-asset/tools/hashAssetFiles"];

module.exports = config;
