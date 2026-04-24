const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Add 3D model extensions to Metro's asset resolution
config.resolver.assetExts.push('fbx', 'gltf', 'glb', 'obj', 'mtl', 'png', 'jpg');
config.resolver.sourceExts.push('js', 'jsx', 'json', 'ts', 'tsx');

// Exclude test files from being bundled
config.resolver.blockList = [
  /.*\/__tests__\/.*/,
  /.*\.test\..*/,
];

module.exports = config;

