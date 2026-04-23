import { useState, useEffect } from 'react';
import { getUserIdFromToken } from '@/utils/auth';

export function useUserId() {
    const [userId, setUserId] = useState(null);

    useEffect(() => {
        if (typeof getUserIdFromToken === 'function') {
            getUserIdFromToken().then(setUserId);
        }
    }, []);

    return userId;
}
