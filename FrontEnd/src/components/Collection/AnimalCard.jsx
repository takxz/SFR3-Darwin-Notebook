import React from "react";
import { View, Text, Image, Pressable, StyleSheet, Dimensions } from "react-native";
import { Star, Wind, Droplets, Bug, PawPrint, Leaf } from "lucide-react-native";
import { getAnimalStatsWithPlantEffects } from "../../utils/tempCollectionApi";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_GAP = 16;
const DEFAULT_CARD_WIDTH = (SCREEN_WIDTH - 16 * 2 - CARD_GAP) / 2;

const getTypeConfig = (type) => {
  if (type === 'fauna') return { Icon: PawPrint, color: '#90AAA1' };
  if (type === 'flora') return { Icon: Leaf, color: '#2E6F40' };
  if (!type) return { Icon: Bug, color: '#ff0000' };
  return { Icon: Star, color: '#cab93c' };
};

/**
 * Dex grid card showing animal image, rarity stars, and animated HP bar.
 * Designed for use in a FlatList with numColumns={2}.
 */
export function AnimalCard({
  animal,
  cardWidth = DEFAULT_CARD_WIDTH,
  onPress,
}) {
  // Get modified stats based on linked plant effects
  const modifiedStats = getAnimalStatsWithPlantEffects(animal);
  const { Icon: TypeIcon, color: typeColor } = getTypeConfig(animal.type);

  return (
    <Pressable
      onPress={onPress}
      style={[styles.card, { width: cardWidth }]}
    >
      {/* Image */}
      <View style={styles.imageContainer}>
        <View style={styles.imageWrapper}>
          <Image
            source={{ uri: animal.image }}
            style={styles.image}
            resizeMode="cover"
          />
          {/* Type Badge */}
          <View style={styles.typeBadge}>
            <TypeIcon size={14} color={typeColor} strokeWidth={2.5} />
          </View>
        </View>
      </View>

      {/* Info */}
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>
          {animal.name}
        </Text>

        {/* Rarity Stars */}
        <View style={styles.stars}>
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              size={12}
              color={i < animal.rarity ? "#fbbf24" : "rgba(151,87,43,0.35)"}
              fill={i < animal.rarity ? "#fbbf24" : "transparent"}
            />
          ))}
        </View>

        {/* Max HP - Hidden for plants (flora) */}
        {animal.type !== 'flora' && (
          <View style={styles.hpContainer}>
            <Text style={styles.hpLabel}>Max HP</Text>
            <View style={styles.hpPill}>
              <Text style={styles.hpValue}>{modifiedStats.maxHp}</Text>
            </View>
          </View>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: CARD_GAP,
    borderRadius: 24,
    backgroundColor: "rgba(250,235,215,0.8)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,1)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 24,
    elevation: 3,
    overflow: "hidden",
  },
  imageContainer: {
    aspectRatio: 1,
    padding: 8,
  },
  imageWrapper: {
    flex: 1,
    borderRadius: 16,
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  typeBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(0,0,0,0.3)",
    padding: 6,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  info: {
    padding: 12,
    paddingTop: 4,
    gap: 8,
  },
  name: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#97572B",
  },
  stars: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  hpHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 4,
  },
  hpContainer: {
    marginTop: 2,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "transparent",
    borderRadius: 12,
    paddingHorizontal: 0,
    paddingVertical: 2,
  },
  hpLabel: {
    fontSize: 10,
    fontWeight: "bold",
    color: "rgba(151,87,43,0.7)",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  hpValue: {
    fontSize: 11,
    fontWeight: "800",
    color: "#97572B",
  },
  hpPill: {
    minWidth: 46,
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.55)",
    borderRadius: 9999,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  hpTrack: {
    height: 6,
    width: "100%",
    backgroundColor: "#d1fae5",
    borderRadius: 9999,
    overflow: "hidden",
  },
  hpFill: {
    height: "100%",
    borderRadius: 9999,
  },
});
