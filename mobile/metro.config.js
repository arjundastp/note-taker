// Routes bundling through Expo's metro (@expo/metro) rather than the standalone
// metro, which SDK 58 needs for the transformer to initialize.
const { getDefaultConfig } = require("expo/metro-config");

module.exports = getDefaultConfig(__dirname);
