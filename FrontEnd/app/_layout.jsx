import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect, useState } from 'react';
import { LogBox } from 'react-native';
import { getToken } from '@/utils/auth';

LogBox.ignoreAllLogs(true);
if (typeof global !== 'undefined' && global.console) {
    global.console.warn = () => {};
    global.console.error = () => {};
}

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
