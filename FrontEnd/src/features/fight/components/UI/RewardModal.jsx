import React from 'react';
import { Modal, View, Text, StyleSheet, Pressable, Animated } from 'react-native';
import { Trophy, Star, Coins } from 'lucide-react-native';
import colors from '@/assets/constants/colors.json';

export const RewardModal = ({ visible, rewards, onClose }) => {
    if (!rewards) return null;

    return (
        <Modal
            transparent
            visible={visible}
            animationType="fade"
        >
            <View style={styles.overlay}>
                <View style={styles.modalContainer}>
                    {/* Header with Trophy */}
                    <View style={styles.header}>
                        <View style={styles.trophyCircle}>
                            <Trophy size={40} color={colors.orangeDuel} />
                        </View>
                        <Text style={styles.title}>VICTOIRE !</Text>
                    </View>

                    <Text style={styles.subtitle}>Félicitations Explorateur ! Voici vos récompenses :</Text>

                    {/* Reward Rows */}
                    <View style={styles.rewardsList}>
                        <View style={styles.rewardItem}>
                            <View style={styles.iconContainer}>
                                <Star size={24} color={colors.marronCuir} fill={colors.marronCuir} />
                            </View>
                            <View style={styles.rewardTextContainer}>
                                <Text style={styles.rewardValue}>+{rewards.xp}</Text>
                                <Text style={styles.rewardLabel}>Points d'Expérience</Text>
                            </View>
                        </View>

                        <View style={styles.rewardItem}>
                            <View style={[styles.iconContainer, { backgroundColor: colors.orangeDuel + '20' }]}>
                                <Coins size={24} color={colors.orangeDuel} />
                            </View>
                            <View style={styles.rewardTextContainer}>
                                <Text style={styles.rewardValue}>+{rewards.bioTokens}</Text>
                                <Text style={styles.rewardLabel}>BioTokens</Text>
                            </View>
                        </View>
                    </View>

                    {/* Button */}
                    <Pressable 
                        onPress={onClose}
                        style={({ pressed }) => [
                            styles.button,
                            pressed && styles.buttonPressed
                        ]}
                    >
                        <Text style={styles.buttonText}>CONTINUER</Text>
                    </Pressable>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.8)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContainer: {
        width: '90%',
        backgroundColor: colors.blancJauni,
        borderRadius: 20,
        padding: 24,
        alignItems: 'center',
        borderWidth: 3,
        borderColor: colors.marronCuir,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.5,
        shadowRadius: 15,
        elevation: 10,
    },
    header: {
        alignItems: 'center',
        marginBottom: 20,
    },
    trophyCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: colors.marronCuir + '15',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
        borderWidth: 2,
        borderColor: colors.orangeDuel,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: colors.marronCuir,
        letterSpacing: 2,
        fontFamily: 'serif', // Matches notebook style
    },
    subtitle: {
        fontSize: 16,
        color: colors.marronCuir + 'CC',
        textAlign: 'center',
        marginBottom: 30,
        fontFamily: 'serif',
    },
    rewardsList: {
        width: '100%',
        marginBottom: 30,
    },
    rewardItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF80',
        padding: 15,
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: colors.marronCuir + '20',
    },
    iconContainer: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: colors.marronCuir + '10',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    rewardTextContainer: {
        flex: 1,
    },
    rewardValue: {
        fontSize: 20,
        fontWeight: 'bold',
        color: colors.marronCuir,
    },
    rewardLabel: {
        fontSize: 12,
        color: colors.marronCuir + '99',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    button: {
        backgroundColor: colors.marronCuir,
        paddingVertical: 15,
        paddingHorizontal: 40,
        borderRadius: 30,
        width: '100%',
        alignItems: 'center',
        shadowColor: colors.marronCuir,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 5,
    },
    buttonPressed: {
        transform: [{ scale: 0.98 }],
        opacity: 0.9,
    },
    buttonText: {
        color: colors.blancJauni,
        fontSize: 18,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
});
