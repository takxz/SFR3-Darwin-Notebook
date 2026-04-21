import { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, Pressable } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Constants from 'expo-constants';
import { ArrowLeft, Heart, Leaf, Scale, Shield, Star, Timer, Zap, X } from 'lucide-react-native';
import { getToken } from '../../src/utils/auth';

const expoHost = Constants.expoConfig?.hostUri?.split(':')[0];
const USER_API_URL = process.env.EXPO_PUBLIC_USER_API_URL || (expoHost ? `http://${expoHost}:3001` : 'http://localhost:3001');

async function parseResponseBody(response) {
  const raw = await response.text();
  try {
    return { parsed: raw ? JSON.parse(raw) : null, raw };
  } catch {
    return { parsed: null, raw };
  }
}


function StatCard({ label, value, max = 100, color, Icon }) {
  const percent = Math.min(100, Math.round((value / max) * 100));

  return (
    <View style={styles.statCard}>
      <View style={styles.statHeader}>
        <Text style={styles.statTitle}>{label}</Text>
        <View style={styles.statIconBadge}>
          <Icon size={14} color={color} strokeWidth={2.4} />
        </View>
      </View>
      <Text style={[styles.statNumber, { color }]}>{value}</Text>
      <View style={styles.statTrack}>
        <View style={[styles.statFill, { backgroundColor: color, width: `${percent}%` }]} />
      </View>
    </View>
  );
}

function formatWeight(value) {
  if (value === null || value === undefined || value === '') return 'Inconnu';
  const asNumber = Number(value);
  return Number.isFinite(asNumber) ? `${asNumber} kg` : String(value);
}

function formatLifespan(value) {
  if (value === null || value === undefined || value === '') return 'Inconnu';
  const asNumber = Number(value);
  return Number.isFinite(asNumber) ? `${asNumber} ans` : String(value);
}

function normalizePlant(plant) {
  const rarity = Number(plant?.species_rarity ?? plant?.rarity);

  return {
    id: String(plant?.id ?? `${plant?.player_id || 'player'}-${plant?.species_id || Date.now()}`),
    name: plant?.gamification_name || plant?.species_name || plant?.name || 'Plante inconnue',
    scientificName: plant?.species_name || plant?.scientific_name || '',
    image: plant?.scan_url || plant?.image_url || plant?.image,
    type: 'flora',
    category: 'flora',
    rarity: Number.isFinite(rarity) ? Math.max(1, Math.min(5, Math.round(rarity))) : 1,
    effects: Array.isArray(plant?.effects) ? plant.effects : [],
    hp: Number(plant?.stat_pv ?? plant?.hp ?? 0),
    atk: Number(plant?.stat_atq ?? plant?.atk ?? 0),
    def: Number(plant?.stat_def ?? plant?.def ?? 0),
    spd: Number(plant?.stat_speed ?? plant?.spd ?? 0),
  };
}

async function fetchProfile(token) {
  const url = `${USER_API_URL}/api/user/profile`;
  const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  const { parsed: payload } = await parseResponseBody(response);
  if (!response.ok) throw new Error(payload?.message || 'Erreur api profil.');
  return payload;
}

export async function fetchPlants() {
  const token = await getToken();
  if (!token) {
      throw new Error('Token utilisateur manquant.');
  }

  try {
    const profile = await fetchProfile(token);
    const userId = profile?.id;

    if (!userId) {
        throw new Error('ID utilisateur introuvable dans le profil.');
    }

    const url = `${USER_API_URL}/api/user/${userId}/plants`;
    const response = await fetch(url, {
        method: 'GET',
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    const { parsed: data, raw } = await parseResponseBody(response);

    if (!response.ok) {
      const error = new Error(data?.message || data?.error || 'Impossible de recuperer la collection.');
      error.name = 'ApiError';
      error.details = {
          route: 'GET /api/user/:id/plants',
          url,
          status: response.status,
          statusText: response.statusText,
          payload: data,
          raw,
          tokenPreview: `${String(token).slice(0, 12)}...`,
          resolvedUserId: userId,
      };
      throw error;
    }

    const list = Array.isArray(data) ? data : [];
    return list.map(normalizePlant);
  } catch (error) {
    console.error('Erreur lors de la récupération des plantes :', error);
  }
}

async function linkPlantToAnimal(animalId, plantId) {
  try {
    const token = await getToken();
    const profileResponse = await fetch(`${USER_API_URL}/api/user/profile`, { headers: { Authorization: `Bearer ${token}` } });
    const { parsed: profile } = await parseResponseBody(profileResponse);
    const userId = profile?.id;
    if (!userId) return false;

    const url = `${USER_API_URL}/api/user/${userId}/creatures/${animalId}/link_plant`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ plantLinkId: plantId }),
    });

    return response.ok;
  } catch (error) {
    console.warn('Unable to link plant to animal via API:', error?.message || error);
    return false;
  }
}

