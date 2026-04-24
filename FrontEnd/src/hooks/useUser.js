import { useState, useEffect, useCallback } from 'react';
import { clearToken, getToken } from '../utils/auth';
import Constants from 'expo-constants';

const expoHost = Constants.expoConfig?.hostUri?.split(':')[0];
const API_BASE_URL = process.env.EXPO_PUBLIC_USER_API_URL || (expoHost ? `http://${expoHost}:3001` : 'http://localhost:3001');

export function useUser() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchUser = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const token = await getToken();
      if (!token) {
        setError('Connexion requise.');
        setLoading(false);
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/user/profile`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const userData = await response.json();

      if (response.ok) {
        setUser(userData);
        setError(null);
      } else {
        const message = userData.error || userData.message || `Impossible de charger le profil (${response.status})`;
        if (response.status === 401 || response.status === 403) {
          await clearToken();
          setError('Token invalide ou expiré. Veuillez vous reconnecter.');
        } else {
          setError(message);
        }
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  return { user, loading, error, refresh: fetchUser };
}
