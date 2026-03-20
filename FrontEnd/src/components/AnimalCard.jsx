import React from "react";
import { View, Text, Image, StyleSheet, Dimensions } from "react-native";
import { Star, Wind, Droplets, Bug, PawPrint, Leaf } from "lucide-react-native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_GAP = 16;
const DEFAULT_CARD_WIDTH = (SCREEN_WIDTH - 16 * 2 - CARD_GAP) / 2;

const getTypeConfig = (type) => {
  switch (type) {
    case 'flying': return { Icon: Wind, color: '#ABDDF1' };
    case 'marine': return { Icon: Droplets, color: '#006994' };
    case 'insect': return { Icon: Bug, color: '#00CEC8' };
    case 'flora': return { Icon: Leaf, color: '#2E6F40' };
    case 'terrestrial': 
    default:
      return { Icon: PawPrint, color: '#90AAA1' };
  }
};

/**
 * Dex grid card showing animal image, rarity stars, and animated HP bar.
 * Designed for use in a FlatList with numColumns={2}.
 */
export function AnimalCard({
  animal,
  index = 0,
  cardWidth = DEFAULT_CARD_WIDTH,
}) {
  const hpPercentage = (animal.hp / animal.maxHp) * 100;
  const { Icon: TypeIcon, color: typeColor } = getTypeConfig(animal.type);

  return (
    <View
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
              color={i < animal.rarity ? "#fbbf24" : "rgba(151,87,43,0.1)"}
              fill={i < animal.rarity ? "#fbbf24" : "transparent"}
            />
          ))}
        </View>

        {/* HP Bar */}
        <View>
          <View style={styles.hpHeader}>
            <Text style={styles.hpLabel}>HP</Text>
            <Text style={styles.hpValue}>
              {animal.hp}/{animal.maxHp}
            </Text>
          </View>
          <View style={styles.hpTrack}>
            <View
              from={{ width: "0%" }}
              animate={{ width: `${hpPercentage}%` }}
              transition={{
                type: "timing",
                duration: 1000,
                delay: 500 + index * 100,
              }}
              style={[
                styles.hpFill,
                {
                  backgroundColor:
                    hpPercentage > 50 ? "#A8DCAB" : "#f59e0b",
                },
              ]}
            />
          </View>
        </View>
      </View>
    </View>
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
  hpLabel: {
    fontSize: 10,
    fontWeight: "bold",
    color: "rgba(151,87,43,0.5)",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  hpValue: {
    fontSize: 10,
    fontWeight: "600",
    color: "rgba(151,87,43,0.7)",
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
