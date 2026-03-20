
import React from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';

export function LoadingScreen({ progress }) {
    return (
        <View style={[StyleSheet.absoluteFill, styles.loadingContainer]}>
            <View style={styles.loadingInner}>
                <Text style={styles.loadingTitle}>INITIALIZING ABYSSAL DIMENSION...</Text>
                <View style={styles.progressBar}>
                    <Animated.View style={{ width: `${progress}%`, height: '100%', backgroundColor: '#ffaa00' }} />
                </View>
                <Text style={styles.progressText}>{progress}%</Text>
                <Text style={styles.loadingSubtext}>WAITING FOR GPU COMPILATION & AUDIO CACHE</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    loadingContainer: {
        backgroundColor: '#000',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 9999,
    },
    loadingInner: {
        width: '80%',
        alignItems: 'center',
    },
    loadingTitle: {
        color: '#ff4400',
        fontSize: 12,
        fontWeight: 'bold',
        letterSpacing: 5,
        marginBottom: 10,
    },
    progressBar: {
        width: '100%',
        height: 4,
        backgroundColor: '#111',
        borderRadius: 2,
        overflow: 'hidden',
    },
    progressText: {
        marginTop: 20,
        color: '#ffffff',
        fontSize: 32,
        fontWeight: '900',
        letterSpacing: 2,
    },
    loadingSubtext: {
        color: 'rgba(255,255,255,0.3)',
        fontSize: 10,
        marginTop: 40,
        letterSpacing: 1,
        textAlign: 'center',
    },
});
