import { useState, useEffect, useRef } from 'react';
import * as SecureStore from 'expo-secure-store';

export function useSpotlight(key, userId) {
    const [visible, setVisible] = useState(false);
    const [targetLayout, setTargetLayout] = useState(null);
    const ref = useRef(null);
    const storeKey = userId ? `spotlight_${key}_${userId}` : null;

    useEffect(() => {
        if (!storeKey) return;
        SecureStore.getItemAsync(storeKey).then(seen => {
            if (!seen) setVisible(true);
        });
    }, [storeKey]);

    const onLayout = () => {
        if (ref.current) {
            ref.current.measureInWindow((x, y, width, height) => {
                setTargetLayout({ x, y, width, height });
            });
        }
    };

    const dismiss = async () => {
        if (storeKey) await SecureStore.setItemAsync(storeKey, 'true');
        setVisible(false);
    };

    return { visible, targetLayout, ref, onLayout, dismiss };
}
