jest.mock('lucide-react-native', () => ({
    Zap: 'MockZap',
    Sword: 'MockSword',
    Map: 'MockMap',
    Home: 'MockHome'
}));

// Mocks pour la 3D (React Three Fiber / Drei)
jest.mock('@react-three/fiber/native', () => ({
    useFrame: jest.fn(),
    extend: jest.fn(),
}));

jest.mock('@react-three/drei/native', () => ({
    useFBX: jest.fn(() => ({ 
        clone: jest.fn(() => ({ 
            traverse: jest.fn(),
            position: { set: jest.fn() },
            rotation: { set: jest.fn() },
            scale: { set: jest.fn() }
        })) 
    })),
    useProgress: jest.fn(() => ({ progress: 100 })),
    shaderMaterial: jest.fn(() => function() { return null; }),
    Environment: () => null,
    OrbitControls: () => null,
    PerspectiveCamera: () => null,
}));

// Mock pour expo-sensors
jest.mock('expo-sensors', () => ({
    DeviceMotion: {
        addListener: jest.fn(() => ({ remove: jest.fn() })),
        removeAllListeners: jest.fn(),
        setUpdateInterval: jest.fn(),
    },
}));

// Mock pour expo-router
jest.mock('expo-router', () => ({
    useLocalSearchParams: () => ({}),
    useRouter: () => ({ push: jest.fn(), back: jest.fn() }),
}));