async function unlinkPlantFromAnimal(animalId) {
  try {
    const token = await getToken();
    const profileResponse = await fetch(`${USER_API_URL}/api/user/profile`, { headers: { Authorization: `Bearer ${token}` } });
    const { parsed: profile } = await parseResponseBody(profileResponse);
    const userId = profile?.id;
    if (!userId) return false;

    const url = `${USER_API_URL}/api/user/${userId}/creatures/${animalId}/unlink_plant`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return response.ok;
  } catch (error) {
    console.warn('Unable to unlink plant from animal via API:', error?.message || error);
    return false;
  }
}

function getAnimalStatsWithPlantEffects(animal, availablePlants = []) {
  let hp = animal.hp ?? 50;
  let maxHp = animal.maxHp ?? 50;
  let atk = animal.atk ?? 10;
  let def = animal.def ?? 10;
  let spd = animal.spd ?? 10;

  if (animal.plantLinkId) {
    const plant = availablePlants.find((p) => String(p.id) === String(animal.plantLinkId));
    if (plant && plant.effects) {
      hp += plant.effects.hp || 0;
      maxHp += plant.effects.maxHp || 0;
      atk += plant.effects.atk || 0;
      def += plant.effects.def || 0;
      spd += plant.effects.spd || 0;
    }
  }

  return { hp, maxHp, atk, def, spd };
}

