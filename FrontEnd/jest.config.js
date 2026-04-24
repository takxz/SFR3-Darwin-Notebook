module.exports = {
    preset: "jest-expo",
    // Setup pour les tests (ex: React Testing Library)
    setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],

    transform: {
        "^.+\\.[jt]sx?$": "babel-jest"
    },

    // L'alias pour qu'il comprenne tes imports avec "@/..."
    moduleNameMapper: {
        "\\.(fbx|glb|gltf|wav|mp3|png|jpg|jpeg|svg)$": "<rootDir>/__mocks__/fileMock.js",
        "^@/(.*)$": "<rootDir>/src/$1"
    },
    // Ignorer les modules qui posent problème lors des tests
    transformIgnorePatterns: [
        "node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@react-navigation/.*|react-native-svg|lucide-react-native|expo-linear-gradient)"
    ],

    // Configuration du Coverage
    collectCoverageFrom: [
        "src/**/*.{js,jsx}",
        "!src/**/*.test.{js,jsx}",
        "!src/index.js",
        "!src/**/__tests__/**"
    ],
    coveragePathIgnorePatterns: [
        "/node_modules/",
        "/\.expo/",
        "jest.setup.js"
    ],
    coverageThreshold: {
        global: {
            branches: 0,
            functions: 0,
            lines: 0,
            statements: 0
        }
    }
};