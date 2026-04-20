import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect, useState } from 'react';
import { getToken } from '@/utils/auth';
import { LogBox } from 'react-native';

// Suppress EXGL pixelStorei warnings from Expo-GL which spam the console
LogBox.ignoreLogs([
    "EXGL: gl.pixelStorei() doesn't support this parameter yet!",
]);

const _originalConsoleLog = console.log;
console.log = (...args) => {
    if (typeof args[0] === 'string' && args[0].includes('gl.pixelStorei() doesn\'t support this parameter yet!')) {
        return;
    }
    _originalConsoleLog(...args);
};

export default function RootLayout() {
    const router = useRouter();
    const segments = useSegments();
    const [ready, setReady] = useState(false);

    useEffect(() => {
        const checkAuth = async () => {
            const token = await getToken();
            const isAuthRoute = segments?.[0] === 'login' || segments?.[0] === 'register';

            if (!token && !isAuthRoute) {
                router.replace('/login');
            }

            if (token && isAuthRoute) {
                router.replace('/');
            }

            setReady(true);
        };

        checkAuth();
    }, [router, segments]);

    if (!ready) return null;

    return <Stack screenOptions={{ headerShown: false }} />;
}
