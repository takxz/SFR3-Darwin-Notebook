import { useMemo, useState } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, Pressable } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Heart, Leaf, Scale, Shield, Star, Timer, Zap, X } from 'lucide-react-native';
import {
  getCollectionAnimalDetailsById,
  getCollectionPlants,
  linkPlantToAnimal,
  unlinkPlantFromAnimal,
  getAnimalStatsWithPlantEffects,
} from '../../src/utils/tempCollectionApi';

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

export default function CreatureDetailsPage() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams();
  const [refreshKey, setRefreshKey] = useState(0);
  const [isPlantPickerOpen, setIsPlantPickerOpen] = useState(false);

  const animal = useMemo(() => {
    if (!id || Array.isArray(id)) return null;
    const foundAnimal = getCollectionAnimalDetailsById(id);
    return foundAnimal ? { ...foundAnimal } : null;
  }, [id, refreshKey]);

  const plants = useMemo(() => getCollectionPlants(), []);

  const meta = useMemo(() => {
    if (!animal) return null;
    const linkedPlantName = animal.plantLinkId
      ? getCollectionAnimalDetailsById(animal.plantLinkId)?.name
      : null;

    // Get modified stats based on plant effects
    const modifiedStats = getAnimalStatsWithPlantEffects(animal);

    return {
      scientificName: animal.name,
      ...animal,
      weight: animal.weight ?? 'Inconnu',
      lifespan: animal.lifespan ?? 'Inconnu',
      linkLabel: 'Lien vegetal',
      linkValue: linkedPlantName ?? animal.plantLink ?? 'Habitat inconnu',
      effects: Array.isArray(animal.effects) ? animal.effects : [],
      hp: modifiedStats.hp,
      maxHp: modifiedStats.maxHp,
      atk: modifiedStats.atk,
      def: modifiedStats.def,
      spd: modifiedStats.spd,
    };
  }, [animal, refreshKey]);

  const canPickPlant = Boolean(animal) && animal.category === 'fauna' && !animal.plantLinkId;
  const isFlora = animal?.category === 'flora';

  const handleSelectPlant = (plantId) => {
    if (!animal) return;

    const wasLinked = linkPlantToAnimal(animal.id, plantId);

    if (wasLinked) {
      setIsPlantPickerOpen(false);
      setRefreshKey((current) => current + 1);
    }
  };

  const handleRemovePlant = () => {
    if (!animal) return;

    const wasUnlinked = unlinkPlantFromAnimal(animal.id);

    if (wasUnlinked) {
      setIsPlantPickerOpen(false);
      setRefreshKey((current) => current + 1);
    }
  };

  if (!animal) {
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

          {!isFlora && (
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

          {animal.category === 'fauna' && (
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
                    </Pressable>
                  ))}
                </View>
              )}
            </>
          )}

          {!isFlora && (
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

          {isFlora && (
            <>
              <Text style={styles.sectionTitle}>Effets actifs</Text>
              <View style={styles.effectsCard}>
                {meta.effects.length > 0 ? (
                  meta.effects.map((effect, index) => (
                    <View key={`${effect}-${index}`} style={styles.effectRow}>
                      <Leaf size={14} color="#4e8a5f" strokeWidth={2.3} />
                      <Text style={styles.effectText}>{effect}</Text>
                    </View>
                  ))
                ) : (
                  <Text style={styles.effectText}>Aucun effet actif.</Text>
                )}
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
