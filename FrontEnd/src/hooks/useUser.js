import { useState, useEffect } from 'react';
import { clearToken, getToken } from '../utils/auth';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://ikdeksmp.fr:12000';

export function useUser() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
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
    };

    fetchUser();
  }, []);

  return { user, loading, error };
}