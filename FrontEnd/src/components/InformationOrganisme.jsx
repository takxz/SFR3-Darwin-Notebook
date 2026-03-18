import { useEffect, useState } from 'react';
import { View, Text, Image, StyleSheet, Pressable } from 'react-native';
import Constants from 'expo-constants';
import WaitingComponent from './WaitingComponent';

const expoHost = Constants.expoConfig?.hostUri?.split(':')[0];
const API_URL = process.env.EXPO_PUBLIC_API_URL || (expoHost ? `http://${expoHost}:5001` : 'http://localhost:5001');

export default function InformationOrganisme({ photo, onClose }) {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!photo?.uri) return;

    const classify = async () => {
      setLoading(true);
      setError('');
      setResult(null);

      try {
        if (!photo.base64) {
          throw new Error('Image invalide');
        }

        const response = await fetch(`${API_URL}/classification`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageData: `data:image/jpeg;base64,${photo.base64}` }),
        });

        const timer = new Promise((res) => setTimeout(res, 3000));
        const dataPromise = response.json();
        const [data] = await Promise.all([dataPromise, timer]);

        if (!response.ok || !data?.success) {
          throw new Error(data?.error || 'Erreur API');
        }

        setResult(data);
      } catch (e) {
        const message = e?.message || 'Erreur inconnue';
        if (message.toLowerCase().includes('network request failed')) {
          setError(`Connexion API impossible: ${API_URL}/classification`);
        } else {
          setError(message);
        }
      } finally {
        setLoading(false);
      }
    };

    classify();
  }, [photo]);

  if (!photo) return null;

  return (
    <View style={styles.card}>
      {loading ? <WaitingComponent /> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {result ? (
        <>
          <Text style={styles.title}>{result.common_name || 'Nom inconnu'}</Text>
          <Text style={styles.subtitle}>{result.scientific_name || ''}</Text>
          {result.image_url ? <Image source={{ uri: result.image_url }} style={styles.image} /> : null}
        </>
      ) : null}

      <Pressable onPress={onClose} style={styles.button}>
        <Text style={styles.buttonText}>X</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 160,
    backgroundColor: 'rgba(0,0,0,0.75)',
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  title: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 18,
  },
  subtitle: {
    color: '#ddd',
    fontSize: 14,
  },
  error: {
    color: '#ffb3b3',
    fontSize: 14,
  },
  image: {
    width: '100%',
    height: 150,
    borderRadius: 8,
  },
  button: {
    alignSelf: 'flex-end',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
});