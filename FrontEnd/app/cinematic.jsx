import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'expo-router';
import {
  Animated,
  Dimensions,
  Image,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { Asset } from 'expo-asset';

const { width: W, height: H } = Dimensions.get('window');

// ─── Assets ──────────────────────────────────────────────────────────────────
const SLIDES = [
  {
    image: require('./images/Start.png'),
    caption:
      'Pendant des siècles, le monde a prospéré en parfaite harmonie, un âge d\'or où la nature et la technologie ne faisaient qu\'un.',
  },
  {
    image: require('./images/Attack.png'),
    caption:
      "Puis vint l'Erosion. Des entités connues sous le nom de 'Vides' sont descendues sur Terre, cherchant à effacer la réalité.",
  },
  {
    image: require('./images/Observer.png'),
    caption:
      "Face à ce cataclysme, les Observateurs sont apparus. Leur mission : scanner, documenter et préserver l'essence même de la vie.",
  },
  {
    image: require('./images/Combat.png'),
    caption:
      'Grâce à leurs appareils, ils matérialisent et sauvegardes les créatures disparues pour repousser le Vide.',
  },
];

// ─── Timing ──────────────────────────────────────────────────────────────────
const SLIDE_HOLD = 5500;  // how long each slide stays
const CROSSFADE_MS = 1300;  // crossfade duration
const WHITEOUT_MS = 3000;  // distortion → white duration
const FINALE_DELAY = 800;   // pause before finale text
const FINALE_HOLD = 4000;  // how long to hold finale

// ─── Component ───────────────────────────────────────────────────────────────
export default function Cinematic() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  // One opacity value per slide
  const opacities = useRef(
    SLIDES.map((_, i) => new Animated.Value(i === 0 ? 1 : 0))
  ).current;

  // Caption for the active slide
  const captionAnim = useRef(new Animated.Value(0)).current;

  // Ken Burns (scale) — one per slide so crossfades are smooth
  const scales = useRef(
    SLIDES.map(() => new Animated.Value(1))
  ).current;

  // Glitch X jitter — applied to last slide during whiteout
  const glitchX = useRef(new Animated.Value(0)).current;

  // White overlay on top
  const whiteOpacity = useRef(new Animated.Value(0)).current;

  // Finale "It's my turn now." text
  const finaleOpacity = useRef(new Animated.Value(0)).current;

  // Track current index without re-render dependency in callbacks
  const indexRef = useRef(0);

  // ── Helpers ──────────────────────────────────────────────────────────────

  const fadeCaption = () => {
    captionAnim.setValue(0);
    Animated.timing(captionAnim, {
      toValue: 1,
      duration: 1200,
      delay: 400,
      useNativeDriver: true,
    }).start();
  };

  const startKenBurns = (index) => {
    scales[index].setValue(1);
    Animated.timing(scales[index], {
      toValue: 1.15,
      duration: 12000,
      useNativeDriver: true,
    }).start();
  };

  // ── Preload all images before starting ─────────────────────────────────

  useEffect(() => {
    Asset.loadAsync(SLIDES.map((s) => s.image)).then(() => setReady(true));
  }, []);

  // ── Main sequence (runs once images are ready) ───────────────────────────

  useEffect(() => {
    if (!ready) return;
    const timers = [];

    // Show first slide caption & Ken Burns
    fadeCaption();
    startKenBurns(0);

    const advance = (fromIndex) => {
      const t = setTimeout(() => {
        const toIndex = fromIndex + 1;

        // Hide current caption immediately
        captionAnim.setValue(0);

        if (toIndex < SLIDES.length) {
          // ── Crossfade to next slide ──
          startKenBurns(toIndex);
          Animated.parallel([
            Animated.timing(opacities[fromIndex], {
              toValue: 0,
              duration: CROSSFADE_MS,
              useNativeDriver: true,
            }),
            Animated.timing(opacities[toIndex], {
              toValue: 1,
              duration: CROSSFADE_MS,
              useNativeDriver: true,
            }),
          ]).start(() => {
            indexRef.current = toIndex;
            setCurrentIndex(toIndex);
            fadeCaption();
            advance(toIndex);
          });
        } else {
          // ── Whiteout + glitch ──

          // Jitter loop
          const jitter = Animated.loop(
            Animated.sequence([
              Animated.timing(glitchX, { toValue: 9, duration: 70, useNativeDriver: true }),
              Animated.timing(glitchX, { toValue: -9, duration: 70, useNativeDriver: true }),
              Animated.timing(glitchX, { toValue: 5, duration: 60, useNativeDriver: true }),
              Animated.timing(glitchX, { toValue: -5, duration: 60, useNativeDriver: true }),
              Animated.timing(glitchX, { toValue: 0, duration: 100, useNativeDriver: true }),
              Animated.delay(180),
            ])
          );
          jitter.start();

          // Scale swell during whiteout
          Animated.timing(scales[SLIDES.length - 1], {
            toValue: 1.35,
            duration: WHITEOUT_MS,
            useNativeDriver: true,
          }).start();

          // White overlay fade-in
          Animated.timing(whiteOpacity, {
            toValue: 1,
            duration: WHITEOUT_MS,
            useNativeDriver: true,
          }).start(({ finished }) => {
            if (!finished) return;
            jitter.stop();

            // Finale text
            const t1 = setTimeout(() => {
              Animated.timing(finaleOpacity, {
                toValue: 1,
                duration: 1800,
                useNativeDriver: true,
              }).start();
            }, FINALE_DELAY);

            const t2 = setTimeout(() => {
              router.replace('/');
            }, FINALE_DELAY + FINALE_HOLD);

            timers.push(t1, t2);
          });
        }
      }, SLIDE_HOLD);

      timers.push(t);
    };

    advance(0);

    return () => timers.forEach(clearTimeout);
  }, [ready]);

  // ── Render ───────────────────────────────────────────────────────────────

  if (!ready) {
    return <View style={styles.root}><StatusBar hidden /></View>;
  }

  return (
    <View style={styles.root}>
      <StatusBar hidden />

      {/* Letterbox — top */}
      <View style={styles.barTop} />

      {/* Slides */}
      {SLIDES.map((slide, i) => (
        <Animated.View key={i} style={[styles.slide, { opacity: opacities[i] }]}>
          <Animated.Image
            source={slide.image}
            style={[
              styles.image,
              {
                transform: [
                  { scale: scales[i] },
                  // glitch only on last slide
                  { translateX: i === SLIDES.length - 1 ? glitchX : 0 },
                ],
              },
            ]}
            resizeMode="cover"
          />

          {/* Bottom vignette */}
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.75)']}
            style={styles.vignette}
          />

          {/* Caption — only for the active slide */}
          {i === currentIndex && (
            <Animated.View style={[styles.captionWrap, { opacity: captionAnim }]}>
              <Text style={styles.captionText}>{slide.caption}</Text>
            </Animated.View>
          )}
        </Animated.View>
      ))}

      {/* White overlay + finale text */}
      <Animated.View style={[styles.whiteOverlay, { opacity: whiteOpacity }]}>
        <Animated.Text style={[styles.finaleText, { opacity: finaleOpacity }]}>
          À toi de jouer
        </Animated.Text>
      </Animated.View>

      {/* Letterbox — bottom */}
      <View style={styles.barBottom} />
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000',
  },
  slide: {
    position: 'absolute',
    width: W,
    height: H,
  },
  image: {
    width: W,
    height: H,
  },
  vignette: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: H * 0.55,
  },
  captionWrap: {
    position: 'absolute',
    bottom: H * 0.14,
    left: 24,
    right: 24,
    alignItems: 'center',
  },
  captionText: {
    fontFamily: 'serif',
    fontSize: 17,
    lineHeight: 27,
    color: '#f2e6c8',
    textAlign: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(0,0,0,0.45)',
    letterSpacing: 0.4,
    borderLeftWidth: 2,
    borderRightWidth: 2,
    borderColor: 'rgba(210,180,110,0.55)',
  },
  whiteOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: W,
    height: H,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  finaleText: {
    fontFamily: 'serif',
    fontSize: 26,
    fontWeight: '600',
    letterSpacing: 6,
    textTransform: 'uppercase',
    color: '#1a1a1a',
    textAlign: 'center',
  },
  barTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: H * 0.055,
    backgroundColor: '#000',
    zIndex: 10,
  },
  barBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: H * 0.055,
    backgroundColor: '#000',
    zIndex: 10,
  },
});
