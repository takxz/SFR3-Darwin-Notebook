module.exports = {
    preset: "jest-expo",
    // Setup pour les tests (ex: React Testing Library)
    setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],

    transform: {
        "^.+\\.[jt]sx?$": "babel-jest"
    },

    // L'alias pour qu'il comprenne tes imports avec "@/..."
    moduleNameMapper: {
        "^@/(.*)$": "<rootDir>/src/$1"
    },
    // Ignorer les modules qui posent problème lors des tests
    transformIgnorePatterns: [
        "node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@react-navigation/.*|react-native-svg|lucide-react-native|expo-linear-gradient)"
    ]
};