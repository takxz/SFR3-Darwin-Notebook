module.exports = function (api) {
    api.cache(true);
    return {
        presets: ['babel-preset-expo'],
        plugins: [
            [
                'module-resolver',
                {
                    root: ['./'],
                    alias: {
                        '@': './src',
                    },
                },
            ],
            'expo-router/babel',
            '@babel/plugin-transform-optional-chaining',
            'react-native-reanimated/plugin',
        ],
    };
};