export default function CreatureDetailsPage() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id, animal: animalParam } = useLocalSearchParams();
  const [refreshKey, setRefreshKey] = useState(0);
  const [isPlantPickerOpen, setIsPlantPickerOpen] = useState(false);
  const [remoteMeasures, setRemoteMeasures] = useState(null);
  const [plants, setPlants] = useState([]);
  const [activePlantId, setActivePlantId] = useState(null);

  const baseAnimal = useMemo(() => {
    if (!animalParam || Array.isArray(animalParam)) return null;

    try {
      return JSON.parse(decodeURIComponent(animalParam));
    } catch {
      return null;
    }
  }, [animalParam]);

  const animal = useMemo(() => {
    if (!id || Array.isArray(id) || !baseAnimal) return null;
    if (String(baseAnimal.id) !== String(id)) return null;
    return { ...baseAnimal };
  }, [id, baseAnimal, refreshKey]);

  useEffect(() => {
    if (baseAnimal?.plantLinkId || baseAnimal?.plant_link_id) {
      setActivePlantId(baseAnimal.plantLinkId || baseAnimal.plant_link_id);
    }
  }, [baseAnimal]);

  useEffect(() => {
    if (remoteMeasures?.plantLinkId !== undefined && remoteMeasures?.plantLinkId !== null) {
      setActivePlantId(remoteMeasures.plantLinkId);
    }
  }, [remoteMeasures?.plantLinkId]);

  useEffect(() => {
    let isMounted = true;
    fetchPlants().then((res) => {
      if (isMounted && Array.isArray(res)) {
        setPlants(res);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadRemoteMeasures = async () => {
      if (!id || Array.isArray(id)) return;

      try {
        const token = await getToken();
        if (!token) return;

        const profileResponse = await fetch(`${USER_API_URL}/api/user/profile`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const { parsed: profile } = await parseResponseBody(profileResponse);
        const userId = profile?.id;
        if (!userId) return;

        const detailResponse = await fetch(`${USER_API_URL}/api/user/${userId}/creatures/${id}`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const { parsed: details } = await parseResponseBody(detailResponse);
        if (!detailResponse.ok || !details) return;

        const weightRaw = details?.weight
          ?? details?.species_average_weight
          ?? details?.average_weight
          ?? details?.average_weigt;

        const lifespanRaw = details?.lifespan
          ?? details?.species_average_life_expectancy
          ?? details?.average_life_expectancy
          ?? details?.average_life_expentancy
          ?? details?.life_expectancy;

        if (isMounted) {
          setRemoteMeasures({
            weight: formatWeight(weightRaw),
            lifespan: formatLifespan(lifespanRaw),
            plantLinkId: details?.plantLinkId || details?.plant_link_id || null,
            hp: details?.stat_pv,
            maxHp: details?.stat_pv,
            atk: details?.stat_atq,
            def: details?.stat_def,
            spd: details?.stat_speed,
          });
        }
      } catch (error) {
        console.warn('Unable to hydrate remote creature measures:', error?.message || error);
      }
    };

    loadRemoteMeasures();

    return () => {
      isMounted = false;
    };
  }, [id, refreshKey]);

  const meta = useMemo(() => {
    if (!animal) return null;
    
    // Local override of linked plant 
    const currentPlantId = activePlantId || remoteMeasures?.plantLinkId || animal.plantLinkId || animal.plant_link_id;
    
    const linkedPlantName = currentPlantId
      ? plants.find((plant) => String(plant.id) === String(currentPlantId))?.name
      : null;

    // Pass the overridden plantLinkId to stats calculator
    const modifiedAnimal = { ...animal, plantLinkId: currentPlantId };
    const modifiedStats = getAnimalStatsWithPlantEffects(modifiedAnimal, plants);

    let generatedEffects = Array.isArray(animal.effects) ? [...animal.effects] : [];
    if (animal.category === 'flora') {
      const pPv = Number(animal.hp ?? animal.stat_pv ?? 0);
      const pAtk = Number(animal.atk ?? animal.stat_atq ?? 0);
      const pDef = Number(animal.def ?? animal.stat_def ?? 0);
      const pSpd = Number(animal.spd ?? animal.stat_speed ?? 0);

      if (pPv > 0) generatedEffects.push(`+ ${pPv} PV`);
      if (pAtk > 0) generatedEffects.push(`+ ${pAtk} ATQ`);
      if (pDef > 0) generatedEffects.push(`+ ${pDef} DEF`);
      if (pSpd > 0) generatedEffects.push(`+ ${pSpd} VIT`);
    }

    return {
      scientificName: animal.name,
      ...animal,
      weight: remoteMeasures?.weight ?? formatWeight(
        animal.weight
        ?? animal.species_average_weight
        ?? animal.average_weight
        ?? animal.average_weigt
      ),
      lifespan: remoteMeasures?.lifespan ?? formatLifespan(
        animal.lifespan
        ?? animal.species_average_life_expectancy
        ?? animal.average_life_expectancy
        ?? animal.average_life_expentancy
        ?? animal.life_expectancy
      ),
      linkLabel: 'Lien vegetal',
      linkValue: linkedPlantName ?? animal.plantLink ?? 'Habitat inconnu',
      effects: generatedEffects,
      hp: remoteMeasures?.hp ?? modifiedStats.hp,
      maxHp: remoteMeasures?.maxHp ?? modifiedStats.maxHp,
      atk: remoteMeasures?.atk ?? modifiedStats.atk,
      def: remoteMeasures?.def ?? modifiedStats.def,
      spd: remoteMeasures?.spd ?? modifiedStats.spd,
    };
  }, [animal, plants, refreshKey, remoteMeasures, activePlantId]);

  const canPickPlant = Boolean(animal) && animal.category === 'fauna' && !activePlantId;
  const isPlante = animal?.category === 'flora';

  const handleSelectPlant = async (plantId) => {
    setActivePlantId(plantId);
    setIsPlantPickerOpen(false);
    await linkPlantToAnimal(animal.id, plantId);
    setRefreshKey((prev) => prev + 1);
  };

  const handleRemovePlant = async () => {
    setActivePlantId(null);
    setIsPlantPickerOpen(false);
    await unlinkPlantFromAnimal(animal.id);
    setRefreshKey((prev) => prev + 1);
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.errorText}>Creature introuvable.</Text>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Retour</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={[styles.fixedTopBar, { top: insets.top + 6 }]}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={16} color="#99613a" strokeWidth={2.5} />
          <Text style={styles.backButtonText}>Retour à la Collection</Text>
        </Pressable>
      </View>
      <ScrollView contentContainerStyle={styles.scrollContent} style={styles.container}>
        <View style={styles.imageHero}>
          <Image source={{ uri: animal.image }} style={styles.image} resizeMode="cover" />
        </View>

        <View style={styles.content}>
          <Text style={styles.name}>{animal.name}</Text>
          <Text style={styles.scientificName}>{meta.scientificName}</Text>

          {!isPlante && (
            <View style={styles.quickStatsRow}>
              <View style={styles.quickStatCard}>
                <View style={styles.quickStatHeader}>
                  <Scale size={14} color="#c29b74" strokeWidth={2.4} />
                  <Text style={styles.quickStatLabel}>Poids</Text>
                </View>
                <Text style={styles.quickStatValue}>{meta.weight}</Text>
              </View>

              <View style={styles.quickStatCard}>
                <View style={styles.quickStatHeader}>
                  <Timer size={14} color="#c29b74" strokeWidth={2.4} />
                  <Text style={styles.quickStatLabel}>Esperance de vie</Text>
                </View>
                <Text style={styles.quickStatValue}>{meta.lifespan}</Text>
              </View>
            </View>
          )}

          {animal.category === 'fauna' && plants.length > 0 && (
            <>
              <Pressable
                style={[styles.plantCard, canPickPlant && styles.plantCardSelectable]}
                onPress={() => {
                  if (canPickPlant) {
                    setIsPlantPickerOpen((current) => !current);
                  }
                }}
              >
                <View style={styles.plantBadge}>
                  <Leaf size={18} color="#4e8a5f" strokeWidth={2.3} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.plantLabel}>{meta.linkLabel}</Text>
                  <Text style={styles.plantValue}>
                    {canPickPlant ? 'Choisir un vegetal' : meta.linkValue}
                  </Text>
                </View>
                {!canPickPlant && (
                  <Pressable
                    style={styles.removeButton}
                    onPress={(e) => {
                      e.stopPropagation();
                      handleRemovePlant();
                    }}
                  >
                    <X size={18} color="#b72030" strokeWidth={2.5} />
                  </Pressable>
                )}
              </Pressable>

              {canPickPlant && isPlantPickerOpen && (
                <View style={styles.plantPicker}>
                  {plants.map((plant) => (
                    <Pressable
                      key={plant.id}
                      style={styles.plantOption}
                      onPress={() => handleSelectPlant(plant.id)}
                    >
                      <Text style={styles.plantOptionName}>{plant.name}</Text>
                      <Text style={styles.plantOptionSubtitle}>{plant.scientificName}</Text>
                      <View style={styles.plantOptionStatsRow}>
                        {plant.hp > 0 && <Text style={styles.plantOptionStatPill}>+{plant.hp} PV</Text>}
                        {plant.atk > 0 && <Text style={styles.plantOptionStatPill}>+{plant.atk} ATQ</Text>}
                        {plant.def > 0 && <Text style={styles.plantOptionStatPill}>+{plant.def} DEF</Text>}
                        {plant.spd > 0 && <Text style={styles.plantOptionStatPill}>+{plant.spd} VIT</Text>}
                      </View>
                    </Pressable>
                  ))}
                </View>
              )}
            </>
          )}

          {!isPlante && (
            <>
              <Text style={styles.sectionTitle}>Statistiques de combat</Text>

              <View style={styles.statsGrid}>
                <StatCard label="PV" value={meta.hp} max={meta.maxHp} color="#b72030" Icon={Heart} />
                <StatCard label="ATQ" value={meta.atk} color="#b72030" Icon={Zap} />
                <StatCard label="DEF" value={meta.def} color="#8ca79e" Icon={Shield} />
                <StatCard label="VIT" value={meta.spd} color="#9dcbe0" Icon={Timer} />
              </View>
            </>
          )}

          {isPlante && (
            <>
              <Text style={styles.sectionTitle}>Statistiques octroyées</Text>

              <View style={styles.statsGrid}>
                <StatCard label="PV" value={`+${meta.hp}`} max={meta.maxHp} color="#4e8a5f" Icon={Heart} />
                <StatCard label="ATQ" value={`+${meta.atk}`} color="#4e8a5f" Icon={Zap} />
                <StatCard label="DEF" value={`+${meta.def}`} color="#4e8a5f" Icon={Shield} />
                <StatCard label="VIT" value={`+${meta.spd}`} color="#4e8a5f" Icon={Timer} />
              </View>
            </>
          )}

          <View style={styles.rarityCard}>
            <View>
              <Text style={styles.rarityLabel}>Niveau de rarete</Text>
              <View style={styles.rarityStarsRow}>
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    size={18}
                    color={i < animal.rarity ? '#f59e0b' : '#d8c9ad'}
                    fill={i < animal.rarity ? '#f59e0b' : 'transparent'}
                  />
                ))}
              </View>
            </View>
            <View style={styles.rarityValueBlock}>
              <Text style={styles.rarityValue}>{animal.rarity}</Text>
              <Text style={styles.rarityDenominator}>/ 5</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f2f6f3',
  },
  scrollContent: {
    paddingTop: 92,
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  imageHero: {
    height: 220,
    overflow: 'hidden',
    borderRadius: 24,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#dcc6aa',
  },
  content: {
    paddingHorizontal: 4,
    paddingBottom: 32,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  name: {
    fontSize: 27,
    lineHeight: 32,
    fontWeight: '900',
    textAlign: 'center',
    color: '#121212',
    marginBottom: 4,
  },
  scientificName: {
    fontSize: 15,
    fontStyle: 'italic',
    textAlign: 'center',
    color: '#bf8f68',
    marginBottom: 22,
  },
  quickStatsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 14,
  },
  quickStatCard: {
    flex: 1,
    backgroundColor: '#efe7d8',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#dcc6aa',
    padding: 12,
  },
  quickStatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  quickStatLabel: {
    fontSize: 12,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: '#c29b74',
    fontWeight: '700',
  },
  quickStatValue: {
    fontSize: 20,
    lineHeight: 24,
    fontWeight: '900',
    color: '#121212',
  },
  plantCard: {
    backgroundColor: '#c4d4c7',
    borderColor: '#97b39d',
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    marginBottom: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  plantCardSelectable: {
    borderStyle: 'dashed',
  },
  plantBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e3ece4',
  },
  plantLabel: {
    textTransform: 'uppercase',
    fontSize: 12,
    letterSpacing: 1,
    color: '#699271',
    fontWeight: '700',
    marginBottom: 2,
  },
  plantValue: {
    fontSize: 22,
    lineHeight: 26,
    fontWeight: '900',
    color: '#2b6a3b',
  },
  removeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 'auto',
  },
  plantPicker: {
    marginTop: -8,
    marginBottom: 18,
    backgroundColor: '#edf3ee',
    borderWidth: 1,
    borderColor: '#c0d3c4',
    borderRadius: 14,
    overflow: 'hidden',
  },
  plantOption: {
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: '#d6e3d9',
  },
  plantOptionName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2b6a3b',
  },
  plantOptionSubtitle: {
    fontSize: 12,
    color: '#5f7c68',
    marginTop: 2,
    marginBottom: 6,
  },
  plantOptionStatsRow: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  plantOptionStatPill: {
    backgroundColor: '#d6e3d9',
    color: '#2b6a3b',
    fontSize: 10,
    fontWeight: '800',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    overflow: 'hidden',
  },
  effectsCard: {
    backgroundColor: '#edf3ee',
    borderWidth: 1,
    borderColor: '#c0d3c4',
    borderRadius: 14,
    padding: 12,
    gap: 10,
    marginBottom: 16,
  },
  effectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  effectText: {
    flex: 1,
    fontSize: 13,
    color: '#2b6a3b',
    fontWeight: '600',
  },
  sectionTitle: {
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: '#8f5d37',
    fontSize: 16,
    fontWeight: '900',
    marginBottom: 10,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 10,
    marginBottom: 16,
  },
  statCard: {
    width: '48.5%',
    backgroundColor: '#efe7d8',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#dcc6aa',
    padding: 12,
    minHeight: 112,
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  statTitle: {
    fontSize: 12,
    letterSpacing: 1,
    color: '#9f8a72',
    fontWeight: '700',
  },
  statIconBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#e4ded0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statNumber: {
    fontSize: 29,
    lineHeight: 33,
    fontWeight: '900',
    marginBottom: 8,
  },
  statTrack: {
    width: '100%',
    height: 6,
    borderRadius: 8,
    backgroundColor: '#dfd7c8',
    overflow: 'hidden',
  },
  statFill: {
    height: '100%',
    borderRadius: 8,
  },
  rarityCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f3e0bb',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#f2bc56',
    padding: 12,
  },
  rarityLabel: {
    textTransform: 'uppercase',
    fontSize: 12,
    letterSpacing: 1,
    color: '#bb8a4f',
    fontWeight: '700',
    marginBottom: 6,
  },
  rarityStarsRow: {
    flexDirection: 'row',
    gap: 4,
  },
  rarityValueBlock: {
    alignItems: 'flex-end',
  },
  rarityValue: {
    fontSize: 28,
    lineHeight: 30,
    fontWeight: '900',
    color: '#da7f00',
  },
  rarityDenominator: {
    fontSize: 14,
    fontWeight: '700',
    color: '#bb8a4f',
  },
  fixedTopBar: {
    position: 'absolute',
    left: 20,
    right: 20,
    zIndex: 30,
    elevation: 30,
  },
  backButton: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,248,236,0.92)',
    borderWidth: 1,
    borderColor: '#d8c5a7',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  backButtonText: {
    color: '#99613a',
    fontWeight: '700',
    fontSize: 13,
  },
  errorText: {
    color: '#8b3a3a',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
});
