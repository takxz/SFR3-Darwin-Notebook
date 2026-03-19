import { useEffect, useState } from 'react';
import { View, Text, Image, StyleSheet, Pressable, ScrollView } from 'react-native';
import Constants from 'expo-constants';
import WaitingComponent from './WaitingComponent';
import CardInformationStatAnimal from './CardInformationStatAnimal';
import { ChevronsUp, Heart, Shield, Sword } from 'lucide-react-native';

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
        console.log(`[Classification] Tentative d'appel API sur : ${API_URL}/classification`);
        
        if (!photo.base64) {
          console.error('[Classification] Erreur: Image Base64 manquante');
          throw new Error('Image invalide');
        }

        const response = await fetch(`${API_URL}/classification`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageData: `data:image/jpeg;base64,${photo.base64}` }),
        });

        console.log(`[Classification] Statut réponse: ${response.status}`);

        const timer = new Promise((res) => setTimeout(res, 3000));
        const dataPromise = response.json();
        const [data] = await Promise.all([dataPromise, timer]);

        if (!response.ok || !data?.success) {
          console.error('[Classification] Erreur API:', data);
          throw new Error(data?.error || 'Erreur API');
        }

        console.log('[Classification] Succès:', data.common_name);
        setResult(data);
      } catch (e) {
        const message = e?.message || 'Erreur inconnue';
        console.error('[Classification] Catch Error:', message);
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
      <Pressable onPress={onClose} style={styles.button}>
        <Text style={styles.buttonText}>X</Text>
      </Pressable>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.contentContainer}>
        {loading ? <WaitingComponent /> : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {result ? (
          <>
            {result.image_url ? <Image source={{ uri: result.image_url }} style={styles.image} /> : null}
            <Text style={styles.title}>{result.common_name || 'Nom inconnu'}</Text>
            <Text style={styles.subtitle}>{result.scientific_name || ''}</Text>
            <View style={styles.hrLine} />
            <Text style={styles.battleStatsTitle}>Battle Stats</Text>
            <View style={styles.gap} />
            <View style={styles.mainContainer}>
              {/*Ici, il faudra placer les stats de l'API */}
              <View style={styles.statItem}>
                <CardInformationStatAnimal title="PV" color="#D95C5C" stat={"15"} max={100} icon={<Heart size={16} color="#D95C5C" strokeWidth={2.2}/>}/>
              </View>
              <View style={styles.statItem}>
                <CardInformationStatAnimal title="ATT" color="#e3902b" stat={"200"} max={100} icon={<Sword size={16} color="#e3902b" strokeWidth={2.2} />}/>
              </View>
              <View style={styles.statItem}>
                <CardInformationStatAnimal title="DEF" color="#71a84f" stat={"80"} max={100} icon={<Shield size={16} color="#71a84f" strokeWidth={2.2} />}/>
              </View>
              <View style={styles.statItem}>
                <CardInformationStatAnimal title="VIT" color="#44aad2" stat={"40"} max={100} icon={<ChevronsUp size={16} color="#44aad2" strokeWidth={2.2} />}/>
              </View>
            </View>
          </>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    position: 'absolute',
    left: 10,
    right: 10,
    bottom: 160,
    backgroundColor: '#FAEBD7',
    borderRadius: 12,
    padding: 12,
    gap: 8,
    maxHeight: '70%',
  },
  contentContainer: {
    paddingBottom: 12,
  },
  title: {
    color: '#000',
    fontWeight: '700',
    fontSize: 18,
  },
  subtitle: {
    color: '#97572B',
    fontSize: 14,
  },
  battleStatsTitle:{
    color: '#97572B',
    fontSize: 18,
  },
  error: {
    color: '#ffb3b3',
    fontSize: 14,
  },
  image: {
    width: '100%',
    height: 200,
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
    color: '#000',
    fontWeight: '600',
  },
  hrLine : {
    borderBottomColor: '#97572B',
    borderBottomWidth: 1,
    marginVertical: 8,
  },
  statsCard : {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 8,
    marginBottom: 4,
  },
  mainContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 10,
  },
  statItem: {
    width: '48%',
  },
  gap: {
    height: 8,
  },
});