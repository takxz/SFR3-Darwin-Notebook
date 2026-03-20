import { useEffect, useRef, useState } from 'react';
import { View, Text, Image, StyleSheet, Pressable, ScrollView } from 'react-native';
import Constants from 'expo-constants';
import WaitingComponent from './WaitingComponent';
import CardInformationStatAnimal from './CardInformationStatAnimal';
import { ChevronsUp, Heart, Shield, Sword } from 'lucide-react-native';
import fr from '../assets/locales/fr.json';

const expoHost = Constants.expoConfig?.hostUri?.split(':')[0];
const API_URL = process.env.EXPO_PUBLIC_API_URL || (expoHost ? `http://${expoHost}:5002` : 'http://localhost:5002');

export default function InformationOrganisme({ photo, onClose, addToDex }) {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const scrollRef = useRef(null);

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
      <ScrollView
        ref={scrollRef}
        style={styles.scrollView}
        showsVerticalScrollIndicator={true}
        persistentScrollbar={true}
        indicatorStyle="black"
        scrollIndicatorInsets={{ right: -5 }}
        onContentSizeChange={() => scrollRef.current?.flashScrollIndicators()}
        contentContainerStyle={styles.contentContainer}
      >
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
                <CardInformationStatAnimal title="PV" color="#D95C5C" stat={result.final_stats?.hp} max={100} icon={<Heart size={16} color="#D95C5C" strokeWidth={2.2} />} />
              </View>
              <View style={styles.statItem}>
                <CardInformationStatAnimal title="ATT" color="#e3902b" stat={result.final_stats?.atk} max={100} icon={<Sword size={16} color="#e3902b" strokeWidth={2.2} />} />
              </View>
              <View style={styles.statItem}>
                <CardInformationStatAnimal title="DEF" color="#71a84f" stat={result.final_stats?.defense} max={100} icon={<Shield size={16} color="#71a84f" strokeWidth={2.2} />} />
              </View>
              <View style={styles.statItem}>
                <CardInformationStatAnimal title="VIT" color="#44aad2" stat={result.final_stats?.speed} max={100} icon={<ChevronsUp size={16} color="#44aad2" strokeWidth={2.2} />} />
              </View>
              <View style={styles.gap} />
            </View>
          </>
        ) : null}
      </ScrollView>
      {!loading && !error ?
        <View style={styles.bottomButtonContainer}>
          <Pressable onPress={onClose} style={styles.bottomButtonReject}>
            <Text style={styles.buttonTextDismiss}>{fr.informationAnimalScreen.reject_button}</Text>
          </Pressable>
          <Pressable onPress={() => addToDex?.(result)} style={styles.bottomButtonAccept}>
            <Text style={styles.buttonTextAccept}>{fr.informationAnimalScreen.accept_button}</Text>
          </Pressable>
        </View>
        : null}
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
  scrollView: {
    marginRight: -4,
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
  battleStatsTitle: {
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
  buttonTextAccept: {
    color: '#fff',
    fontWeight: '600',
  },
  buttonTextDismiss: {
    color: '#97572B',
    fontWeight: '600',
  },
  hrLine: {
    borderBottomColor: '#97572B',
    borderBottomWidth: 1,
    marginVertical: 8,
  },
  statsCard: {
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
  bottomButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  bottomButtonReject: {
    flex: 1,
    backgroundColor: '#f8dcb7',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  bottomButtonAccept: {
    flex: 1,
    backgroundColor: '#97572B',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 4,
  },
});