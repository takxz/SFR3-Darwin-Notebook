const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add 3D model extensions to Metro's asset resolution
config.resolver.assetExts.push('fbx', 'gltf', 'glb', 'obj', 'mtl', 'png', 'jpg');
config.resolver.sourceExts.push('js', 'jsx', 'json', 'ts', 'tsx');

module.exports = config;
