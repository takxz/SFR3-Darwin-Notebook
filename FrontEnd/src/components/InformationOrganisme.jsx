import { useEffect, useRef, useState } from 'react';
import { View, Text, Image, StyleSheet, Pressable, ScrollView } from 'react-native';
import Constants from 'expo-constants';
import WaitingComponent from './WaitingComponent';
import CardInformationStatAnimal from './CardInformationStatAnimal';
import { ChevronsUp, Heart, Shield, Sword } from 'lucide-react-native';
import fr from '../assets/locales/fr.json';

const expoHost = Constants.expoConfig?.hostUri?.split(':')[0];
const API_URL = process.env.EXPO_PUBLIC_API_URL || (expoHost ? `http://${expoHost}:5002` : 'http://localhost:5002');

const POLL_INTERVAL_MS = 800;
const POLL_TIMEOUT_MS = 90_000;

async function parseResponseBody(response) {
  const raw = await response.text();

  try {
    return {
      parsed: raw ? JSON.parse(raw) : null,
      raw,
    };
  } catch {
    return {
      parsed: null,
      raw,
    };
  }
}

export default function InformationOrganisme({ photo, onClose, addToDex, onFinish }) {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState('submitting'); // submitting | queued | processing | done | error
  const [queueInfo, setQueueInfo] = useState(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    let pollTimer = null;
    const startedAt = Date.now();

    const finish = (cb) => {
      if (cancelled) return;
      setLoading(false);
      onFinish?.();
      cb?.();
    };

    const handleResult = (resultPayload) => {
      // Le worker peut renvoyer des cas "métier" non-success (organisme inconnu,
      // modèle indisponible). On les traite comme des messages d'erreur côté UI
      // sans considérer la requête comme un échec technique.
      if (!resultPayload || resultPayload.success === false) {
        const message =
          resultPayload?.message ||
          resultPayload?.error ||
          'Erreur API';
        setError(message);
        setStatus('error');
        finish();
        return;
      }
      setResult(resultPayload);
      setStatus('done');
      finish();
    };

    const poll = async (jobId) => {
      if (cancelled) return;
      if (Date.now() - startedAt > POLL_TIMEOUT_MS) {
        setError('Délai dépassé. Réessayez dans un instant.');
        setStatus('error');
        finish();
        return;
      }
      try {
        const r = await fetch(`${API_URL}/classification/status/${jobId}`);
        const { parsed: data } = await parseResponseBody(r);
        if (cancelled) return;

        if (r.status === 404) {
          throw new Error('Session de reconnaissance expirée.');
        }
        if (!data) {
          throw new Error(`Statut invalide (${r.status})`);
        }

        if (data.queue) setQueueInfo(data.queue);

        if (data.status === 'done') {
          handleResult(data.result);
          return;
        }
        if (data.status === 'error') {
          setError(data.error || 'Erreur de traitement');
          setStatus('error');
          finish();
          return;
        }

        // queued | processing
        setStatus(data.status);
        pollTimer = setTimeout(() => poll(jobId), POLL_INTERVAL_MS);
      } catch (e) {
        if (cancelled) return;
        const message = e?.message || 'Erreur inconnue';
        if (message.toLowerCase().includes('network request failed')) {
          setError(`Connexion API impossible: ${API_URL}/classification`);
        } else {
          setError(message);
        }
        setStatus('error');
        finish();
      }
    };

    const submit = async () => {
      if (!photo?.uri) return;
      setLoading(true);
      setError(null);
      setResult(null);
      setStatus('submitting');
      setQueueInfo(null);

      try {
        if (!photo.base64) {
          throw new Error('Image invalide');
        }

        const response = await fetch(`${API_URL}/classification`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageData: `data:image/jpeg;base64,${photo.base64}` }),
        });

        const { parsed: data, raw } = await parseResponseBody(response);
        if (cancelled) return;

        if (!data) {
          console.error('[Classification] Réponse non-JSON reçue:', raw?.substring(0, 200));
          throw new Error(`Erreur serveur (${response.status}): Réponse invalide reçue.`);
        }
        if (!response.ok || !data?.success || !data.job_id) {
          throw new Error(data?.error || data?.message || 'Erreur API');
        }

        if (data.queue) setQueueInfo(data.queue);
        setStatus(data.status || 'queued');
        poll(data.job_id);
      } catch (e) {
        if (cancelled) return;
        const message = e?.message || 'Erreur inconnue';
        if (message.toLowerCase().includes('network request failed')) {
          setError(`Connexion API impossible: ${API_URL}/classification`);
        } else {
          setError(message);
        }
        setStatus('error');
        finish();
      }
    };

    submit();

    return () => {
      cancelled = true;
      if (pollTimer) clearTimeout(pollTimer);
    };
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
        {loading ? <WaitingComponent status={status} queueInfo={queueInfo} /> : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {result ? (
          <>
            <Image source={{ uri: `data:image/jpeg;base64,${photo.base64}` }} style={styles.image} />
            <View style={styles.mainContainerTitle}>
              <Text style={styles.title}>{result.common_name || fr.informationOrganismeScreen.unknown_name}</Text>
              <Text style={styles.subtitle}>{result.scientific_name || ''}</Text>
            </View>
            <View style={styles.sharpnessBadge}>
              <Text style={styles.sharpnessLabel}>{fr.informationOrganismeScreen.sharpness_label}</Text>
              <Text style={styles.sharpnessValue}>{result.sharpness_rank || '-'}</Text>
            </View>
            <Text style={styles.battleStatsTitle}>{fr.informationOrganismeScreen.battle_stats_title}</Text>
            <View style={styles.hrLine} />
            <View style={styles.gap} />
            <View style={styles.mainContainer}>
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
      {!loading && result && !error ?
        <View style={styles.bottomButtonContainer}>
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
  sharpnessBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: '#f8dcb7',
  },
  sharpnessLabel: {
    color: '#97572B',
    fontSize: 12,
    fontWeight: '600',
  },
  sharpnessValue: {
    color: '#97572B',
    fontSize: 12,
    fontWeight: '700',
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
  mainContainerTitle: {
    flexDirection: 'column',
    gap: 2,
    marginVertical: 4,
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
